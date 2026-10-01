const { db } = require( './firebase' )

/**
 * Claims today's run of a money-moving job. Cloud Scheduler delivers at least once,
 * so a second delivery on the same (UTC) day must not send another transaction.
 * @param {string} job - Job name, e.g. update_split
 * @returns {Promise<FirebaseFirestore.DocumentReference|null>} The run document, or null when today's run was already claimed
 */
exports.claim_daily_run = async job => {

    const day = new Date().toISOString().slice( 0, 10 )
    const run = db.collection( 'daemon_runs' ).doc( `${ job }_${ day }` )

    try {
        await run.create( { job, day, started: Date.now(), started_human: new Date().toString() } )
        return run
    } catch ( e ) {
        // gRPC code 6 = ALREADY_EXISTS
        if( e.code === 6 ) return null
        throw e
    }

}
