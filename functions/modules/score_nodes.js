const fetch = require("isomorphic-fetch")
const { log } = require("./helpers")
const { check_port_availability } = require("./network")

exports.get_node_meta = async function( ip, verbose=false ) {

    /* ///////////////////////////////
    // Get node metrics
    // /////////////////////////////*/
    const port_80_available = await check_port_availability( ip, '80', 2000 ).catch( f => false )
    const port_9001_available = await check_port_availability( ip, '9001', 2000 ).catch( f => false )
    const tor_metrics = await fetch( `https://onionoo.torproject.org/details?search=${ ip }` ).then( res => res.json() ).catch( e => ( { error: e.message } ) )
    
    // Get relay data. API allows for multiple, but OnionDAO only does one per node
    const [ relay_data ] = tor_metrics.relays || []

    /* ///////////////////////////////
    // Calculate node score
    // Current algo: 100 starting, every violation halves the points
    // /////////////////////////////*/
    if( verbose ) log( `Scoring node ${ ip }` )
    let node_score = 100

    // Basic points, if your ports are closed, your node is not running
    if( !port_80_available ) {
        log( `Port 80 unavailable, punish` )
        node_score /= 2
    }
    if( !port_9001_available ) {
        log( `Port 9001 unavailable, punish` )
        node_score /= 2
    }

    // If request didn't error, do metrics api analysis
    if( !tor_metrics.error ) {


        // The relay is not known to Tor. Either it is not a relay, or it has been down for a few days.
        if( !relay_data ) {
            log( `No relay data, punish` )
            node_score /= 2
        }

        // Not currently running? Bandwidth could have run out, this is not good for Tor.
        if( !relay_data?.running ) {
            log( `Relay data says not running, punish` )
            node_score /= 2
        }

        // Is the node on the recommended version?
        if( relay_data?.recommended_version === false ) {
            log( `Not on recc version, punish` )
            node_score /= 2
        }

    }

    // Make relay data firebase friendly
    const relay_metadata = !relay_data ? {} : Object.keys( relay_data ).reduce( ( acc, key ) => {

        const keys_to_join = [ 'exit_policy' ]
        const keys_to_ignore = [ 'exit_policy_summary', 'exit_policy_v6_summary' ]
        if( keys_to_ignore.includes( key ) ) return { ...acc }
        if( keys_to_join.includes( key ) ) return { ...acc, [key]: relay_data[key].join( ', ' ) }
        else return { ...acc, [key]: relay_data[key] }

    }, {} )

    log( `Node ${ ip } score: `, node_score )

    return {
        ip,
        port_80_available,
        port_9001_available,
        node_score,
        relay_metadata
    }

}