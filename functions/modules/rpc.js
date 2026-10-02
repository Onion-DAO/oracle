// Every chain call goes through a fallback transport: the configured CHAIN_RPC_<id> first,
// then public RPCs from chainlist (https://chainlist.org) when it fails or hits rate limits

// Public RPCs that log little or nothing about requests, see chainlist's tracking labels
const allowed_tracking = [ 'none', 'limited' ]

// Enough redundancy, while a run with every endpoint down still ends well within the 540 s function timeout
const max_public_rpcs = 8

/**
 * Orders RPC endpoints for a fallback transport: the configured endpoint first, then shuffled public ones
 * @param {string} [configured] - Endpoint from CHAIN_RPC_<id>, if any
 * @param {Array<string|Object>} chainlist_rpcs - Entries from chainlist-rpcs (url strings or { url })
 * @param {Function} [random=Math.random] - Randomness source, injectable for tests
 * @returns {string[]} Endpoint urls, configured first
 */
const order_rpc_endpoints = ( configured, chainlist_rpcs=[], random=Math.random ) => {

    // Plain https urls only: no websockets, no templates that need an API key
    const public_rpcs = chainlist_rpcs
        .map( rpc => typeof rpc === 'string' ? rpc : rpc?.url )
        .filter( url => typeof url === 'string' && url.startsWith( 'https://' ) && !url.includes( '${' ) && url !== configured )

    // Shuffle so no single public endpoint receives all of our fallback traffic
    const shuffled = public_rpcs
        .map( url => [ random(), url ] )
        .sort( ( [ a ], [ b ] ) => a - b )
        .map( ( [ , url ] ) => url )

    return [ ...configured ? [ configured ] : [], ...shuffled.slice( 0, max_public_rpcs ) ]

}

/**
 * Builds a viem fallback transport for a chain
 * @param {number} chain_id - EVM chain id
 * @returns {Promise<Object>} viem transport
 * @throws {Error} When no endpoint is known for the chain
 */
const rpc_transport = async chain_id => {

    const { fallback, http } = await import( 'viem' )
    const { get_rpcs_for_chain } = await import( 'chainlist-rpcs' )

    const chainlist_rpcs = get_rpcs_for_chain( { chain_id, allowed_tracking } )
    const endpoints = order_rpc_endpoints( process.env[ `CHAIN_RPC_${ chain_id }` ], chainlist_rpcs )
    if( !endpoints.length ) throw new Error( `No RPC endpoint known for chain ${ chain_id }` )

    // Fail fast per endpoint, the fallback moves on to the next one
    return fallback( endpoints.map( url => http( url, { timeout: 8_000, retryCount: 1 } ) ) )

}

module.exports = {
    order_rpc_endpoints,
    rpc_transport
}
