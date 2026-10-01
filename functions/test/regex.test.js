const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { ipv4_regex, wallet_or_ens_regex, bandwidth_regex, reduced_exit_policy_regex, tor_nickname_regex, twitter_regex } = require( '../modules/regex' )

test( 'ipv4 accepts only canonical dotted decimal', () => {
    for( const ip of [ '1.1.1.1', '165.22.200.123', '255.255.255.255', '0.0.0.0' ] ) assert.ok( ipv4_regex.test( ip ), ip )
    for( const ip of [ '012.0.0.1', '0177.0.0.1', '1.1.1', '1.1.1.1.1', '256.1.1.1', '1.1.1.1 ', ' 1.1.1.1', '0x7f.0.0.1', '1.1.1.01' ] ) assert.ok( !ipv4_regex.test( ip ), ip )
} )

test( 'wallet is an address or an ENS name, nothing appended', () => {
    for( const wallet of [ 'mentor.eth', 'sub.mentor.eth', `0x${ 'a'.repeat( 40 ) }`, `0x${ 'A'.repeat( 40 ) }` ] ) assert.ok( wallet_or_ens_regex.test( wallet ), wallet )
    for( const wallet of [ `0x${ 'a'.repeat( 40 ) }<img src=x>`, '<script>a.eth', 'mentor.eth<b>', `0x${ '-'.repeat( 40 ) }`, '.eth', 'mentor', 'a b.eth' ] ) assert.ok( !wallet_or_ens_regex.test( wallet ), wallet )
} )

test( 'small fields are anchored', () => {
    assert.ok( bandwidth_regex.test( '2' ) && bandwidth_regex.test( 'unknown' ) )
    assert.ok( !bandwidth_regex.test( '2 TB' ) && !bandwidth_regex.test( 'xunknown' ) )
    assert.ok( reduced_exit_policy_regex.test( 'Y' ) && reduced_exit_policy_regex.test( 'n' ) )
    assert.ok( !reduced_exit_policy_regex.test( 'yes' ) && !reduced_exit_policy_regex.test( 'nope' ) )
    assert.ok( tor_nickname_regex.test( 'oniondaoci' ) && !tor_nickname_regex.test( 'under_score' ) && !tor_nickname_regex.test( 'a'.repeat( 20 ) ) )
    assert.ok( twitter_regex.test( '@actuallymentor' ) && !twitter_regex.test( 'a<b>' ) )
} )
