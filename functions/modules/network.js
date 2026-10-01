const { Socket } = require( 'net' )
const { ipv4_regex } = require( './regex' )

const check_port_availability = async ( host, port, timeout_in_ms=10000 ) => new Promise( ( resolve, reject ) => {

    // Open a socket
    const socket = new Socket()

    // Configure socket timeout
    socket.setTimeout( timeout_in_ms )

    // Error handler
    const handle_error = () => {
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

// Ranges a Tor relay can't live on, connecting to them would let callers probe internal networks
const non_public_ranges = [
    [ `0.0.0.0`, 8 ], // "this" network
    [ `10.0.0.0`, 8 ], // private
    [ `100.64.0.0`, 10 ], // carrier-grade NAT
    [ `127.0.0.0`, 8 ], // loopback
    [ `169.254.0.0`, 16 ], // link-local, includes cloud metadata services
    [ `172.16.0.0`, 12 ], // private
    [ `192.0.0.0`, 24 ], // IETF protocol assignments
    [ `192.0.2.0`, 24 ], // documentation
    [ `192.168.0.0`, 16 ], // private
    [ `198.18.0.0`, 15 ], // benchmarking
    [ `198.51.100.0`, 24 ], // documentation
    [ `203.0.113.0`, 24 ], // documentation
    [ `224.0.0.0`, 4 ], // multicast
    [ `240.0.0.0`, 4 ], // reserved + broadcast
]

const ipv4_to_int = ip => ip.split( '.' ).reduce( ( int, octet ) => int * 256 + Number( octet ), 0 )

/**
 * Whether a string is a canonical, publicly routable IPv4 address
 * @param {string} ip - Address as received from a client
 * @returns {boolean} True for addresses a relay can be reached on
 */
const is_public_ipv4 = ip => {

    if( !ipv4_regex.test( `${ ip }` ) ) return false

    const address = ipv4_to_int( ip )
    return !non_public_ranges.some( ( [ network, bits ] ) => {
        const block_size = 2 ** ( 32 - bits )
        return Math.floor( address / block_size ) === Math.floor( ipv4_to_int( network ) / block_size )
    } )

}

module.exports = {
    check_port_availability,
    is_public_ipv4
}
