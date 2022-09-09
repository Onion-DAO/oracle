const { db, arrayUnion, dataFromSnap, increment } = require( '../modules/firebase' )
const { get_node_meta } = require( '../modules/score_nodes' )
const { error, log, day_number, year_number, month_number } = require( '../modules/helpers' )
const fetch = require( 'isomorphic-fetch' )
const { HIGH_UPTIME_SCORE } = process.env

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

	} catch( e ) {
		error( 'increment_node_count_on_write error: ', e )
	}

}

exports.register_total_tor_exit_nodes = async function( ) {

	try {

		// Get all node data
		const nodes = await db.collection( 'tor_nodes' ).get().then( dataFromSnap )
		log( `Calculating high uptime nodes based on ${ HIGH_UPTIME_SCORE } score` )
		const high_uptime_nodes = nodes.filter( ( { last_score } ) => last_score >= HIGH_UPTIME_SCORE )
		log( `${ nodes.length } OnionDAO nodes` )

		// Get a list of all tor exit nodes
		const exit_node_list = await fetch( `https://check.torproject.org/torbulkexitlist` ).then( res => res.text() )
		let exit_node_count = exit_node_list.split( '\n' ).length
		log( `${ exit_node_count } known exit nodes` )

		// Hard coded failover in case the Tor exit page is down
		// get manual data: https://metrics.torproject.org/rs.html#aggregate/all
		if( !exit_node_count || exit_node_count < 10 ) exit_node_count = 1582

		// Contribution metric
		const contribution_fraction = nodes.length / exit_node_count
		const contribution_percent_two_decimals = Math.floor( contribution_fraction * 10000 ) / 100
		log( `Contribution fraction ${ contribution_fraction }, percentage: ${ contribution_percent_two_decimals }` )

		const updated_metrics = {
			count: nodes.length,
			high_uptime_nodes: high_uptime_nodes.length,
			global_exit_nodes: exit_node_count,
			percent_contribution: contribution_percent_two_decimals,
			updated: Date.now(),
			updated_human: new Date().toString(),
		}

		// Record metadata
		await db.collection( 'metrics' ).doc( 'tor_nodes' ).set( updated_metrics, { merge: true } )

		return updated_metrics

	} catch( e ) {
		error( 'register_total_tor_exit_nodes error: ', e )
	}

}

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

	} catch( e ) {
		error( 'register_total_tor_exit_nodes error: ', e )
	}

}

exports.generate_node_scores = async function () {

	try {


		/* ///////////////////////////////
		// Get node scores */

		log( `Getting all nodes` )
		const nodes = await db.collection( 'tor_nodes' ).get().then( dataFromSnap )
		// const nodes = await db.collection( 'tor_nodes' ).limit(1).get().then( dataFromSnap )
		log( `Retreived ${ nodes.length } node entries` )

		log( `Getting scores for all nodes` )
		const scores = await Promise.all( nodes.map( ( { uid } ) => get_node_meta( uid ) ) )
		log( `Got scores for ${ scores.length } nodes` )

		/* ///////////////////////////////
		// Save node scores */

		// Save raw scores
		log( `Writing raw scores to tor_node_score` )
		await Promise.all( scores.map( score => {

			const { ip, score_without_uid } = score
			return db.collection( 'tor_node_score' ).add( {
				...score_without_uid,
				ip,
				updated: Date.now(),
				updated_human: new Date().toString()
			} )

		} ) )

		// Save day score only in pretty format
		log( `Writing short format scores to tor_nodes` )
		await Promise.all( scores.map( async score => {

			const { ip, node_score } = score
			log( `Ip score: `, node_score )

			// Calculate score
			const { last_score, ...old_node_data } = await db.collection( 'tor_nodes' ).doc( ip ).get().then( dataFromSnap )
			const score_base = old_node_data[ `${ year_number }_${ month_number }_counter` ] || 0
			const new_counter_score = score_base + node_score
			const normalised_score = Math.ceil( new_counter_score / day_number )
			log( `Score base: ${ score_base }. New counter: ${ new_counter_score }. New normalised: ${ normalised_score }` )
			log( `ip ${ ip }: from ${ last_score } to ${ normalised_score }` )

			return db.collection( 'tor_nodes' ).doc( ip ).set( {
				[ `${ year_number }_${ month_number }_counter` ]: increment( node_score ),
				last_score: normalised_score,
				updated: Date.now(),
				updated_human: new Date().toString()
			}, { merge: true } )

		} ) )

		log( `Node scoring complete` )


	} catch( e ) {
		log( `Error getting node scores: `, e )
	}

}