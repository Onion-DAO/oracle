const { Router } = require( 'express' )
const route = Router()
const { dev, log, require_properties, allow_only_these_properties, http_error, escape_html } = require( '../modules/helpers' )
const { db, dataFromSnap } = require( '../modules/firebase' )
const { check_port_availability, is_public_ipv4 } = require( '../modules/network' )
const { exit_notice_names_wallet } = require( '../modules/exit_notice' )
const { is_normalised_ens } = require( '../modules/ens' )
const { ipv4_regex, email_regex, tor_nickname_regex, bandwidth_regex, reduced_exit_policy_regex, wallet_or_ens_regex, twitter_regex } = require( '../modules/regex' )
const { register_total_tor_exit_nodes } = require( '../daemons/tor_nodes' )


/* ///////////////////////////////
// Semantic endpoints
// /////////////////////////////*/
route.get( '/', ( req, res ) => res.type( 'text/plain' ).send( 'This is the OnionDAO.eth API' ) )

/* ///////////////////////////////
// Exposing data */
route.get( [ '/list/:property', '/list/:property/:format' ], async ( req, res ) => {

    try {

        // If running privately, allow the exposing of detailed data
        const { property, format } = req.params

        // WHen running publicly, expose only ip addresses
        const public_properties = [ 'ip', 'wallet', 'last_score' ]
        if( !process.env.development && !public_properties.includes( property ) ) return res.status( 403 ).type( 'text/plain' ).send( `This is a private endpoint sorry` )

        // Get all node data
        const { minimum_score=50 } = await db.collection( 'settings' ).doc( 'tor' ).get().then( dataFromSnap )
        const nodes = await db.collection( 'tor_nodes' ).where( 'score_average_30d', '>', minimum_score ).get().then( dataFromSnap )

        // If no property was specified, send back raw data
        if( property == 'raw' ) return res.json( nodes )

        // Manual filters
        if( property == 'amount' ) return res.type( 'text/plain' ).send( `Tor node amount: ${ nodes.length }` )

        // If a specific property was requested, filter it
        let filtered_data = []

        // Simple properties
        if( property != 'last_score' ) filtered_data = nodes.map( node => node[ property ] )
            .filter( data => !!data )
            .map( entry => `${ entry }`.toLowerCase() )
            .reduce( ( acc, val ) => {
                if( !acc.includes( val ) ) return [ ...acc, val ]
                return acc
            }, [] )
		
        // If this is a score request, make a score list
        if( property == 'last_score' ) {
            if( format == 'csv' ) filtered_data = nodes.map( ( { ip, last_score } ) => `${ ip }, ${ last_score }` )
            else filtered_data = filtered_data = nodes.map( ( { ip, last_score } ) => ( { ip, last_score } ) )
        }


        // Manipulations
        if( property == 'twitter' ) filtered_data = filtered_data.map( entry => entry.includes( '@' ) ? entry : `@${ entry }` )

        if( format == 'csv' ) {
            return res.send( `<body><p>${ filtered_data.map( escape_html ).join( `\n<br />` ) }</p></body>` )
        } else {
            return res.json( filtered_data )
        }
		


    } catch ( e ) {
        return res.status( 500 ).json( { error: `🛑 Node list error: ${ e.message }` } )
    }

} )

route.get( '/metrics/', async ( req, res ) => {

    try {		

        // Get all node data
        let tor_node_metrics = await db.collection( 'metrics' ).doc( 'tor_nodes' ).get().then( dataFromSnap )
        log( `Existing metrics: `, tor_node_metrics )

        // If data is old, refresh. Not relying on cron because it is a recurring cost on firebase
        const five_minutes_in_ms = 1000 * 60 * 5
        const five_minutes_ago = Date.now() - five_minutes_in_ms
        if( dev || !( tor_node_metrics.updated > five_minutes_ago ) ) {
            log( `Getting remote Tor metrics` )
            tor_node_metrics = await register_total_tor_exit_nodes()
        }

        // Send response as json
        return res.json( tor_node_metrics )


    } catch ( e ) {
        return res.status( 500 ).json( {
            error: `Metrics error: ${ e.message }`
        } )
    }

} )

route.get( '/:node_ip', async ( req, res ) => {

    try {

        const { node_ip } = req.params

        // Validations
        if( !`${ node_ip }`.match( ipv4_regex ) ) throw http_error( 400, `Invalid ipv4 input` )

        // Check database
        const node_entry = await db.collection( 'tor_nodes' ).doc( node_ip ).get()
        if( !node_entry.exists ) throw http_error( 404, `This ipv4 is not registered as an OnionDAO node. Should it be? Ask @actuallymentor for help on Twitter.` )

        const node_entry_data = dataFromSnap( node_entry )
        const { created_human, wallet, last_score } = node_entry_data

        log( `Data for ${ node_ip }: `, JSON.stringify( node_entry_data ) )
        return res.type( 'text/plain' ).send( `✅ This node belongs to ${ wallet } and was registered with the Oracle on ${ created_human }. The last known score is: ${ last_score }` )


    } catch ( e ) {
        return res.status( e.status || 500 ).type( 'text/plain' ).send( `🛑 Node irregularity: ${ e.message }` )
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
        const body = req.body || {}
        try {
            require_properties( body, expected_properties )
            allow_only_these_properties( body, [ ...expected_properties, ...optional_properties ] )
        } catch ( e ) {
            throw http_error( 400, e.message )
        }

        // Validate input
        const { ip, email, bandwidth, reduced_exit_policy, node_nickname, wallet, twitter } = body
        if( !`${ ip }`.match( ipv4_regex ) ) throw http_error( 400, `Invalid ipv4 input` )
        if( !is_public_ipv4( ip ) ) throw http_error( 400, `${ ip } is not a public ipv4 address` )
        if( !`${ email }`.match( email_regex ) ) throw http_error( 400, `Invalid email input` )
        if( !`${ bandwidth }`.match( bandwidth_regex ) ) throw http_error( 400, `Invalid bandwidth submission` )
        if( !`${ node_nickname }`.match( tor_nickname_regex ) ) throw http_error( 400, `Invalid node nickname` )
        if( !`${ reduced_exit_policy }`.match( reduced_exit_policy_regex ) ) throw http_error( 400, `Unexpected exit policy` )
        if( !`${ wallet }`.match( wallet_or_ens_regex ) || wallet.length > 255 ) throw http_error( 400, `Invalid wallet address` )
        if( /\.eth$/i.test( wallet ) && !is_normalised_ens( wallet.toLowerCase() ) ) throw http_error( 400, `Invalid ENS name` )
        if( twitter && !`${ twitter }`.match( twitter_regex ) ) throw http_error( 400, `Invalid twitter handle` )

        // Check port availability for the node
        const port_availability_error = await Promise.all( [
            check_port_availability( ip, '80' ),
            check_port_availability( ip, '9001' )
        ] ).then( () => undefined ).catch( err => err )

        if( port_availability_error ) throw http_error( 422, `Port scan error: ${ port_availability_error }` )

        // The exit notice must name the claimed wallet, only the node operator can put it there
        const exit_notice_html = await fetch( `http://${ ip }/`, { redirect: 'manual', signal: AbortSignal.timeout( 10_000 ) } )
            .then( res => res.text() )
            .catch( e => {
                throw http_error( 422, `Could not load the exit notice on port 80: ${ e.message }` )
            } )
        if( !exit_notice_names_wallet( exit_notice_html, wallet ) ) throw http_error( 422, `Exit notice page does not include the claimed wallet address` )

        // Register node in Firestore, ENS names are case-insensitive so store them lowercase
        const node_object = expected_properties.reduce( ( acc, val ) => ( { ...acc, [val]: body[ val ] } ), {} )
        if( /\.eth$/i.test( wallet ) ) node_object.wallet = wallet.toLowerCase()
        const registration_entry = { ...node_object, created: Date.now(), created_human: new Date().toString(), updated: Date.now(), updated_human: new Date().toString() }

        // Format optional properties
        if( twitter ) registration_entry.twitter = `${ twitter }`.replace( /^@/, '' )

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

        // Ping Mentor
        const { ping_mentor } = require( '../modules/pushover' )
        await ping_mentor( {
            title: `OnionDAO: New Tor Node ${ node_nickname }`,
            message: `by ${ email } aka ${ twitter }/${ wallet } with ${ bandwidth }TB/${ /^y/i.test( reduced_exit_policy ) ? 'REP' : 'LIM' }`,
            url: `http://${ ip }`
        } )

        // Return plaintext success message
        return res.type( 'text/plain' ).send( `✅ OnionDAO Oracle successfully registered your node` )

    } catch ( e ) {

        log( `Node route error: `, e )

        // Plaintext error message, installers before 1.0 look for the 🛑 instead of the status code
        return res.status( e.status || 500 ).type( 'text/plain' ).send( `🛑 OnionDAO Oracle error: ${ e.message }` )

    }

} )


/* ///////////////////////////////
// Endpoint handler
// /////////////////////////////*/
module.exports = route