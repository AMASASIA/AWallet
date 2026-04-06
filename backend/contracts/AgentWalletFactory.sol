// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import './AgentWallet.sol';
import './PolicyGuard.sol';

contract AgentWalletFactory {
    struct AgentInfo {
        address walletAddress;
        address agentAddress;
        address ownerAddress;
        string agentDid;
        string agentType;
        uint256 createdAt;
        bool active;
    }

    address public platformOwner;
    PolicyGuard public policyGuard;
    AgentWallet[] public agentWallets;
    mapping(address => AgentInfo) public agents;
    mapping(string => address) public didToAgent;
    mapping(address => address[]) public ownerAgents;
    mapping(address => bool) public isRegistered;

    event AgentRegistered(address wallet, address agent, address owner, string did, string agentType);

    constructor(address _policyGuard) {
        platformOwner = msg.sender;
        policyGuard = PolicyGuard(_policyGuard);
    }

    function registerAgent(address _agent, string memory _did, string memory _type, uint256 _maxTx, uint256 _maxD, uint256 _maxM, uint256 _hT) external returns (address w) {
        require(!isRegistered[_agent], 'Already registered');
        policyGuard.createPolicy(_agent, _maxTx, _maxD, _maxM, _hT);
        AgentWallet wallet = new AgentWallet(_agent, msg.sender, address(policyGuard), _did, _type);
        w = address(wallet);
        agentWallets.push(wallet);
        agents[_agent] = AgentInfo({ walletAddress: w, agentAddress: _agent, ownerAddress: msg.sender, agentDid: _did, agentType: _type, createdAt: block.timestamp, active: true });
        didToAgent[_did] = _agent;
        ownerAgents[msg.sender].push(_agent);
        isRegistered[_agent] = true;
        emit AgentRegistered(w, _agent, msg.sender, _did, _type);
        return w;
    }

    function getAgentCount() external view returns (uint256) { return agentWallets.length; }
}