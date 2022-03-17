const functions = require("firebase-functions");
const app = require( './modules/express' )

/* ///////////////////////////////
// Public endpoints
// /////////////////////////////*/

const node_route = require( './endpoints/node' )
app.use( '/api/node', node_route )

exports.public_api = functions.https.onRequest( app )
