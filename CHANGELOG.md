# Changelog

## [2.0.1] - 2026-10-02

### Fixed
- chain calls fall back to public chainlist RPCs (chainlist-rpcs) when the configured RPC fails; the keyless 1rpc.io endpoint hit its usage limit and failed most split updates since September

## [2.0.0] - 2026-10-01

### Breaking
- Cloud Functions 2nd gen on Node 24 (firebase-functions 7, firebase-admin 14, express 5)

### Changed
- scheduled jobs keep Los Angeles time and 540 s / 1 GiB, run as the App Engine default account
- hosting rewrite names the function region
- ESLint 9 flat config (airier 0.1.1), husky 9 pre-commit lint without --fix

## [1.1.1] - 2026-10-01

### Fixed
- payouts: single-operator and DAO-run-node splits were rejected by the Splits SDK
- payouts: one un-normalisable ENS name (e.g. ab--cd.eth) blocked every split update
- payouts: a failure before broadcasting used up the day's run
- registration rejects ENS names that fail normalisation

## [1.1.0] - 2026-10-01

### Breaking
- registration errors return 4xx/5xx statuses, `🛑` body unchanged (4345fe7)
- stricter validation: anchored regexes, canonical public IPv4 only (4345fe7)

### Added
- once-per-day run marker for split updates and endoweth payouts (2827e60)
- unit tests (`npm test` in functions) (f8a8178)

### Changed
- Cloud Functions runtime Node 22, CI on checkout/setup-node v7 (e0cc7b6, a140158)
- PRs dry-run the functions deploy against production (a140158)
- payouts skip only invalid wallets, abort on lookup errors (2827e60)
- website build tooling to current majors, 0 npm vulnerabilities (382a159)

### Fixed
- SSRF: registration connected to private/metadata addresses (4345fe7)
- stored XSS via wallet strings, in api and website (4345fe7, 08731fe)
- wallet proof matched substrings, now exact exit notice comment (4345fe7)
- score averages froze after 30 days, bandwidth history never saved (2827e60)
- required-property check inverted, metrics never refreshed when missing (4345fe7)

### Removed
- `dao_statistics` trigger, `transaction_receipt` debug function (f8a8178)
- isomorphic-fetch, body-parser, dead runtime files (f8a8178)
