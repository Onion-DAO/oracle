const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { wallet_from_exit_notice, exit_notice_names_wallet } = require( '../modules/exit_notice' )

const page = comment => `<html><body>Tor exit notice</body></html>\n${ comment }\n`

test( 'reads both comment spellings tornode ever wrote', () => {
    assert.equal( wallet_from_exit_notice( page( '<!-- OnionDAO address: mentor.eth -->' ) ), 'mentor.eth' )
    assert.equal( wallet_from_exit_notice( page( '<!-- Onion DAO address: mentor.eth -->' ) ), 'mentor.eth' )
} )

test( 'the last comment wins, like the installer appends', () => {
    assert.equal( wallet_from_exit_notice( `${ page( '<!-- OnionDAO address: old.eth -->' ) }<!-- OnionDAO address: new.eth -->` ), 'new.eth' )
} )

test( 'exact match only, no substrings', () => {
    assert.ok( exit_notice_names_wallet( page( '<!-- OnionDAO address: mentor.eth -->' ), 'mentor.eth' ) )
    assert.ok( exit_notice_names_wallet( page( '<!-- OnionDAO address: Mentor.ETH -->' ), 'mentor.eth' ) )
    assert.ok( !exit_notice_names_wallet( page( 'mentor.eth appears in the text' ), 'mentor.eth' ) )
    assert.ok( !exit_notice_names_wallet( page( '<!-- OnionDAO address: notmentor.eth -->' ), 'mentor.eth' ) )
    assert.ok( !exit_notice_names_wallet( '', 'mentor.eth' ) )
} )
