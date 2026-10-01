const BigNumber = require( 'bignumber.js' )
const { eth_address_regex, ens_name_regex } = require( './regex' )
const { log } = require( './helpers' )

/**
 * Reward weight of an operator. Scales with bandwidth up to 1 Gbit/s (125 MiB/s), dampened so small nodes still matter.
 * @param {number} bandwidth_mib - Observed bandwidth in MiB/s
 * @returns {number} Weight between 0 and ~3.3
 */
const bandwidth_weight = ( bandwidth_mib=0 ) => Math.min( bandwidth_mib, 125 ) ** .25

/**
 * Turns running nodes into 0xSplits recipients weighted by bandwidth, with the rounding remainder going to the DAO.
 * Nodes whose wallet is conclusively unusable (malformed, or an ENS name without an address) are skipped.
 * Anything uncertain, like an RPC error while resolving ENS, throws so the previous split stays in place
 * instead of silently handing a node's share to everyone else.
 * @param {Object[]} nodes - Running nodes with wallet and cumulative_bandwidth_mib
 * @param {Function} resolve_ens_to_address - async ( ens_name ) => address|null, throws on lookup failure
 * @param {string} dao_address - Receives the unallocated remainder
 * @returns {Promise<Object[]>} Recipients: { address, percentAllocation, cumulative_bandwidth_mib }
 */
const build_split_recipients = async ( nodes, resolve_ens_to_address, dao_address ) => {

    // Resolve every wallet to an address
    const resolved_nodes = await Promise.all( nodes.map( async node => {

        const wallet = `${ node.wallet || '' }`.trim()
        if( eth_address_regex.test( wallet ) ) return { ...node, address: wallet.toLowerCase() }

        if( !ens_name_regex.test( wallet ) ) {
            log( `Skipping node ${ node.uid }: invalid wallet ${ wallet }` )
            return null
        }

        const address = await resolve_ens_to_address( wallet.toLowerCase() )
        if( !address ) {
            log( `Skipping node ${ node.uid }: ${ wallet } has no address` )
            return null
        }

        return { ...node, address: address.toLowerCase() }

    } ) )

    // Operators with several nodes get one recipient with their combined bandwidth
    const operators = resolved_nodes.filter( Boolean ).reduce( ( merged, { address, cumulative_bandwidth_mib=0 } ) => {
        const bandwidth = ( merged[ address ] || 0 ) + cumulative_bandwidth_mib
        return { ...merged, [ address ]: bandwidth }
    }, {} )

    const weighted = Object.entries( operators )
        .map( ( [ address, cumulative_bandwidth_mib ] ) => ( { address, cumulative_bandwidth_mib, weight: bandwidth_weight( cumulative_bandwidth_mib ) } ) )
        .filter( ( { weight } ) => weight > 0 )

    // Fail closed: an empty or broken split would send every reward to the DAO
    const total_weight = weighted.reduce( ( total, { weight } ) => total.plus( weight ), new BigNumber( 0 ) )
    if( !weighted.length || !total_weight.isFinite() || total_weight.lte( 0 ) ) throw new Error( `No valid split recipients among ${ nodes.length } running nodes` )

    // Percentages with 4 decimals, always rounded down so the total never exceeds 100
    const recipients = weighted.map( ( { address, weight, cumulative_bandwidth_mib } ) => ( {
        address,
        percentAllocation: new BigNumber( weight ).div( total_weight ).times( 100 ).decimalPlaces( 4, BigNumber.ROUND_DOWN ).toNumber(),
        cumulative_bandwidth_mib
    } ) )

    // The rounding remainder goes to the DAO
    const allocated = recipients.reduce( ( total, { percentAllocation } ) => total.plus( percentAllocation ), new BigNumber( 0 ) )
    const unallocated = new BigNumber( 100 ).minus( allocated ).toNumber()
    if( unallocated > 0 ) recipients.push( { address: dao_address, percentAllocation: unallocated, cumulative_bandwidth_mib: 0 } )

    return recipients

}

module.exports = {
    bandwidth_weight,
    build_split_recipients
}
