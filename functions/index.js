const functions = require( "firebase-functions" )

const generous_runtime = {
    timeoutSeconds: 540,
    memory: '1GB'
}

/* ///////////////////////////////
// Public endpoints
// /////////////////////////////*/

// Build the express app once per instance, not on every request
const app = require( './modules/express' )
app.use( '/api/tor_nodes', require( './endpoints/tor_nodes' ) )
exports.public_api = functions.https.onRequest( app )

/* ///////////////////////////////
// Node metrics
// /////////////////////////////*/
const { generate_node_scores } = require( './daemons/tor_nodes' )
exports.generate_node_scores = functions.runWith( generous_runtime ).pubsub.schedule( '0 9 * * *' ).onRun( generate_node_scores )

/* ///////////////////////////////
// Reward distribution
// /////////////////////////////*/
const { update_split } = require( './daemons/0xsplit' )
exports.update_split = functions.runWith( generous_runtime ).pubsub.schedule( '30 5 * * *' ).onRun( update_split )
const { trigger_endoweth_distribution } = require( './daemons/endoweth' )
exports.trigger_endoweth_distribution = functions.runWith( generous_runtime ).pubsub.schedule( '35 5 * * *' ).onRun( trigger_endoweth_distribution )
