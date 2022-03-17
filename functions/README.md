# Onion DAO Serverless Oracle

## Firebase initial setup

To configure Firebase services:

1. Enable firestore, functions

To Configure backend:

1. Set environment keys
	- `firebase functions:config:set environment.verbose=true`
1. `firebase functions:config:get > .runtimeconfig.json`
## Backend usage

1. `cd functions`
2. `nvm use`
3. `npm i`
5. `npm start`