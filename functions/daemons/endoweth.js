/**
 * Triggers the endoweth distribution by simulating a contract write and signing the transaction.
 * @returns {Promise<void>} A promise that resolves once the distribution is triggered.
 */
exports.trigger_endoweth_distribution = async function () {

    const { log } = require( '../modules/helpers' )

    // Check if the gas price is safe
    const { is_gas_price_safe } = require( '../modules/web3' )
    const { safe, gas_price_gwei } = await is_gas_price_safe()
    if( !safe ) return log( `Gas price is too high at ${ gas_price_gwei } gwei not updating split` )
    log( `Gas price: ${ gas_price_gwei } gwei, safe: ${ safe }` )

    // Get public client
    const { arbitrum } = require( 'viem/chains' )
    const { get_public_client } = require( '../modules/web3' )
    const public_client = await get_public_client( arbitrum )

    // Simulate the contract write
    const abi = require( './endoweth_abi' )
    const { privateKeyToAccount } = require( 'viem/accounts' )
    const { ENDOWETH_ADDRESS: address, SPLITTER_PRIVATE_HOTKEY, ONIONDAO_REWARDS_THREAD_ID: thread_id } = process.env
    const call = { 
        account: privateKeyToAccount( SPLITTER_PRIVATE_HOTKEY ),
        address,
        abi,
        functionName: 'triggerDistribution'
    }
    log( `Simulating contract write:`, call )
    
    try {
        const { result, request } = await public_client.simulateContract( call )
        log( `Simulated contract write:`, result )

        // Get wallet client
        const { SPLITTER_PRIVATE_HOTKEY } = process.env
        const { get_wallet_client } = require( '../modules/web3' )
        const wallet_client = await get_wallet_client( arbitrum, SPLITTER_PRIVATE_HOTKEY )

        // Sign the transaction
        const hash = await wallet_client.writeContract( request )
        log( `Signed transaction: https://arbiscan.io/tx/${ hash }` )

        // Ping mentor
        // const { ping_mentor } = require( '../modules/pushover' )
        // await ping_mentor( {
        //     title: `OnionDAO Payout`,
        //     message: `Payout triggered, gas price ${ gas_price_gwei } gwei, safe: ${ safe }`,
        //     url: `https://arbiscan.io/tx/${ hash }`
        // } )

        // Notify discord67890-
        const { ping_discord } = require( '../modules/discord' )
        await ping_discord( {
            username: `Sir Onion`,
            content: `Rewards distributed ([view transaction](https://arbiscan.io/tx/${ hash }), gasprice ${ gas_price_gwei } gwei)
            \n[View endowment contract here](https://arbiscan.io/address/${ address })`,
            thread_id
        } )

    } catch ( error ) {
        console.error( `Error triggering endowment distribution:`, error )
    }


}