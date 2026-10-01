const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { is_public_ipv4 } = require( '../modules/network' )

test( 'public addresses pass', () => {
    for( const ip of [ '1.1.1.1', '165.22.200.123', '8.8.8.8', '100.63.255.255', '172.32.0.1', '11.0.0.1' ] ) assert.ok( is_public_ipv4( ip ), ip )
} )

test( 'private, local, metadata and reserved addresses are refused', () => {
    for( const ip of [ '10.0.0.1', '127.0.0.1', '169.254.169.254', '172.16.0.1', '172.31.255.255', '192.168.1.1', '100.64.0.1', '0.0.0.0', '0.1.2.3', '224.0.0.1', '255.255.255.255', '198.18.0.1', '192.0.2.1' ] ) assert.ok( !is_public_ipv4( ip ), ip )
} )

test( 'octal-looking input is refused before any connection', () => {
    // new URL( 'http://012.0.0.1' ) connects to 10.0.0.1
    for( const ip of [ '012.0.0.1', '0177.0.0.1', 'localhost', '' ] ) assert.ok( !is_public_ipv4( ip ), ip )
} )
