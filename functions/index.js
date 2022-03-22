const functions = require("firebase-functions");
const app = require( './modules/express' )

/* ///////////////////////////////
// Public endpoints
// /////////////////////////////*/

const node_route = require( './endpoints/tor_nodes' )
app.use( '/api/tor_nodes', node_route )

exports.public_api = functions.https.onRequest( app )
