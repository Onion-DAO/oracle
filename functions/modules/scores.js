// Daily score bookkeeping. Histories are chronological: oldest first, newest last.

const max_history_days = 365

// Bumped when the stored history format changes, saved on every node document
const history_version = 2

/**
 * Repairs histories written before 2026-10: once full, they kept the first 364 days plus the latest day,
 * so everything but their newest sample is stale. Shorter histories were never truncated and stay as they are.
 * @param {number[]} history - Stored history of a node without history_version
 * @returns {number[]} Trustworthy part of the history, oldest first
 */
const upgrade_legacy_history = ( history=[] ) => history.length >= max_history_days ? history.slice( -1 ) : history

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
