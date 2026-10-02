const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { order_rpc_endpoints } = require( '../modules/rpc' )

const configured = 'https://configured.example/rpc'
const chainlist = [
    'https://a.example',
    { url: 'https://b.example', tracking: 'none' },
    { url: 'wss://c.example' },
    { url: 'https://d.example/v3/${INFURA_API_KEY}' },
    { url: configured },
    ...Array.from( { length: 20 }, ( _, i ) => ( { url: `https://pool-${ i }.example` } ) ),
]

test( 'the configured endpoint comes first and is not repeated', () => {
    const endpoints = order_rpc_endpoints( configured, chainlist )
    assert.equal( endpoints[ 0 ], configured )
    assert.equal( endpoints.filter( url => url === configured ).length, 1 )
} )

test( 'only plain https endpoints without API key templates', () => {
    const endpoints = order_rpc_endpoints( configured, chainlist )
    assert.ok( endpoints.every( url => url.startsWith( 'https://' ) && !url.includes( '${' ) ) )
} )

test( 'public fallbacks are capped and shuffled', () => {
    const first = order_rpc_endpoints( configured, chainlist, () => 0.1 )
    const reversed = order_rpc_endpoints( configured, chainlist, ( ( n ) => () => n-- )( 100 ) )
    assert.equal( first.length, 1 + 8 )
    assert.notDeepEqual( first.slice( 1 ), reversed.slice( 1 ) )
} )

test( 'works without a configured endpoint', () => {
    const endpoints = order_rpc_endpoints( undefined, chainlist )
    assert.equal( endpoints.length, 8 )
    assert.ok( !endpoints.includes( undefined ) )
} )
