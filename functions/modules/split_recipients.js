const BigNumber = require( 'bignumber.js' )
const { eth_address_regex, ens_name_regex } = require( './regex' )
const { log } = require( './helpers' )
const { is_normalised_ens } = require( './ens' )

// Smallest share 0xSplits accepts with 4 decimals
const dust_percent = 0.0001

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

        // Deterministically unusable names are skipped, a lookup failure still aborts below
        const ens_name = wallet.toLowerCase()
        if( !ens_name_regex.test( ens_name ) || !is_normalised_ens( ens_name ) ) {
            log( `Skipping node ${ node.uid }: invalid wallet ${ wallet }` )
            return null
        }

        const address = await resolve_ens_to_address( ens_name )
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

    // The rounding remainder goes to the DAO, merged into its entry when the DAO also runs a node
    const dao = `${ dao_address }`.toLowerCase()
    const allocated = recipients.reduce( ( total, { percentAllocation } ) => total.plus( percentAllocation ), new BigNumber( 0 ) )
    const unallocated = new BigNumber( 100 ).minus( allocated )
    const dao_recipient = recipients.find( ( { address } ) => address === dao )
    if( dao_recipient ) dao_recipient.percentAllocation = unallocated.plus( dao_recipient.percentAllocation ).toNumber()
    else if( unallocated.gt( 0 ) ) recipients.push( { address: dao, percentAllocation: unallocated.toNumber(), cumulative_bandwidth_mib: 0 } )

    // 0xSplits needs at least two recipients: a single operator hands the smallest possible share to the DAO
    if( recipients.length === 1 && recipients[ 0 ].address !== dao ) {
        recipients[ 0 ].percentAllocation = new BigNumber( 100 ).minus( dust_percent ).toNumber()
        recipients.push( { address: dao, percentAllocation: dust_percent, cumulative_bandwidth_mib: 0 } )
    }

    assert_valid_split( recipients )
    return recipients

}

/**
 * Throws unless 0xSplits would accept the recipients, so a broken split never reaches the chain
 * @param {Object[]} recipients - { address, percentAllocation }
 */
const assert_valid_split = recipients => {

    const addresses = recipients.map( ( { address } ) => address )
    const total = recipients.reduce( ( sum, { percentAllocation } ) => sum.plus( percentAllocation ), new BigNumber( 0 ) )

    if( recipients.length < 2 ) throw new Error( `A split needs at least two recipients, got ${ recipients.length }` )
    if( new Set( addresses ).size !== addresses.length ) throw new Error( `Split recipients must be unique` )
    if( recipients.some( ( { percentAllocation } ) => !( percentAllocation > 0 ) ) ) throw new Error( `Every split recipient needs a positive share` )
    if( !total.eq( 100 ) ) throw new Error( `Split shares add up to ${ total }%, not 100%` )

}

module.exports = {
    bandwidth_weight,
    build_split_recipients
}
