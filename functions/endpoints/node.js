const { Router } = require( 'express' )
const route = Router()
const { log, require_properties, allow_only_these_properties } = require( '../modules/helpers' )
const { db, arrayUnion, dataFromSnap } = require( '../modules/firebase' )
const { check_port_availability } = require( '../modules/network' )
const fetch = require( 'isomorphic-fetch' )
const { ipv4_regex, email_regex, tor_nickname_regex, bandwidth_regex, reduced_exit_policy_regex, wallet_or_ens_regex } = require( '../modules/regex' )

/* ///////////////////////////////
// Semantic endpoints
// /////////////////////////////*/
route.get( '/', ( req, res ) => res.send( 'This is the OnionDAO.eth API' ) )

route.get( '/:node_ip', async ( req, res ) => {

	try {

		const { node_ip } = req.params

		// Validations
		if( !`${ node_ip }`.match( ipv4_regex ) ) throw new Error( `Invalid ipv4 input` )

		// Check database
		const node_entry = await db.collection( 'tor_nodes' ).doc( node_ip ).get()
		if( !node_entry.exists ) throw new Error( `This ipv4 is not registered as an OnionDAO node. Should it be? Ask @actuallymentor for help on Twitter.` )

		const node_entry_data = dataFromSnap( node_entry )
		const { created_human, wallet } = node_entry_data

		log( `Data for ${ node_ip }: `, JSON.stringify( node_entry_data ) )
		return res.send( `✅ This node belongs to ${ wallet } and was registered with the Oracle on ${ created_human }.` )


	} catch( e ) {
		return res.send( `🛑 Node irregularity: ${ e.message }` )
	}

} )

route.post( '/', async ( req, res ) => {

	try {

		/* ///////////////////////////////
		// Validation */

		// Property validations
		const expected_properties = [ 'ip', 'email', 'bandwidth', 'reduced_exit_policy', 'node_nickname', 'wallet' ]
		const optional_properties = [ 'twitter' ]
		log( `Request received with body: `, typeof req.body, JSON.stringify( req.body ), ' ip: ', req.ip, req.ips, req.headers[ 'x-appengine-user-ip' ], Object.keys( req.headers ).concat( ', ' ) )
		require_properties( req.body, expected_properties )
		allow_only_these_properties( req.body, [ ...expected_properties, ...optional_properties ] )

		// Validate input
		const { ip, email, bandwidth, reduced_exit_policy, node_nickname, wallet, twitter } = req.body
		if( !`${ ip }`.match( ipv4_regex ) ) throw new Error( `Invalid ipv4 input` )
		if( !`${ email }`.match( email_regex ) ) throw new Error( `Invalid email input` )
		if( !`${ bandwidth }`.match( bandwidth_regex ) ) throw new Error( `Invalid bandwidth submission` )
		if( !`${ node_nickname }`.match( tor_nickname_regex ) ) throw new Error( `Invalid node nickname` )
		if( !`${ reduced_exit_policy }`.match( reduced_exit_policy_regex ) ) throw new Error( `Unexpected exit policy` )
		if( !`${ wallet }`.match( wallet_or_ens_regex ) ) throw new Error( `Invalid wallet address` )

		// Check port availability for the node
		const port_availability_error = await Promise.all( [
			check_port_availability( ip, '80' ),
			check_port_availability( ip, '9001' )
		] ).then( f => undefined ).catch( err => err )

		if( port_availability_error ) throw new Error( `Port scan error: ${ port_availability_error }` )

		// Check that the Tor Exit notice page contains the claimed addresses
		const exit_notice_html = await fetch( `http://${ ip }` ).then( res => res.text() )
		if( !exit_notice_html.includes( wallet ) ) throw new Error( `Exit notice page does not include the claimed wallet address` )
		if( !exit_notice_html.includes( email ) ) throw new Error( `Exit notice page does not include the claimed email address` )

		// Register node in Firestore
		const node_object = expected_properties.reduce( ( acc, val ) => ( { ...acc, [val]: req.body[ val ] } ), {} )
		const registration_entry = { ...node_object, created: Date.now(), created_human: new Date().toString(), updated: Date.now(), updated_human: new Date().toString() }

		// Format optional properties
		if( twitter && twitter.length <= 16 ) registration_entry.twitter = twitter

		// Manage old entry clashes
		const old_node_entry = await db.collection( 'tor_nodes' ).doc( ip ).get()
		if( old_node_entry.exists ) {

			const old_node_entry_data = dataFromSnap( old_node_entry )

			// Set timestamp meta on new entry based on old entry
			registration_entry.created = old_node_entry_data.created
			registration_entry.created_human = old_node_entry_data.created_human

			// Write old entry to logs
			await db.collection( 'tor_node_reglogs' ).add( { ...old_node_entry_data, overwritten: Date.now(), overwritten_human: new Date().toString() } )

		}

		// Write new entry to db
		await db.collection( 'tor_nodes' ).doc( ip ).set( { ...registration_entry }, { merge: true } )

		// Return plaintext success message
		return res.send( `✅ OnionDAO Oracle successfully registered your node` )

	} catch( e ) {

		log( `Node route error: `, e )

		// Return plaintext error message
		return res.send( `🛑 OnionDAO Oracle error: ${ e.message }` )

	}

} )


/* ///////////////////////////////
// Endpoint handler
// /////////////////////////////*/
module.exports = route