const { ethers } = require("ethers");
const { PolicyGuardABI } = require("./ABI/PolicyGuardABI");
const { AgentWalletABI } = require("./ABI/AgentWalletABI");
const { AgentWalletFactoryABI } = require("./ABI/AgentWalletFactoryABI");
require("dotenv").config();
const { RPC_URL, CHAIN_ID } = require("../utils/constants");

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001", provider);

const { AgentWalletFactoryV3ABI } = require("./ABI/AgentWalletFactoryV3ABI");

async function sendAgentTx(abi, address, functionName, args) {
    try {
        const contract = new ethers.Contract(address, abi, wallet);
        const tx = await contract[functionName](...args);
        return { success: true, hash: tx.hash, wait: tx.wait };
    } catch (error) {
        console.error(`Error in sendAgentTx (${functionName}):`, error);
        return { success: false, error: error.message };
    }
}

async function callAgentView(abi, address, functionName, args = []) {
    try {
        const contract = new ethers.Contract(address, abi, provider);
        return await contract[functionName](...args);
    } catch (error) {
        console.error(`Error in callAgentView (${functionName}):`, error);
        throw error;
    }
}

module.exports = {
    sendAgentTx,
    callAgentView,
    wallet,
    provider,
    PolicyGuardABI: typeof PolicyGuardABI === 'string' ? JSON.parse(PolicyGuardABI) : PolicyGuardABI,
    AgentWalletABI: typeof AgentWalletABI === 'string' ? JSON.parse(AgentWalletABI) : AgentWalletABI,
    AgentWalletFactoryABI: typeof AgentWalletFactoryABI === 'string' ? JSON.parse(AgentWalletFactoryABI) : AgentWalletFactoryABI,
    AgentWalletFactoryV3ABI
};
