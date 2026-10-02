const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { build_split_recipients } = require( '../modules/split_recipients' )

const dao = `0x${ 'd'.repeat( 40 ) }`
const address = digit => `0x${ `${ digit }`.repeat( 40 ) }`
const ens = { 'alice.eth': address( 1 ), 'bob.eth': address( 2 ), 'gone.eth': null }
const resolver = async name => {
    if( !( name in ens ) ) throw new Error( `RPC timeout` )
    return ens[ name ]
}
const total = recipients => recipients.reduce( ( sum, { percentAllocation } ) => sum + percentAllocation, 0 )

test( 'weights by bandwidth and gives the rounding remainder to the DAO', async () => {
    const recipients = await build_split_recipients( [
        { uid: 'a', wallet: 'alice.eth', cumulative_bandwidth_mib: 100 },
        { uid: 'b', wallet: address( 3 ), cumulative_bandwidth_mib: 1 },
    ], resolver, dao )
    const alice = recipients.find( r => r.address === address( 1 ) )
    const other = recipients.find( r => r.address === address( 3 ) )
    assert.ok( alice.percentAllocation > other.percentAllocation )
    assert.ok( Math.abs( total( recipients ) - 100 ) < 1e-9 )
} )

test( 'merges nodes of the same operator', async () => {
    const recipients = await build_split_recipients( [
        { uid: 'a', wallet: 'alice.eth', cumulative_bandwidth_mib: 10 },
        { uid: 'b', wallet: address( 1 ).toUpperCase().replace( '0X', '0x' ), cumulative_bandwidth_mib: 10 },
        { uid: 'c', wallet: 'bob.eth', cumulative_bandwidth_mib: 20 },
    ], resolver, dao )
    const operators = recipients.filter( r => r.address !== dao )
    assert.equal( operators.length, 2 )
} )

test( 'skips conclusively unusable wallets', async () => {
    const recipients = await build_split_recipients( [
        { uid: 'a', wallet: 'alice.eth', cumulative_bandwidth_mib: 10 },
        { uid: 'b', wallet: 'gone.eth', cumulative_bandwidth_mib: 10 },
        { uid: 'c', wallet: 'junk<script>', cumulative_bandwidth_mib: 10 },
    ], resolver, dao )
    assert.deepEqual( recipients.filter( r => r.address !== dao ).map( r => r.address ), [ address( 1 ) ] )
} )

test( 'a lookup failure aborts instead of redistributing', async () => {
    await assert.rejects( build_split_recipients( [
        { uid: 'a', wallet: 'alice.eth', cumulative_bandwidth_mib: 10 },
        { uid: 'b', wallet: 'flaky.eth', cumulative_bandwidth_mib: 10 },
    ], resolver, dao ), /RPC timeout/ )
} )

test( 'no usable recipients aborts instead of paying everything to the DAO', async () => {
    await assert.rejects( build_split_recipients( [ { uid: 'b', wallet: 'gone.eth', cumulative_bandwidth_mib: 10 } ], resolver, dao ), /No valid split recipients/ )
    await assert.rejects( build_split_recipients( [], resolver, dao ), /No valid split recipients/ )
} )

// 0xSplits rejects fewer than two recipients, duplicates, zero shares and totals other than 100
const assert_sdk_valid = recipients => {
    const addresses = recipients.map( r => r.address )
    assert.ok( recipients.length >= 2, `${ recipients.length } recipients` )
    assert.equal( new Set( addresses ).size, addresses.length )
    assert.ok( recipients.every( r => r.percentAllocation > 0 ) )
    assert.ok( Math.abs( total( recipients ) - 100 ) < 1e-9 )
}

test( 'a single operator still yields a valid two-recipient split', async () => {
    const recipients = await build_split_recipients( [ { uid: 'a', wallet: 'alice.eth', cumulative_bandwidth_mib: 10 } ], resolver, dao )
    assert_sdk_valid( recipients )
    assert.equal( recipients.find( r => r.address === dao ).percentAllocation, 0.0001 )
} )

test( 'the DAO running a node gets one merged entry', async () => {
    const recipients = await build_split_recipients( [
        { uid: 'a', wallet: 'alice.eth', cumulative_bandwidth_mib: 7 },
        { uid: 'b', wallet: dao, cumulative_bandwidth_mib: 3 },
        { uid: 'c', wallet: 'bob.eth', cumulative_bandwidth_mib: 5 },
    ], resolver, dao )
    assert_sdk_valid( recipients )
} )

test( 'names ENS normalisation rejects are skipped without a lookup', async () => {
    let lookups = 0
    const counting_resolver = async name => {
        lookups++; return resolver( name ) 
    }
    const recipients = await build_split_recipients( [
        { uid: 'a', wallet: 'alice.eth', cumulative_bandwidth_mib: 10 },
        { uid: 'b', wallet: 'ab--cd.eth', cumulative_bandwidth_mib: 10 },
    ], counting_resolver, dao )
    assert_sdk_valid( recipients )
    assert.equal( lookups, 1 )
} )

test( 'many operators always produce a valid split', async () => {
    const nodes = Array.from( { length: 37 }, ( _, i ) => ( { uid: `${ i }`, wallet: `0x${ `${ i }`.padStart( 40, '0' ) }`, cumulative_bandwidth_mib:  i * 7  % 130 + 1 } ) )
    assert_sdk_valid( await build_split_recipients( nodes, resolver, dao ) )
} )
