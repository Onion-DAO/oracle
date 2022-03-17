const app = require( 'express' )()
const bodyParser = require( 'body-parser' )
app.use( bodyParser.json() )

module.exports = app