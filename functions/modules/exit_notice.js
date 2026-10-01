const { exit_notice_wallet_regex } = require( './regex' )

/**
 * Reads the wallet a node operator published in their Tor exit notice
 * @param {string} html - Page served on the node's port 80
 * @returns {string|undefined} The last wallet comment in the page
 */
const wallet_from_exit_notice = html => {
    const wallets = [ ...`${ html }`.matchAll( exit_notice_wallet_regex ) ].map( ( [ , wallet ] ) => wallet )
    return wallets.at( -1 )
}

/**
 * Whether the exit notice proves ownership of the claimed wallet
 * @param {string} html - Page served on the node's port 80
 * @param {string} wallet - Wallet the registration claims
 * @returns {boolean} True when the published wallet is exactly the claimed one (case-insensitive)
 */
const exit_notice_names_wallet = ( html, wallet ) => {
    const published = wallet_from_exit_notice( html )
    if( !published ) return false
    // Addresses and ENS names are both case-insensitive
    return published.toLowerCase() === `${ wallet }`.toLowerCase()
}

module.exports = {
    wallet_from_exit_notice,
    exit_notice_names_wallet
}
