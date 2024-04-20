let public_client_cache = {}
let wallet_client_cache = {}

/**
 * Retrieves or creates a public client for the specified chain.
 * @param {Object} chain - A viem chain object imported from 'viem/chains'.
 * @returns {Promise<Object>} - A promise that resolves to the public client for the specified chain.
 * @throws {Error} - If the RPC endpoint is not found for the specified chain.
 */
async function get_public_client( chain ) {

    // If no chain object was specified, assume arbitrum
    if( !chain ) {
        const { arbitrum } = require( 'viem/chains' )
        chain = arbitrum
    }

    // If client in cache, return the cached client
    if( public_client_cache[ chain.id ] ) return public_client_cache[ chain.id ]

    // Dependencies
    const { createPublicClient, http } = await import( 'viem' )
    const rpc_endpoint = process.env[ `CHAIN_RPC_${ chain.id }` ]

    if( !rpc_endpoint ) throw new Error( `RPC endpoint not found for chain ${ chain.id }` )

    // Create public client
    const publicClient = createPublicClient( {
        chain,
        transport: http( rpc_endpoint ),
    } )

    // Cache client
    public_client_cache[ chain.id ] = publicClient

    // Return client
    return public_client_cache[ chain.id ]
}

/**
 * Retrieves or creates a wallet client for the specified chain.
 * @param {Object} chain - A viem chain object imported from 'viem/chains'.
 * @param {String} private_key - The private key to use for the wallet client.
 * @returns {Promise<Object>} - A promise that resolves to the wallet client for the specified chain.
 * @throws {Error} - If the RPC endpoint is not found for the specified chain.
 */
async function get_wallet_client( chain, private_key ) {

    // If no chain object was specified, assume arbitrum
    if( !chain ) {
        const { arbitrum } = require( 'viem/chains' )
        chain = arbitrum
    }

    // If client in cache, return the cached client
    if( wallet_client_cache[ chain.id ] ) return wallet_client_cache[ chain.id ]

    // Dependencies
    const { createWalletClient, http } = await import( 'viem' )
    const rpc_endpoint = process.env[ `CHAIN_RPC_${ chain.id }` ]

    if( !rpc_endpoint ) throw new Error( `RPC endpoint not found for chain ${ chain.id }` )

    // Initialise account from private key
    const { privateKeyToAccount } = require( 'viem/accounts' )
    const account = privateKeyToAccount( private_key )

    // Create wallet client
    const walletClient = createWalletClient( {
        account,
        chain,
        transport: http( rpc_endpoint ),
    } )

    // Cache client
    wallet_client_cache[ chain.id ] = walletClient

    // Return client
    return wallet_client_cache[ chain.id ]
}

// In-memory ens cache
let ens_cache = {}

/**
 * Resolves an ENS name to an address on the specified chain.
 *
 * @param {string} ens_name - The ENS name to resolve.
 * @param {string} chain - The chain on which to resolve the ENS name.
 * @returns {Promise<string>} - A promise that resolves to the address associated with the ENS name.
 */
async function resolve_ens_to_address( ens_name, chain ) {

    // Check if the ENS is already an address
    const { eth_address_regex } = require( './regex' )
    if( eth_address_regex.test( ens_name ) ) return ens_name

    // If the ENS name is already in the cache, return it
    if( ens_cache[ ens_name ] ) return ens_cache[ ens_name ]

    // If no chain was specified, assume mainnet
    if( !chain ) {
        const { mainnet } = require( 'viem/chains' )
        chain = mainnet
    }

    // const { log } = require( './helpers' )
    // log( `Resolving ENS name: `, ens_name, ` on chain: `, chain.id )

    // Get public client
    const publicClient = await get_public_client( chain )

    // Resolve ENS name
    const { normalize } = require( 'viem/ens' )
    const address = await publicClient.getEnsAddress( {
        name: normalize( ens_name ),
    } )

    // Cache address
    ens_cache[ ens_name ] = address

    // Return address
    return address

}

async function resolve_address_to_ens( address, chain ) {

    // If this is not an eth address, return the input as is
    const { eth_address_regex } = require( './regex' )
    if( !eth_address_regex.test( address ) ) return address

    // If the ENS name is already in the cache, return it
    if( ens_cache[ address ] ) return ens_cache[ address ]

    // If no chain was specified, assume mainnet
    if( !chain ) {
        const { mainnet } = require( 'viem/chains' )
        chain = mainnet
    }

    // const { log } = require( './helpers' )
    // log( `Resolving ENS name: `, ens_name, ` on chain: `, chain.id )

    // Get public client
    const publicClient = await get_public_client( chain )

    // Resolve ENS name
    const ens = await publicClient.getEnsName( {
        address,
    } )

    // Cache address
    ens_cache[ address ] = ens

    // Return address
    return ens || address

}

async function is_gas_price_safe( { chain, max_gas_price_wei, max_gas_price_gwei } ) {

    const publicClient = await get_public_client( chain )
    const gas_price = await publicClient.getGasPrice()

    // If a gas price in gwei was specified, convert it to a viem compatible wei bignumber
    // https://viem.sh/docs/utilities/#parseGwei
    const { parseGwei: gwei_to_wei, formatGwei: wei_to_gwei } = require( 'viem' )
    if( max_gas_price_gwei ) max_gas_price_wei = gwei_to_wei( `${ max_gas_price_gwei }` )
    
    // Check if the gas price is safe
    let safe = gas_price <= max_gas_price_wei

    return {
        safe,
        gas_price,
        gas_price_gwei: wei_to_gwei( `${ gas_price }` )
    }
}

module.exports = {
    get_public_client,
    get_wallet_client,
    resolve_ens_to_address,
    is_gas_price_safe,
    resolve_address_to_ens
}