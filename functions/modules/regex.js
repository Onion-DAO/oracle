exports.ipv4_regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/ // // https://www.oreilly.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
exports.email_regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i // https://emailregex.com/
exports.tor_nickname_regex = /^\w{1,19}$/ // https://tpo.pages.torproject.net/core/doc/tor/nickname_8h.html
exports.bandwidth_regex = /^\d{1,64}|unknown$/ // Number in TB
exports.reduced_exit_policy_regex = /^[yn]{1}|unknown$/i
exports.wallet_or_ens_regex = /^0x[a-f-0-9]{40}|\w{1,255}\.eth$/i // https://eips.ethereum.org/EIPS/eip-137#:~:text=Labels%20and%20domains%20may%20be,no%20more%20than%20255%20characters.

exports.eth_address_regex = /(0x[a-f0-9]{40})/i
exports.ens_address_regex = /(.*\.[a-z]{2,63})/i
