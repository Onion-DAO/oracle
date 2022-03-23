const { db, arrayUnion, dataFromSnap, increment } = require( '../modules/firebase' )
const { error } = require( '../modules/helpers' )
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

	} catch( e ) {
		error( 'increment_node_count_on_write error: ', e )
	}

}

exports.register_total_tor_exit_nodes = async function( ) {

	try {

		// Get all node data
		const nodes = await db.collection( 'tor_nodes' ).get().then( dataFromSnap )

		// Get a list of all tor exit nodes
		const exit_node_list = await fetch( `https://check.torproject.org/torbulkexitlist` ).then( res => res.text() )
		const exit_node_count = exit_node_list.split( '\n' ).length

		// Contribution metric
		const contribution_fraction = nodes.length / exit_node_count
		const contribution_percent_two_decimals = Math.floor( contribution_fraction * 10000 ) / 100

		const updated_metrics = {
			count: nodes.length,
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
