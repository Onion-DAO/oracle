# Onion DAO Serverless Oracle

## Firebase initial setup

To configure Firebase services:

1. Enable firestore, functions

To Configure backend:

1. Set keys 
1. `firebase functions:config:get > .runtimeconfig.json`

To enable verbose logging, edit `.runtimeconfig.json` to set `environment.verbose="true"`.

## Backend usage

1. `cd functions`
2. `nvm use`
3. `npm i`
5. `npm start`