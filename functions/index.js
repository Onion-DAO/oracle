const functions = require("firebase-functions");
const app = require( './modules/express' )

/* ///////////////////////////////
// Public endpoints
// /////////////////////////////*/
const node_route = require( './endpoints/node' )
app.use( '/node', node_route )
exports.node = functions.https.onRequest( app )
