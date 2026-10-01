const { normalize } = require( 'viem/ens' )

/**
 * Whether an ENS name is already in its normalised form. Names like ab--cd.eth pass a simple regex
 * but are rejected by ENS normalisation (and every lookup of them throws).
 * @param {string} name - ENS name
 * @returns {boolean} True when the name can be resolved as given
 */
exports.is_normalised_ens = name => {
    try {
        return normalize( `${ name }` ) === `${ name }`
    } catch {
        return false
    }
}
