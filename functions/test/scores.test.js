const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { upgrade_legacy_history, append_to_history, recent_average } = require( '../modules/scores' )

test( 'averages follow the most recent days', () => {
    // A node that was down for its first 30 days and up since
    const history = [ ...Array( 30 ).fill( 0 ), ...Array( 30 ).fill( 100 ) ]
    assert.equal( recent_average( history, 30 ), 100 )
    assert.equal( recent_average( history, 7 ), 100 )
} )

test( 'new nodes need a full window', () => {
    assert.equal( recent_average( [ 100 ], 30 ), 100 / 30 )
} )

test( 'history keeps a year, newest last', () => {
    const history = Array.from( { length: 365 }, ( _, day ) => day )
    const next = append_to_history( history, 999 )
    assert.equal( next.length, 365 )
    assert.equal( next.at( -1 ), 999 )
    assert.equal( next[ 0 ], 1 )
} )

test( 'full pre-2026-10 histories restart from their newest sample', () => {
    // Old code: first 364 days kept forever, plus the latest
    const legacy = [ ...Array( 364 ).fill( 0 ), 100 ]
    assert.deepEqual( upgrade_legacy_history( legacy ), [ 100 ] )
} )

test( 'short pre-2026-10 histories were intact and stay', () => {
    assert.deepEqual( upgrade_legacy_history( [ 1, 2, 3 ] ), [ 1, 2, 3 ] )
} )
