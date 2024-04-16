let client_cache = undefined
function get_split_client() {

    // If client in cache, return the cached client
    if( client_cache ) return client_cache

    // Dependencies
    const { SplitsClient } = require( '@0xsplits/splits-sdk' )
    const { createPublicClient, http } = require( 'viem' )
    const { arbitrum } = require( 'viem/chains' )

    // Create client
    const client = createPublicClient( {
        chain: arbitrum,
        transport: http,
    } )

    // Cache client
    client_cache = client

    // Return client
    return client_cache

}


function calculate_split_per_wallet() {

    const { SPLIT_ADDRESS } = process.env
}

