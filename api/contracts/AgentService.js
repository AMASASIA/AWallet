const { 
    sendAgentTx, 
    callAgentView, 
    AgentWalletFactoryV3ABI 
} = require("./AgentContract");
const contractAddr = require("./Address");
const { uploadJsonToIpfs } = require("../modules/ipfs/ipfs");

const AGENT_FACTORY_ADDRESS = contractAddr.AGENT_FACTORY_ADDRESS;
const POLICY_GUARD_ADDRESS = contractAddr.POLICY_GUARD_ADDRESS;
const EAS_ADDRESS = contractAddr.EAS_ADDRESS || "0xC2679fBD37d54388Ce493F1DB75320D236e1815e";

/**
 * @title registerAgentOnChain
 * @notice FactoryV3 (NFT Identity) + IPFS (Agent Card)
 */
async function registerAgentOnChain(agentAddress, agentDid, agentType, policy) {
    const agentCard = {
        name: agentDid + " Agent",
        description: "Agentic Financial Identity",
        type: agentType,
        protocols: ["MCP/V1", "A2A/ERC-402"],
        identity: agentDid,
        standard: "ERC-8004"
    };

    const ipfsResult = await uploadJsonToIpfs(agentCard);
    const metadataURI = ipfsResult ? `ipfs://${ipfsResult.IpfsHash}` : "";

    // V3 contract createAgent takes only owner and metadata
    // But we also need to register the agent address in the factory or similar.
    // Let's assume createAgent handles it or we call a different method.
    // Given the ABI, let's stick to createAgent for now.
    return await sendAgentTx(
        AgentWalletFactoryV3ABI,
        AGENT_FACTORY_ADDRESS,
        "createAgent",
        [agentAddress, metadataURI]
    );
}

async function executePayment(agentWalletAddress, to, amount, token, purpose, memo = "") {
    const { AgentWalletABI } = require("./AgentContract");
    return await sendAgentTx(
        AgentWalletABI,
        agentWalletAddress,
        "executePayment",
        [to, amount, token, purpose, memo]
    );
}

async function createEscrow(agentWalletAddress, providerAddress, amount, token, deliverable, deadline) {
    const { AgentWalletABI } = require("./AgentContract");
    return await sendAgentTx(
        AgentWalletABI,
        agentWalletAddress,
        "createEscrow",
        [providerAddress, amount, token, deliverable, deadline]
    );
}

async function releaseEscrow(agentWalletAddress, escrowId) {
    const { AgentWalletABI } = require("./AgentContract");
    return await sendAgentTx(
        AgentWalletABI,
        agentWalletAddress,
        "releaseEscrow",
        [escrowId]
    );
}

async function updatePolicy(agentWalletAddress, policy) {
    const { PolicyGuardABI } = require("./AgentContract");
    return await sendAgentTx(
        PolicyGuardABI,
        POLICY_GUARD_ADDRESS,
        "updatePolicy",
        [
            agentWalletAddress,
            policy.maxPerTx || 0,
            policy.maxDaily || 0,
            policy.maxMonthly || 0,
            policy.humanThreshold || 0
        ]
    );
}

module.exports = {
    registerAgentOnChain,
    executePayment,
    createEscrow,
    releaseEscrow,
    updatePolicy
};
