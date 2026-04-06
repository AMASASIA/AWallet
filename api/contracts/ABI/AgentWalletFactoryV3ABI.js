// AgentWalletFactoryV3 ABI (ERC-8004 & EAS enabled)
const AgentWalletFactoryV3ABI = [
	{ "inputs": [ { "internalType": "address", "name": "_policyGuard", "type": "address" }, { "internalType": "address", "name": "_eas", "type": "address" } ], "stateMutability": "nonpayable", "type": "constructor" },
	{ "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "agentId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "wallet", "type": "address" }, { "indexed": false, "internalType": "string", "name": "metadataURI", "type": "string" } ], "name": "AgentCreated", "type": "event" },
	{ "inputs": [ { "internalType": "uint256", "name": "_agentId", "type": "uint256" }, { "internalType": "bytes32", "name": "_schemaUID", "type": "bytes32" } ], "name": "isAgentSecured", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
	{ "inputs": [ { "internalType": "address", "name": "_owner", "type": "address" }, { "internalType": "string", "name": "_metadataURI", "type": "string" } ], "name": "createAgent", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }
];

module.exports = { AgentWalletFactoryV3ABI };
