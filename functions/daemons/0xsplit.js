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

function bandwidth_score_multiplier( bandwidth=0 ) {

    // Score relay based bandwidth. Assumption: 1Gbit/s is max, in MiB/s that's 125 MiB/s. So 1 is low and 100 is high.
    // note this metric is derived from the observed_bandwidth field in the tor metrics which is bytes per second observed over the last 24 hours
    const max_bandwidth_mib = 125

    // Make the bandwidth sane, just in case the api does weird things
    bandwidth = Math.min( bandwidth, max_bandwidth_mib )

    // Calculate the weight factor based on the bandwidth
    // explanation: https://chat.openai.com/share/b40e0f25-b1ad-466c-850f-4b99f5d1ed97
    const weight_factor = bandwidth ** .25

    return weight_factor
    

}

exports.update_split = async function() {

    // Dependencies
    const { dataFromSnap, db } = require( '../modules/firebase' )
    const { log, normalise } = require( '../modules/helpers' )
    const { resolve_ens_to_address } = require( '../modules/web3' )
    const { SPLIT_ADDRESS } = process.env


    // Check if there is chain congestion
    const { is_gas_price_safe } = require( '../modules/web3' )
    const { safe, gas_price_gwei } = await is_gas_price_safe()
    log( `Gas price: ${ gas_price_gwei } gwei, safe: ${ safe }` )
    if( !safe ) return log( `Gas price is too high at ${ gas_price_gwei } gwei not updating split` )

    // Get all relays that exceed the minimum score
    const nodes = await db.collection( 'tor_nodes' ).where( 'running', '==', true ).get().then( dataFromSnap )
    log( `Running node count: ${ nodes.length }` )

    // Resolve the ens addresses of all nodes
    const resolved_nodes = await Promise.all( nodes.map( async node => ( {
        ...node,
        wallet: normalise( await resolve_ens_to_address( node.wallet ) )
    } ) ) )
    log( `Resolved nodes:`, resolved_nodes.length )

    // Check for node wallet address duplicates, if found sum their cumulative_bandwidth_mib
    const deduped_nodes = resolved_nodes.reduce( ( deduped, node ) => {
        
        // If existing node found, sum bandwidth and do not add node to deduped list
        const existing = deduped.find( n => n.wallet === node.wallet )
        if( existing ) existing.cumulative_bandwidth_mib += node.cumulative_bandwidth_mib

        // If no existing node found, add node to deduped list
        else deduped.push( node )


        // Return accumulated deduped list
        return deduped

    }, [] )
    log( `Deduped nodes:`, deduped_nodes.length )

    // Calculate the reward weight for each node
    const weighted_nodes = deduped_nodes.map( node => ( {
        ...node, 
        reward_weight: bandwidth_score_multiplier( node.cumulative_bandwidth_mib )
    } ) )
    log( `Weighted nodes: ${ weighted_nodes.length }` )


    // Calculate relative score weights
    const BigNumber = require( 'bignumber.js' )
    BigNumber.config( { ROUNDING_MODE: 1 } ) // Always round down, https://mikemcl.github.io/bignumber.js/#constructor-properties
    const total_score = weighted_nodes.reduce( ( score, { reward_weight } ) => score.plus( reward_weight ), new BigNumber( 0 ) )
    log( `Total score: ${ total_score }` )

    // Formulate scores as splits objest, see https://docs.splits.org/sdk/splits#updatesplit
    const recipients = await Promise.all( weighted_nodes.map( async ( { wallet, reward_weight, cumulative_bandwidth_mib } ) => ( {
        address: await resolve_ens_to_address( wallet ),
        percentAllocation: new BigNumber( reward_weight ).div( total_score ).times( 100 ).decimalPlaces( 4 ).toNumber(),
        cumulative_bandwidth_mib
    } ) ) )

    // Handle the total allocation mismatch, assign the unallocated amount back to the OnionDAO
    const total_allocation = recipients.reduce( ( allocated, { percentAllocation } ) => allocated.plus( percentAllocation ), new BigNumber( 0 ) )
    const unallocated = new BigNumber( 100 ).minus( total_allocation ).toNumber()
    log( `Total allocation: ${ total_allocation }, unallocated: ${ unallocated }` )
    if( unallocated ) recipients.push( {
        address: await resolve_ens_to_address( 'oniondao.eth' ),
        percentAllocation: unallocated,
    } )

    log( `Recipients:`, recipients.length )

    // Get the aplit client
    const client = await get_split_client()

    // Update the split
    log( `Updating split ${ SPLIT_ADDRESS } with ${ recipients.length } recipients` )
    const updates = {
        splitAddress: SPLIT_ADDRESS,
        recipients,
        distributorFeePercent: 0,
    }
    log( `Updates:`, updates )
    const response = await client.updateSplit( updates )
    // const response = { event: { transactionHash: '0x1234567890' } }
    log( `Split updated:`, response )
    const { transactionHash } = response.event

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
    } )

}

