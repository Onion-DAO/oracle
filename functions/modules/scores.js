// Daily score bookkeeping. Histories are chronological: oldest first, newest last.

const max_history_days = 365

// Bumped when the stored history format changes, saved on every node document
const history_version = 2

/**
 * Repairs histories written before 2026-10: once full, they kept the first 364 days plus the latest day,
 * so their recent days are lost. Those restart from last month's daily average (from the monthly score counter)
 * so long-running nodes keep their standing. Shorter histories were never truncated and stay as they are.
 * @param {number[]} history - Stored history of a node without history_version
 * @param {number} [last_month_total] - Sum of last month's daily scores, if known
 * @returns {number[]} Trustworthy history, oldest first
 */
const upgrade_legacy_history = ( history=[], last_month_total ) => {

    if( history.length < max_history_days ) return history

    const daily_average = last_month_total / 30
    if( !Number.isFinite( daily_average ) || daily_average < 0 ) return history.slice( -1 )
    return Array( 30 ).fill( Math.min( daily_average, 100 ) )

}

/**
 * Appends today's value to a history, dropping days older than a year
 * @param {number[]} history - History, oldest first
 * @param {number} value - Today's value
 * @returns {number[]} New history, oldest first
 */
const append_to_history = ( history=[], value ) => [ ...history, value ].slice( -max_history_days )

/**
 * Average over the most recent days. Missing days count as zero, so a node needs a full window of uptime.
 * @param {number[]} history - History, oldest first
 * @param {number} days - Window size
 * @returns {number} Average over the window
 */
const recent_average = ( history=[], days ) => history.slice( -days ).reduce( ( sum, value ) => sum + value, 0 ) / days

module.exports = {
    history_version,
    upgrade_legacy_history,
    append_to_history,
    recent_average
}
