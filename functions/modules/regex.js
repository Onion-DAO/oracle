// Every pattern is anchored at both ends: a partial match must never pass validation

// Canonical dotted decimal only. Leading zeros are rejected because URL parsers read 012 as octal (= 10).
const octet = `(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])`
exports.ipv4_regex = new RegExp( `^${ octet }(\\.${ octet }){3}$` )

exports.email_regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i // https://emailregex.com/
exports.tor_nickname_regex = /^[A-Za-z0-9]{1,19}$/ // https://spec.torproject.org/dir-spec/server-descriptor-format.html
exports.bandwidth_regex = /^(\d{1,64}|unknown)$/ // Number in TB
exports.reduced_exit_policy_regex = /^([yn]|unknown)$/i
exports.twitter_regex = /^@?[A-Za-z0-9_]{1,15}$/

// 0x address or ENS name (subdomains allowed), https://eips.ethereum.org/EIPS/eip-137
exports.eth_address_regex = /^0x[a-f0-9]{40}$/i
exports.ens_name_regex = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/i
exports.wallet_or_ens_regex = /^(0x[a-f0-9]{40}|[a-z0-9-]+(\.[a-z0-9-]+)*\.eth)$/i

// The wallet comment tornode appends to the exit notice. Old versions also wrote "Onion DAO".
exports.exit_notice_wallet_regex = /<!-- Onion ?DAO address: (\S+) -->/g
