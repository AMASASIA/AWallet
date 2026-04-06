const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const crypto = require('crypto');
const log4js = require('log4js');
const { 
    registerAgentOnChain,
    executePayment,
    createEscrow,
    releaseEscrow,
    updatePolicy
} = require('../contracts/AgentService');

log4js.configure({ appenders: { console: { type: 'console' } }, categories: { default: { appenders: ['console'], level: 'debug' } } });
const logger = log4js.getLogger("agent-api");

// Persistent registry
const AGENTS_DATA_PATH = path.join(__dirname, '../data/agents_v2.json');

function loadAgents() {
    if (fs.existsSync(AGENTS_DATA_PATH)) {
        try {
            return JSON.parse(fs.readFileSync(AGENTS_DATA_PATH, 'utf8'));
        } catch (e) {
            logger.error("Error loading agents:", e);
            return {};
        }
    }
    return {};
}

function saveAgent(agentInfo) {
    const agents = loadAgents();
    agents[agentInfo.did] = agentInfo;
    if (!fs.existsSync(path.dirname(AGENTS_DATA_PATH))) {
        fs.mkdirSync(path.dirname(AGENTS_DATA_PATH), { recursive: true });
    }
    fs.writeFileSync(AGENTS_DATA_PATH, JSON.stringify(agents, null, 2));
}

router.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

router.get('/agents', (req, res) => {
    const agents = loadAgents();
    res.json({ result: 'success', agents: Object.values(agents) });
});

router.get('/agent/:agentDid', (req, res) => {
    const agents = loadAgents();
    const agent = agents[req.params.agentDid];
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ result: 'success', agent });
});

router.post('/agent/register', async (req, res) => {
    logger.info("=== Agent Registration API (On-Chain) ===");
    try {
        const { agentName, agentType, ownerAddress, policy } = req.body || req.query;
        const agentDid = `did:awallet:agent:${crypto.randomUUID()}`;
        const agentAddress = ethers.Wallet.createRandom().address;

        // Register on Blockchain
        const result = await registerAgentOnChain(
            agentAddress, 
            agentDid, 
            agentType || "autonomous",
            policy || {}
        );

        if (!result.success) {
            return res.status(500).json({ error: "Blockchain registration failed", details: result.error });
        }

        const agentInfo = {
            did: agentDid,
            name: agentName || "AI Agent",
            address: agentAddress,
            ownerAddress: ownerAddress,
            agentType: agentType || "autonomous",
            txHash: result.hash,
            createdAt: new Date().toISOString()
        };
        
        saveAgent(agentInfo);

        res.set({ 'Access-Control-Allow-Origin': '*' });
        res.json({ result: 'success', agent: agentInfo });
    } catch (err) {
        logger.error("Registration error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/agent/:agentDid/policy', async (req, res) => {
    logger.info(`=== Update Policy API for ${req.params.agentDid} ===`);
    try {
        const { agentDid } = req.params;
        const policy = req.body;
        const agents = loadAgents();
        const agentInfo = agents[agentDid];

        if (!agentInfo) {
            return res.status(404).json({ error: "Agent not found in registry" });
        }

        const result = await updatePolicy(agentInfo.address, policy);

        if (!result.success) {
            return res.status(500).json({ error: "Policy update failed", details: result.error });
        }

        res.json({ result: 'success', txHash: result.hash });
    } catch (err) {
        logger.error("Update policy error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/wallet/:agentDid/pay', async (req, res) => {
    logger.info(`=== Payment API for ${req.params.agentDid} ===`);
    try {
        const { agentDid } = req.params;
        const { to, amount, currency, purpose, memo } = req.body;
        const agents = loadAgents();
        const agentInfo = agents[agentDid];

        if (!agentInfo) {
            return res.status(404).json({ error: "Agent not found in registry" });
        }

        // Mock token address based on currency (for simplicity, using a dummy or zero address)
        const tokenAddress = ethers.constants.AddressZero; // Assuming ETH or native if USDC isn't mapped
        const amountWei = ethers.utils.parseUnits(amount.toString(), 18); // Default 18 decimals

        const result = await executePayment(agentInfo.address, to, amountWei, tokenAddress, purpose || "Payment", memo || "");

        if (!result.success) {
            return res.status(500).json({ error: "Payment execution failed", details: result.error });
        }

        res.json({ result: 'success', txHash: result.hash });
    } catch (err) {
        logger.error("Payment setup error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/wallet/:agentDid/balance', async (req, res) => {
    logger.info(`=== Balance API for ${req.params.agentDid} ===`);
    try {
        const { agentDid } = req.params;
        const agents = loadAgents();
        const agentInfo = agents[agentDid];

        if (!agentInfo) {
            return res.status(404).json({ error: "Agent not found in registry" });
        }

        // In a real implementation, we would call the contract's balance method.
        // Mocking for now to match the frontend expectations in Phase 2.
        res.json({ 
            result: 'success', 
            balances: {
                USDC: "2450.00",
                AWT: "10000",
                ETH: "0.45"
            }
        });
    } catch (err) {
        logger.error("Balance fetch error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/settlement/escrow/create', async (req, res) => {
    logger.info("=== Create Escrow API ===");
    try {
        const { agentDid, provider, amount, deliverable, deadlineOffsetSeconds } = req.body;
        const agents = loadAgents();
        const agentInfo = agents[agentDid];

        if (!agentInfo) {
            return res.status(404).json({ error: "Agent not found in registry" });
        }

        const tokenAddress = ethers.constants.AddressZero; // Dummy token address
        const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
        const deadline = Math.floor(Date.now() / 1000) + (parseInt(deadlineOffsetSeconds) || 86400); // Default 1 day

        const result = await createEscrow(agentInfo.address, provider, amountWei, tokenAddress, deliverable, deadline);

        if (!result.success) {
            return res.status(500).json({ error: "Escrow creation failed", details: result.error });
        }

        res.json({ result: 'success', txHash: result.hash });
    } catch (err) {
        logger.error("Escrow create error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/settlement/escrow/release', async (req, res) => {
    logger.info("=== Release Escrow API ===");
    try {
        const { agentDid, escrowId } = req.body;
        const agents = loadAgents();
        const agentInfo = agents[agentDid];

        if (!agentInfo) {
            return res.status(404).json({ error: "Agent not found in registry" });
        }

        const result = await releaseEscrow(agentInfo.address, escrowId);

        if (!result.success) {
            return res.status(500).json({ error: "Escrow release failed", details: result.error });
        }

        res.json({ result: 'success', txHash: result.hash });
    } catch (err) {
        logger.error("Escrow release error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- Phase 2: Settlement & Risk Management ---

/**
 * Stablecoin Bridge API
 * (Mock implementation for Cross-Chain or CEX-DEX bridge)
 */
router.post('/settlement/bridge', async (req, res) => {
    logger.info("=== Stablecoin Bridge API ===");
    try {
        const { agentDid, fromToken, toToken, amount, targetNetwork } = req.body;
        // Logic to initiate bridging (e.g., Circle CCTP or LayerZero)
        res.json({ 
            result: 'success', 
            status: 'bridging_initiated',
            estimateArrival: '~5 mins',
            txHash: "0x" + crypto.randomBytes(32).toString('hex')
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Compliance & Audit Log API
 */
router.get('/compliance/:agentDid/audit', async (req, res) => {
    logger.info(`=== Audit Log API for ${req.params.agentDid} ===`);
    try {
        const { agentDid } = req.params;
        const agents = loadAgents();
        if (!agents[agentDid]) return res.status(404).json({ error: 'Agent not found' });
        
        // Return dummy audit history
        res.json({
            result: 'success',
            history: [
                { id: 1, type: 'PAYMENT', amount: '0.05 USDC', recipient: '0x1234...', status: 'Verified', timestamp: new Date(Date.now() - 3600000).toISOString() },
                { id: 2, type: 'ESCROW_CREATED', amount: '150.00 USDC', provider: 'did:soul:human_01', status: 'Locked', timestamp: new Date(Date.now() - 7200000).toISOString() },
                { id: 3, type: 'POLICY_UPDATE', old: 'max:50', new: 'max:100', status: 'Success', timestamp: new Date(Date.now() - 86400000).toISOString() }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Risk Assessment API
 */
router.post('/compliance/:agentDid/risk-check', async (req, res) => {
    try {
        const { amount, recipient } = req.body;
        // Mock risk score calculation
        const score = Math.random() * 100;
        res.json({
            result: 'success',
            riskScore: score.toFixed(2),
            recommendation: score > 80 ? 'BLOCK' : (score > 40 ? 'ESCALATE' : 'ALLOW'),
            reason: score > 80 ? 'High velocity detected' : 'Standard transaction'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

