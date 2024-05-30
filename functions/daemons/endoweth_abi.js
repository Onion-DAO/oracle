module.exports = [
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "_owner",
    //       "type": "address"
    //     },
    //     {
    //       "internalType": "address",
    //       "name": "_endowee",
    //       "type": "address"
    //     },
    //     {
    //       "internalType": "uint256",
    //       "name": "_distributionInterval",
    //       "type": "uint256"
    //     }
    //   ],
    //   "stateMutability": "nonpayable",
    //   "type": "constructor"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "owner",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "OwnableInvalidOwner",
    //   "type": "error"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "account",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "OwnableUnauthorizedAccount",
    //   "type": "error"
    // },
    // {
    //   "inputs": [],
    //   "name": "ReentrancyGuardReentrantCall",
    //   "type": "error"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": true,
    //       "internalType": "address",
    //       "name": "accountant",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "AccountantAdded",
    //   "type": "event"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": true,
    //       "internalType": "address",
    //       "name": "accountant",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "AccountantRemoved",
    //   "type": "event"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": false,
    //       "internalType": "address",
    //       "name": "token",
    //       "type": "address"
    //     },
    //     {
    //       "indexed": false,
    //       "internalType": "uint256",
    //       "name": "amount",
    //       "type": "uint256"
    //     }
    //   ],
    //   "name": "Distributed",
    //   "type": "event"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": false,
    //       "internalType": "uint256",
    //       "name": "newInterval",
    //       "type": "uint256"
    //     }
    //   ],
    //   "name": "DistributionIntervalUpdated",
    //   "type": "event"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": false,
    //       "internalType": "address",
    //       "name": "newEndowee",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "EndoweeChanged",
    //   "type": "event"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": false,
    //       "internalType": "address",
    //       "name": "token",
    //       "type": "address"
    //     },
    //     {
    //       "indexed": false,
    //       "internalType": "uint256",
    //       "name": "newExpectedReturn",
    //       "type": "uint256"
    //     }
    //   ],
    //   "name": "ExpectedReturnUpdated",
    //   "type": "event"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": true,
    //       "internalType": "address",
    //       "name": "previousOwner",
    //       "type": "address"
    //     },
    //     {
    //       "indexed": true,
    //       "internalType": "address",
    //       "name": "newOwner",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "OwnershipTransferred",
    //   "type": "event"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": false,
    //       "internalType": "address",
    //       "name": "token",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "TokenAdded",
    //   "type": "event"
    // },
    // {
    //   "anonymous": false,
    //   "inputs": [
    //     {
    //       "indexed": false,
    //       "internalType": "address",
    //       "name": "token",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "TokenRemoved",
    //   "type": "event"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "accountants",
    //   "outputs": [
    //     {
    //       "internalType": "bool",
    //       "name": "",
    //       "type": "bool"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "uint256",
    //       "name": "",
    //       "type": "uint256"
    //     }
    //   ],
    //   "name": "accountantsList",
    //   "outputs": [
    //     {
    //       "internalType": "address",
    //       "name": "",
    //       "type": "address"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "accountant",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "addAccountant",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "token",
    //       "type": "address"
    //     },
    //     {
    //       "internalType": "uint256",
    //       "name": "expectedReturn",
    //       "type": "uint256"
    //     }
    //   ],
    //   "name": "addToken",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "newEndowee",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "changeEndowee",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    // {
    //   "inputs": [],
    //   "name": "distributionInterval",
    //   "outputs": [
    //     {
    //       "internalType": "uint256",
    //       "name": "",
    //       "type": "uint256"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [],
    //   "name": "endowee",
    //   "outputs": [
    //     {
    //       "internalType": "address",
    //       "name": "",
    //       "type": "address"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [],
    //   "name": "getDistributableAmounts",
    //   "outputs": [
    //     {
    //       "internalType": "address[]",
    //       "name": "",
    //       "type": "address[]"
    //     },
    //     {
    //       "internalType": "uint256[]",
    //       "name": "",
    //       "type": "uint256[]"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [],
    //   "name": "getDistributableTokenCount",
    //   "outputs": [
    //     {
    //       "internalType": "uint256",
    //       "name": "",
    //       "type": "uint256"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [],
    //   "name": "owner",
    //   "outputs": [
    //     {
    //       "internalType": "address",
    //       "name": "",
    //       "type": "address"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "accountant",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "removeAccountant",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "token",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "removeToken",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    // {
    //   "inputs": [],
    //   "name": "renounceOwnership",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "uint256",
    //       "name": "",
    //       "type": "uint256"
    //     }
    //   ],
    //   "name": "tokenList",
    //   "outputs": [
    //     {
    //       "internalType": "address",
    //       "name": "",
    //       "type": "address"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "tokens",
    //   "outputs": [
    //     {
    //       "internalType": "uint256",
    //       "name": "expectedAnnualReturn",
    //       "type": "uint256"
    //     },
    //     {
    //       "internalType": "uint256",
    //       "name": "lastDistributionTime",
    //       "type": "uint256"
    //     }
    //   ],
    //   "stateMutability": "view",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "newOwner",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "transferOwnership",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    {
      "inputs": [],
      "name": "triggerDistribution",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "token",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "unwindToken",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "uint256",
    //       "name": "newInterval",
    //       "type": "uint256"
    //     }
    //   ],
    //   "name": "updateDistributionInterval",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // },
    // {
    //   "inputs": [
    //     {
    //       "internalType": "address",
    //       "name": "token",
    //       "type": "address"
    //     },
    //     {
    //       "internalType": "uint256",
    //       "name": "newExpectedReturn",
    //       "type": "uint256"
    //     }
    //   ],
    //   "name": "updateExpectedReturn",
    //   "outputs": [],
    //   "stateMutability": "nonpayable",
    //   "type": "function"
    // }
  ]