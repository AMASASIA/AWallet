// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// EAS (Ethereum Attestation Service) interface - integrated from Shared layer
import "../../../shared/contracts/IEAS.sol"; 
import "./AgentWallet.sol";

/**
 * @title AgentWalletFactoryV3
 * @notice ERC-8004(Identity) + EAS(Security Attestation) + AWallet(Execution)
 * This contract acts as an on-chain harness for AI Agents, ensuring non-custodial
 * safety and standardized identity registry.
 */
contract AgentWalletFactoryV3 is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _agentIds;

    address public immutable policyGuardAddress;
    IEAS public immutable eas; // EAS contract address

    // ERC-8004: Identity & Wallet Mapping (AgentID -> Wallet)
    mapping(uint256 => address) public agentToWallet;
    
    // Reverse mapping for on-chain validation (Wallet -> AgentID)
    mapping(address => uint256) public walletToAgent;

    event AgentCreated(uint256 indexed agentId, address indexed wallet, string metadataURI);

    constructor(address _policyGuard, address _eas) ERC721("AWallet Agent", "AWAI") {
        require(_policyGuard != address(0), "Invalid PolicyGuard");
        require(_eas != address(0), "Invalid EAS");
        policyGuardAddress = _policyGuard;
        eas = IEAS(_eas);
    }

    /**
     * @dev Create Agent: Atomics binding of Identity (NFT) and Wallet (AWallet Vault)
     * Follows ERC-8004 Identity Registry principles.
     */
    function createAgent(address _owner, string memory _metadataURI) external returns (uint256) {
        _agentIds.increment();
        uint256 newAgentId = _agentIds.current();

        // 1. Identity Registry (ERC-8004 / NFT Minting)
        _safeMint(_owner, newAgentId);
        _setTokenURI(newAgentId, _metadataURI);

        // 2. Wallet Deployment (AWallet Execution Layer)
        // Note: The factory only creates it; the user (_owner) remains the only signer/controller.
        AgentWallet newWallet = new AgentWallet(_owner, policyGuardAddress);
        address walletAddr = address(newWallet);
        
        agentToWallet[newAgentId] = walletAddr;
        walletToAgent[walletAddr] = newAgentId;

        emit AgentCreated(newAgentId, walletAddr, _metadataURI);
        return newAgentId;
    }

    /**
     * @dev Security Validation Harness (ERC-8126 Semantics via EAS)
     * Checks if the agent's wallet has a valid "Security Attestation" on EAS.
     * @param _agentId The ID of the agent to verify
     * @param _schemaUID The EAS Schema ID (defining ETV/SCV trust metrics)
     */
    function isAgentSecured(uint256 _agentId, bytes32 _schemaUID) public view returns (bool) {
        address wallet = agentToWallet[_agentId];
        // Returns true only if the wallet has a trusted attestation for the given schema.
        return eas.hasValidAttestation(wallet, _schemaUID);
    }

    /**
     * @dev Dynamic Metadata Update (Agent Card refresh for 8004)
     */
    function updateMetadata(uint256 _agentId, string calldata _newURI) external {
        require(_isApprovedOrOwner(_msgSender(), _agentId), "Not authorized");
        _setTokenURI(_agentId, _newURI);
    }
}
