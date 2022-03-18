const { Socket } = require( 'net' )
const { log } = require( './helpers' )

const check_port_availability = async ( host, port, timeout_in_ms=10000 ) => new Promise( ( resolve, reject ) => {

	// Open a socket
	const socket = new Socket()

	// Configure socket timeout
	socket.setTimeout( timeout_in_ms )

	// Error handler
	const handle_error = err => {
		socket.destroy()
		reject( `Error connecting to ${ host } on port ${ port }` )
	}

	// Reject on socket error
	socket.once( 'error', handle_error )
	socket.once( 'timeout', handle_error )

	// Make connection
	socket.connect( port, host, () => {
		socket.end()
		resolve( true )
	} )



} )

module.exports = {
	check_port_availability
}