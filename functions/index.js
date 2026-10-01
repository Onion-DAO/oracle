const { setGlobalOptions } = require( 'firebase-functions/v2' )
const { onRequest } = require( 'firebase-functions/v2/https' )
const { onSchedule } = require( 'firebase-functions/v2/scheduler' )

// Run as the App Engine default service account, like the 1st gen functions did, so existing IAM grants keep working
setGlobalOptions( {
    region: 'us-central1',
    serviceAccount: 'oniondao@appspot.gserviceaccount.com',
} )

// Cron times are Los Angeles time, the 1st gen default
const daily = ( schedule, options={} ) => ( { schedule, timeZone: 'America/Los_Angeles', ...options } )
const generous_runtime = { timeoutSeconds: 540, memory: '1GiB' }

/* ///////////////////////////////
// Public endpoints
// /////////////////////////////*/

// Build the express app once per instance, not on every request
const app = require( './modules/express' )
app.use( '/api/tor_nodes', require( './endpoints/tor_nodes' ) )
exports.public_api = onRequest( { invoker: 'public' }, app )

/* ///////////////////////////////
// Node metrics
// /////////////////////////////*/
const { generate_node_scores } = require( './daemons/tor_nodes' )
exports.generate_node_scores = onSchedule( daily( '0 9 * * *', generous_runtime ), generate_node_scores )

/* ///////////////////////////////
// Reward distribution
// /////////////////////////////*/
const { update_split } = require( './daemons/0xsplit' )
exports.update_split = onSchedule( daily( '30 5 * * *', generous_runtime ), update_split )
const { trigger_endoweth_distribution } = require( './daemons/endoweth' )
exports.trigger_endoweth_distribution = onSchedule( daily( '35 5 * * *' ), trigger_endoweth_distribution )
