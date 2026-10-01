// let client_cache = undefined
async function get_split_client() {

    // If client in cache, return the cached client
    // if( client_cache ) return client_cache

    // Dependencies
    const { SplitsClient } = await import( '@0xsplits/splits-sdk' )
    const { get_public_client, get_wallet_client, resolve_address_to_ens } = require( '../modules/web3' )
    const { arbitrum, mainnet } = require( 'viem/chains' )
    const { log, round_to_decimals } = require( '../modules/helpers' )
    const { SPLITTER_PRIVATE_HOTKEY } = process.env

    // Create public client
    const publicClient = await get_public_client( arbitrum )

    // Create wallet client
    const walletClient = await get_wallet_client( arbitrum, SPLITTER_PRIVATE_HOTKEY )
    
    // Create a mainnet ens client
    const ensPublicClient = await get_public_client( mainnet )

    // Check that the clients work
    const blockNumber = await publicClient.getBlockNumber() 
    log( `Block number from public client: ${ blockNumber }` )
    const gasPrice = await publicClient.getGasPrice() 
    log( `Gas price from public client: ${ gasPrice }` )
    const signature = await walletClient.signMessage( {  message: 'hello world' } )
    log( `Signature from wallet client: ${ signature }` )

    // Create splits client
    const client = new SplitsClient( {
        chainId: arbitrum.id,
        publicClient,
        walletClient,
        ensPublicClient,
        includeEnsNames: true,
    } )

    // Cache client
    // client_cache = client

    // Return client
    return client

}

exports.update_split = async function() {

    // Dependencies
    const { dataFromSnap, db } = require( '../modules/firebase' )
    const { log } = require( '../modules/helpers' )
    const { resolve_ens_to_address } = require( '../modules/web3' )
    const { SPLIT_ADDRESS, ONIONDAO_REWARDS_THREAD_ID: thread_id } = process.env


    // Check if there is chain congestion
    const { is_gas_price_safe } = require( '../modules/web3' )
    const { safe, gas_price_gwei } = await is_gas_price_safe()
    log( `Gas price: ${ gas_price_gwei } gwei, safe: ${ safe }` )
    if( !safe ) return log( `Gas price is too high at ${ gas_price_gwei } gwei not updating split` )

    // Get all relays that exceed the minimum score
    const nodes = await db.collection( 'tor_nodes' ).where( 'running', '==', true ).get().then( dataFromSnap )
    log( `Running node count: ${ nodes.length }` )

    // Weighted recipients, throws rather than redistributing shares on any lookup failure
    const { build_split_recipients } = require( '../modules/split_recipients' )
    const dao_address = await resolve_ens_to_address( 'oniondao.eth' )
    if( !dao_address ) throw new Error( `Could not resolve oniondao.eth` )
    const recipients = await build_split_recipients( nodes, resolve_ens_to_address, dao_address )
    log( `Recipients:`, recipients.length )

    // Get the split client
    const client = await get_split_client()

    // One split update per day, even if the scheduler delivers twice. Claimed last so failed setup doesn't use up the day.
    const { claim_daily_run } = require( '../modules/daily_run' )
    const run = await claim_daily_run( 'update_split' )
    if( !run ) return log( `Split already updated today, skipping` )

    // Update the split
    log( `Updating split ${ SPLIT_ADDRESS } with ${ recipients.length } recipients` )
    const updates = {
        splitAddress: SPLIT_ADDRESS,
        recipients,
        distributorFeePercent: 0,
    }
    log( `Updates:`, updates )
    // Errors here almost always happen before broadcasting (estimation, validation), release the day so it can be retried.
    // A repeated split update is harmless: it sets the same recipients again.
    let response
    try {
        response = await client.updateSplit( updates )
    } catch ( e ) {
        await run.delete()
        throw e
    }
    // const response = { event: { transactionHash: '0x1234567890' } }
    log( `Split updated:`, response )
    const { transactionHash } = response.event
    await run.update( { finished: Date.now(), transaction_hash: transactionHash, recipients: recipients.length } )

    // Ping mentor
    // const { ping_mentor } = require( '../modules/pushover' )
    // await ping_mentor( {
    //     title: `Split updated`,
    //     message: `${ recipients.length } recipients added, gas price ${ gas_price_gwei } gwei, safe: ${ safe }`,
    //     url: `https://app.splits.org/accounts/${ SPLIT_ADDRESS }/?chainId=42161`
    // } )

    // Resolve all addresses to ENS names
    const { resolve_address_to_ens } = require( '../modules/web3' )
    const { round_to_decimals } = require( '../modules/helpers' )
    const as_table = require( 'as-table' )
    const resolved_recipients = await Promise.all( recipients.map( async ( { address, cumulative_bandwidth_mib, ...recipient } ) => ( {
        address: await resolve_address_to_ens( address ),
        cumulative_bandwidth_mib: cumulative_bandwidth_mib || 0,
        ...recipient
    } ) ) )
    resolved_recipients.sort( ( a, b ) => b.cumulative_bandwidth_mib - a.cumulative_bandwidth_mib )
    const table = as_table.configure( { delimiter: ' | ' } )( resolved_recipients.map( ( { address, percentAllocation, cumulative_bandwidth_mib } ) => ( {
        address,
        reward: `${ round_to_decimals( percentAllocation, 2 ) }%`,
        bandwidth: `${ cumulative_bandwidth_mib } MiB/s`
    } ) ) )
    log( `Reward table:\n`, table )

    // Ping discord
    const { ping_discord } = require( '../modules/discord' )
    await ping_discord( {
        username: `Sir Onion`,
        content: `Reward split updated! ${ recipients.length } nodes are running ([view transaction](https://arbiscan.io/tx/${ transactionHash }), gasprice ${ gas_price_gwei } gwei)
        \n[View updated split here](https://app.splits.org/accounts/${ SPLIT_ADDRESS }/?chainId=42161).
        \n${ "```markdown\n" + table + "```" }`,
        thread_id
    } )

}

