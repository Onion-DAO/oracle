const { Router } = require( 'express' )
const route = Router()
const { log, require_properties, allow_only_these_properties } = require( '../modules/helpers' )
const { db, arrayUnion } = require( '../modules/firebase' )
const { check_port_availability } = require( '../modules/network' )

/* ///////////////////////////////
// Sementic endpoints
// /////////////////////////////*/
route.post( '/', async ( req, res ) => {

	try {

		/* ///////////////////////////////
		// Validation */

		// Property validations
		const expected_properties = [ 'ip', 'email', 'bandwidth', 'reduced_exit_policy', 'node_nickname', 'wallet' ]
		require_properties( req.body, expected_properties )
		allow_only_these_properties( req.body, expected_properties )

		// Validation regexes

		
		const ipv4_regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/ // // https://www.oreilly.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
		const email_regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i // https://emailregex.com/
		const tor_nickname_regex = /^\w{1,19}$/ // https://tpo.pages.torproject.net/core/doc/tor/nickname_8h.html
		const bandwidth_regex = /^\d{1,64}$/ // Number in TB
		const reduced_exit_policy_regex = /^[yn]{1}$/i
		const wallet_or_ens_regex = /^0x[a-z-0-9]{40}|\w{1,255}\.eth$/i // https://eips.ethereum.org/EIPS/eip-137#:~:text=Labels%20and%20domains%20may%20be,no%20more%20than%20255%20characters.

		// Validate input
		const { ip, email, bandwidth, reduced_exit_policy, node_nickname, wallet } = req.body
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


		// Register node in Firestore
		const node_object = expected_properties.reduce( ( acc, val ) => ( { ...acc, [val]: req.body[ val ] } ), {} )
		const registration_entry = { ...node_object, created: Date.now(), created_human: new Date().toDateString() }
		await db.collection( 'node_registrations' ).doc( ip ).set( { registrations: arrayUnion( registration_entry ) }, { merge: true } )

		// Return plaintext success message
		return res.send( `✅ OnionDAO Oracle successfully registered your node` )

	} catch( e ) {

		log( `Node route error: `, e )

		// Return plaintext error message
		return res.send( `🚨 OnionDAO Oracle error: ${ e.message }` )

	}

} )


/* ///////////////////////////////
// Endpoint handler
// /////////////////////////////*/
module.exports = route