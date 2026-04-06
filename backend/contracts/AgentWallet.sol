// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import './PolicyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract AgentWallet {
    struct TransactionRecord {
        uint256 id;
        address to;
        uint256 amount;
        address token;
        string purpose;
        string memo;
        uint256 timestamp;
        TxStatus status;
    }

    enum TxStatus { Pending, Executed, Cancelled, EscrowLocked, EscrowReleased }

    struct Escrow {
        uint256 id;
        address agent;
        address provider;
        uint256 amount;
        address token;
        string deliverable;
        uint256 deadline;
        EscrowStatus status;
        uint256 createdAt;
    }

    enum EscrowStatus { Active, Released, Disputed, Refunded, Expired }

    address public agent;
    address public owner;
    PolicyGuard public policyGuard;
    string public agentDid;
    string public agentType;
    TransactionRecord[] public transactions;
    Escrow[] public escrows;
    mapping(address => bool) public supportedTokens;

    event PaymentExecuted(uint256 indexed txId, address indexed to, uint256 amount, string purpose);
    event PaymentReceived(address indexed from, uint256 amount, address token);
    event EscrowCreated(uint256 indexed escrowId, address indexed provider, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId);

    modifier onlyAgent() { require(msg.sender == agent, 'Only agent'); _; }
    modifier onlyOwner() { require(msg.sender == owner, 'Only owner'); _; }
    modifier onlyAgentOrOwner() { require(msg.sender == agent || msg.sender == owner, 'Not authorized'); _; }

    constructor(address _agent, address _owner, address _policyGuard, string memory _agentDid, string memory _agentType) {
        agent = _agent;
        owner = _owner;
        policyGuard = PolicyGuard(_policyGuard);
        agentDid = _agentDid;
        agentType = _agentType;
    }

    receive() external payable { emit PaymentReceived(msg.sender, msg.value, address(0)); }

    function pay(address _to, uint256 _amount, address _token, string calldata _purpose, string calldata _memo) external onlyAgent returns (uint256 txId) {
        (bool approved, bool requiresHuman, ) = policyGuard.validateTransaction(agent, _to, _amount, _purpose, _memo);
        if (requiresHuman) return _recordTransaction(_to, _amount, _token, _purpose, _memo, TxStatus.Pending);
        require(approved, 'Blocked');
        if (_token == address(0)) {
            require(address(this).balance >= _amount, 'Low ETH');
            payable(_to).transfer(_amount);
        } else {
            IERC20(_token).transfer(_to, _amount);
        }
        txId = _recordTransaction(_to, _amount, _token, _purpose, _memo, TxStatus.Executed);
        emit PaymentExecuted(txId, _to, _amount, _purpose);
        return txId;
    }

    function createEscrow(address _provider, uint256 _amount, address _token, string calldata _deliverable, uint256 _deadline) external onlyAgent returns (uint256 id) {
        (bool approved, bool requiresHuman, ) = policyGuard.validateTransaction(agent, _provider, _amount, 'escrow', _deliverable);
        require(approved && !requiresHuman, 'Escrow Restricted');
        id = escrows.length;
        escrows.push(Escrow({ id: id, agent: agent, provider: _provider, amount: _amount, token: _token, deliverable: _deliverable, deadline: _deadline, status: EscrowStatus.Active, createdAt: block.timestamp }));
        emit EscrowCreated(id, _provider, _amount);
        return id;
    }

    function releaseEscrow(uint256 _id) external onlyAgentOrOwner {
        Escrow storage e = escrows[_id];
        require(e.status == EscrowStatus.Active, 'Not active');
        e.status = EscrowStatus.Released;
        if (e.token == address(0)) payable(e.provider).transfer(e.amount);
        else IERC20(e.token).transfer(e.provider, e.amount);
        emit EscrowReleased(_id);
    }

    function _recordTransaction(address _to, uint256 _amount, address _token, string memory _p, string memory _m, TxStatus _s) internal returns (uint256 txId) {
        txId = transactions.length;
        transactions.push(TransactionRecord({ id: txId, to: _to, amount: _amount, token: _token, purpose: _p, memo: _m, timestamp: block.timestamp, status: _s }));
        return txId;
    }

    function addSupportedToken(address _token) external onlyOwner { supportedTokens[_token] = true; }
}