const functions = require("firebase-functions");
const app = require( './modules/express' )

/* ///////////////////////////////
// Public endpoints
// /////////////////////////////*/

const node_route = require( './endpoints/tor_nodes' )
app.use( '/api/tor_nodes', node_route )

exports.public_api = functions.https.onRequest( app )

/* ///////////////////////////////
// DAO metrics
// /////////////////////////////*/

const { increment_node_count_on_write, seed_node_metrics, register_total_tor_exit_nodes } = require( './daemons/tor_nodes' )

// Database listeners
exports.dao_statistics = functions.firestore.document( `tor_nodes/{node_ip}` ).onWrite( increment_node_count_on_write )

// Manual calling
// exports.seed_node_metrics = functions.https.onCall( seed_node_metrics )
// exports.register_total_tor_exit_nodes = functions.https.onCall( register_total_tor_exit_nodes )
