const fetch = require( "isomorphic-fetch" )
const { log } = require( "./helpers" )
const { check_port_availability } = require( "./network" )


/**
 * Finds a running relay based on the provided metrics.
 *
 * @param {Object} relay - The relay object containing metrics.
 * @param {boolean} relay.running - Indicates if the relay is running.
 * @param {number} relay.observed_bandwidth - The observed bandwidth of the relay.
 * @returns {Object|boolean} - The relay object if it is running and has sufficient bandwidth, otherwise false.
 */
const find_running_relay = relay => {

    // Destructure relevant metrics
    // see https://metrics.torproject.org/onionoo.html#details
    const { running, observed_bandwidth } = relay

    // If relay is not running, it's not up
    if( !running ) return false

    // If observed bandwidth is below 1MB, it's not up 
    const min_bandwidth_mib = 1 * 1024 * 1024
    if( observed_bandwidth < min_bandwidth_mib ) return false

    // If we got here, the relay is up
    return relay

}

/**
 * Fetches the availability of ports and Tor metrics for a given IP address.
 * @param {string} ip - The IP address to check.
 * @param {boolean} verbose - Indicates if verbose logging should be enabled.
 * @returns {Promise<Object>} score - A promise that resolves to an object
 * @returns {Promise<Object>} score.ip - The IP address of the node.
 * @returns {Promise<boolean>} score.port_80_available - Indicates if port 80 is available.
 * @returns {Promise<boolean>} score.port_9001_available - Indicates if port 9001 is available.
 * @returns {Promise<number>} score.node_score - The score of the node.
 * @returns {Promise<number>} score.cumulative_bandwidth_mib - The cumulative bandwidth of the node.
 */
exports.get_relay_status = async function( ip, verbose=false ) {

    /* ///////////////////////////////
    // Get node metrics
    // /////////////////////////////*/
    const [ port_80_available, port_9001_available, tor_metrics ] = await Promise.all( [
        check_port_availability( ip, '80', 2000 ).catch( f => false ),
        check_port_availability( ip, '9001', 2000 ).catch( f => false ),
        fetch( `https://onionoo.torproject.org/details?search=${ ip }` ).then( res => res.json() ).catch( e => ( { error: e.message } ) )
    ] )
    
    // One ip may run many relays, check if at least one is up
    const relay_data = tor_metrics?.relays?.find( find_running_relay )
    if( verbose ) log( `Relay data: `, relay_data )

    // Calculate node score
    let node_score = 0

    // Case 1: Onionoo is unavailable. We rely on open ports to guestimate the node status
    if( tor_metrics.error ) {
        log( `Onionoo error: `, tor_metrics.error )
        if( port_80_available && port_9001_available ) node_score = 100
    }

    // Case 2: Onionoo is available. We rely on the relay data to guestimate the node status
    if( relay_data ) node_score = 100

    log( `Node ${ ip } score using ${ tor_metrics.error ? 'port' : 'Onionoo' } data: `, node_score )

    // Calculate the cumulative bandwidth
    const cumulative_bandwidth_mib = Math.floor( ( tor_metrics?.relays?.reduce( ( acc, { observed_bandwidth } ) => acc + observed_bandwidth, 0 ) || 0 ) / 1024 / 1024 )

    // Grab useful relay metrics
    const { running=false, first_seen=0, last_seen=0, last_restarted=0 } = relay_data || {}

    return {
        ip,
        port_80_available,
        port_9001_available,
        node_score,
        cumulative_bandwidth_mib,
        running,
        first_seen,
        last_seen,
        last_restarted
    }

}