const app = require( 'express' )()
const cors = require( 'cors' )
const bodyParser = require( 'body-parser' )
app.use( bodyParser.json() )
app.use( cors( { origin: true } ) )

module.exports = app