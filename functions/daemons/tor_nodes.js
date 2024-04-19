const { db, dataFromSnap, increment } = require( '../modules/firebase' )
const { get_relay_status } = require( '../modules/relay_meta' )
const { error, log, year_number, month_number } = require( '../modules/helpers' )
const fetch = require( 'isomorphic-fetch' )

exports.increment_node_count_on_write = async function( change, context ) {

    try {

        // If this was a creation, increment
        if( change.before.exists ) await db.collection( 'metrics' ).doc( 'tor_nodes' ).set( {
            count: increment( 1 ),
            updated: Date.now(),
            updated_human: new Date().toString(),
        }, { merge: true } )

        // If this was a deletion, decrement
        if( !change.after.exists ) await db.collection( 'metrics' ).doc( 'tor_nodes' ).set( {
            count: increment( -1 ),
            updated: Date.now(),
            updated_human: new Date().toString()
        }, { merge: true } )

    } catch ( e ) {
        error( 'increment_node_count_on_write error: ', e )
    }

}

const register_total_tor_exit_nodes = async function( nodes ) {

    try {

        // Get all node data
        nodes = nodes || await db.collection( 'tor_nodes' ).get().then( dataFromSnap )
		
        // Calculate node activity data
        const active_nodes = nodes.filter( ( { running } ) => running ).length
        const dormant_nodes = nodes.length - active_nodes

        log( `Calculating high uptime nodes based on 90 score in the last 30 days` )
        const { high_uptime_score=90 } = await db.collection( 'settings' ).doc( 'tor' ).get().then( dataFromSnap )
        const high_uptime_nodes = nodes.filter( ( { score_average_30d } ) => score_average_30d >= high_uptime_score )
        log( `${ nodes.length } OnionDAO nodes` )

        // Get a list of all tor exit nodes
        const exit_node_list = await fetch( `https://check.torproject.org/torbulkexitlist` ).then( res => res.text() )
        let exit_node_count = exit_node_list.split( '\n' ).length
        log( `${ exit_node_count } known exit nodes` )

        // Hard coded failover in case the Tor exit page is down
        // get manual data: https://metrics.torproject.org/rs.html#aggregate/all
        if( !exit_node_count || exit_node_count < 10 ) exit_node_count = 2484

        // Contribution metric
        const contribution_fraction = active_nodes / exit_node_count
        const contribution_percent_two_decimals = Math.floor( contribution_fraction * 10000 ) / 100
        log( `Contribution fraction ${ contribution_fraction }, percentage: ${ contribution_percent_two_decimals }` )

        const updated_metrics = {
            count: nodes.length,
            active_nodes,
            dormant_nodes,
            high_uptime_nodes: high_uptime_nodes.length,
            global_exit_nodes: exit_node_count,
            percent_contribution: contribution_percent_two_decimals,
            updated: Date.now(),
            updated_human: new Date().toString(),
        }

        // Record metadata
        await db.collection( 'metrics' ).doc( 'tor_nodes' ).set( updated_metrics, { merge: true } )

        return updated_metrics

    } catch ( e ) {
        error( 'register_total_tor_exit_nodes error: ', e )
    }

} 
exports.register_total_tor_exit_nodes = register_total_tor_exit_nodes

exports.seed_node_metrics = async function( ) {

    try {

        // Get all node data
        const nodes = await db.collection( 'tor_nodes' ).get().then( dataFromSnap )

        // Seed metadata
        await db.collection( 'metrics' ).doc( 'tor_nodes' ).set( {
            count: nodes.length,
            updated: Date.now(),
            updated_human: new Date().toString(),
        }, { merge: true } )

    } catch ( e ) {
        error( 'register_total_tor_exit_nodes error: ', e )
    }

}

/**
 * Generates node scores for all nodes in the database.
 * @returns {Promise<void>} - A promise that resolves when the scores have been generated.
 */
exports.generate_node_scores = async function () {

    try {

        const verbose = false


        /* ///////////////////////////////
		// Get node scores */

        log( `Getting all nodes` )
        const nodes = await db.collection( 'tor_nodes' ).get().then( dataFromSnap )
        // const nodes = await db.collection( 'tor_nodes' ).limit(1).get().then( dataFromSnap )
        log( `Retreived ${ nodes.length } node entries` )

        log( `Getting scores for all nodes` )
        const statuses = await Promise.all( nodes.map( ( { uid } ) => get_relay_status( uid ) ) )
        log( `Got scores for ${ statuses.length } nodes` )

        // Save day score only in pretty format
        log( `Writing short format scores to tor_nodes` )
        await Promise.all( statuses.map( async status => {

            const { ip, node_score, running, cumulative_bandwidth_mib } = status
            if( verbose ) log( `Ip score: `, status )

            // Get the current node metadata
            const node = await db.collection( 'tor_nodes' ).doc( ip ).get().then( dataFromSnap )
            const { score_history: old_score_history=[], bandwidth_history: old_bandwidth_history=[] } = node

            // // If the score history is shorter than 30, import last month's yyyy_mm_dd score, this is intended as a single time import of old data
            // // this calculation is very approximate, but it's better than nothing
            // if( old_score_history.length < 30 ) {
            // 	const last_month_score = node[ `${ year_number() }_${ month_number( -1 ) }_counter` ]
            // 	if( verbose ) log( `Last month ${ year_number() }_${ month_number( -1 ) }_counter score: `, last_month_score )
            // 	old_score_history = [ ...old_score_history, ...Array( 30 ).fill( Math.floor( last_month_score / 30 ) ) ]
            // }

            // Update score history and moving averages
            const score_history = [ ...old_score_history.slice( 0, 364 ), node_score ]
            const bandwidth_history = [ ...old_bandwidth_history.slice( 0, 364 ), cumulative_bandwidth_mib ]
            if( verbose ) log( `Score history: `, score_history )
            const scores = {
                score_average_7d: score_history.slice( 0, 7 ).reduce( ( acc, val ) => acc + val, 0 ) / 7,
                score_average_30d: score_history.slice( 0, 30 ).reduce( ( acc, val ) => acc + val, 0 ) / 30,
                bandwidth_average_7d: bandwidth_history.slice( 0, 7 ).reduce( ( acc, val ) => acc + val, 0 ) / 7,
                bandwidth_average_30d: bandwidth_history.slice( 0, 30 ).reduce( ( acc, val ) => acc + val, 0 ) / 30,
            }

            // Generate node metadata 
            const updated_metadata = {
                // Incrementing score of this month
                [ `${ year_number() }_${ month_number() }_counter` ]: increment( node_score ),
                // Updated score history
                score_history,
                ...scores,
                // Save the raw status data
                ...status,
                running,
                updated: Date.now(),
                updated_human: new Date().toString() 
            }
            if( verbose )  log( `Updated metadata: `, updated_metadata )

            return db.collection( 'tor_nodes' ).doc( ip ).set( updated_metadata, { merge: true } )

        } ) )

        log( `Node scoring complete` )

        // Update total node count 
        await register_total_tor_exit_nodes( nodes )
        log( `Total node count updated` )


    } catch ( e ) {
        log( `Error getting node scores: `, e )
    }

}