// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract PolicyGuard {
    struct SpendingPolicy {
        uint256 maxPerTx;
        uint256 maxDaily;
        uint256 maxMonthly;
        uint256 dailySpent;
        uint256 monthlySpent;
        uint256 lastDayReset;
        uint256 lastMonthReset;
        uint256 humanApprovalThreshold;
        bool isActive;
    }

    struct AuditEntry {
        address agent;
        address to;
        uint256 amount;
        string purpose;
        string memo;
        uint256 timestamp;
        bool approved;
        bool requiresHuman;
    }

    struct PendingApproval {
        address agent;
        address to;
        uint256 amount;
        string purpose;
        string memo;
        uint256 requestedAt;
        bool resolved;
        bool approved;
    }

    address public platformOwner;
    mapping(address => address) public agentOwners;
    mapping(address => SpendingPolicy) public policies;
    mapping(address => bool) public frozenAgents;
    mapping(address => mapping(address => bool)) public whitelistedRecipients;
    AuditEntry[] public auditLog;
    PendingApproval[] public pendingApprovals;
    mapping(address => uint256) public txCount;

    event PolicyCreated(address indexed agent, address indexed owner, uint256 maxPerTx, uint256 maxDaily, uint256 maxMonthly);
    event PolicyUpdated(address indexed agent, uint256 maxPerTx, uint256 maxDaily, uint256 maxMonthly);
    event AgentFrozen(address indexed agent, string reason);
    event AgentUnfrozen(address indexed agent);
    event TransactionApproved(address indexed agent, address indexed to, uint256 amount, string purpose);
    event TransactionBlocked(address indexed agent, address indexed to, uint256 amount, string reason);
    event HumanApprovalRequired(uint256 indexed approvalId, address indexed agent, address to, uint256 amount);
    event HumanApprovalResolved(uint256 indexed approvalId, bool approved);
    event RecipientWhitelisted(address indexed agent, address indexed recipient);
    event RecipientRemoved(address indexed agent, address indexed recipient);

    modifier onlyPlatformOwner() { require(msg.sender == platformOwner, 'Only platform owner'); _; }
    modifier onlyAgentOwner(address _agent) { require(msg.sender == agentOwners[_agent], 'Only agent owner'); _; }
    modifier onlyAgentOwnerOrPlatform(address _agent) { require(msg.sender == agentOwners[_agent] || msg.sender == platformOwner, 'Only agent owner or platform'); _; }
    modifier notFrozen(address _agent) { require(!frozenAgents[_agent], 'Agent is frozen'); _; }
    modifier hasActivePolicy(address _agent) { require(policies[_agent].isActive, 'No active policy'); _; }

    constructor() { platformOwner = msg.sender; }

    function createPolicy(address _agent, uint256 _maxPerTx, uint256 _maxDaily, uint256 _maxMonthly, uint256 _humanThreshold) external {
        require(!policies[_agent].isActive, 'Policy already exists');
        agentOwners[_agent] = msg.sender;
        policies[_agent] = SpendingPolicy({
            maxPerTx: _maxPerTx,
            maxDaily: _maxDaily,
            maxMonthly: _maxMonthly,
            dailySpent: 0,
            monthlySpent: 0,
            lastDayReset: block.timestamp / 1 days,
            lastMonthReset: block.timestamp / 30 days,
            humanApprovalThreshold: _humanThreshold,
            isActive: true
        });
        emit PolicyCreated(_agent, msg.sender, _maxPerTx, _maxDaily, _maxMonthly);
    }

    function updatePolicy(address _agent, uint256 _maxPerTx, uint256 _maxDaily, uint256 _maxMonthly, uint256 _humanThreshold) external onlyAgentOwner(_agent) {
        SpendingPolicy storage p = policies[_agent];
        p.maxPerTx = _maxPerTx;
        p.maxDaily = _maxDaily;
        p.maxMonthly = _maxMonthly;
        p.humanApprovalThreshold = _humanThreshold;
        emit PolicyUpdated(_agent, _maxPerTx, _maxDaily, _maxMonthly);
    }

    function addWhitelistedRecipient(address _agent, address _recipient) external onlyAgentOwner(_agent) { whitelistedRecipients[_agent][_recipient] = true; emit RecipientWhitelisted(_agent, _recipient); }
    function removeWhitelistedRecipient(address _agent, address _recipient) external onlyAgentOwner(_agent) { whitelistedRecipients[_agent][_recipient] = false; emit RecipientRemoved(_agent, _recipient); }

    function validateTransaction(address _agent, address _to, uint256 _amount, string calldata _purpose, string calldata _memo) external notFrozen(_agent) hasActivePolicy(_agent) returns (bool approved, bool requiresHuman, uint256 approvalId) {
        SpendingPolicy storage p = policies[_agent];
        _resetCountersIfNeeded(p);
        if (_amount > p.maxPerTx) { _logBlocked(_agent, _to, _amount, 'Exceeds per-tx limit'); return (false, false, 0); }
        if (p.dailySpent + _amount > p.maxDaily) { _logBlocked(_agent, _to, _amount, 'Exceeds daily limit'); return (false, false, 0); }
        if (p.monthlySpent + _amount > p.maxMonthly) { _logBlocked(_agent, _to, _amount, 'Exceeds monthly limit'); return (false, false, 0); }
        if (_amount > p.humanApprovalThreshold && p.humanApprovalThreshold > 0) {
            pendingApprovals.push(PendingApproval({ agent: _agent, to: _to, amount: _amount, purpose: _purpose, memo: _memo, requestedAt: block.timestamp, resolved: false, approved: false }));
            uint256 id = pendingApprovals.length - 1;
            emit HumanApprovalRequired(id, _agent, _to, _amount);
            return (false, true, id);
        }
        p.dailySpent += _amount;
        p.monthlySpent += _amount;
        txCount[_agent]++;
        auditLog.push(AuditEntry({ agent: _agent, to: _to, amount: _amount, purpose: _purpose, memo: _memo, timestamp: block.timestamp, approved: true, requiresHuman: false }));
        emit TransactionApproved(_agent, _to, _amount, _purpose);
        return (true, false, 0);
    }

    function resolveApproval(uint256 _approvalId, bool _approve) external {
        PendingApproval storage pa = pendingApprovals[_approvalId];
        require(!pa.resolved, 'Already resolved');
        require(msg.sender == agentOwners[pa.agent] || msg.sender == platformOwner, 'Not authorized');
        pa.resolved = true;
        pa.approved = _approve;
        if (_approve) {
            SpendingPolicy storage p = policies[pa.agent];
            p.dailySpent += pa.amount;
            p.monthlySpent += pa.amount;
            txCount[pa.agent]++;
        }
        auditLog.push(AuditEntry({ agent: pa.agent, to: pa.to, amount: pa.amount, purpose: pa.purpose, memo: pa.memo, timestamp: block.timestamp, approved: _approve, requiresHuman: true }));
        emit HumanApprovalResolved(_approvalId, _approve);
    }

    function freezeAgent(address _agent, string calldata _reason) external onlyAgentOwnerOrPlatform(_agent) { frozenAgents[_agent] = true; emit AgentFrozen(_agent, _reason); }
    function unfreezeAgent(address _agent) external onlyAgentOwner(_agent) { frozenAgents[_agent] = false; emit AgentUnfrozen(_agent); }

    function getAuditLogCount() external view returns (uint256) { return auditLog.length; }
    function getAuditEntries(uint256 _offset, uint256 _limit) external view returns (AuditEntry[] memory entries) {
        uint256 total = auditLog.length;
        uint256 size = total - _offset;
        if (size > _limit) size = _limit;
        entries = new AuditEntry[](size);
        for (uint256 i = 0; i < size; i++) { entries[i] = auditLog[_offset + i]; }
        return entries;
    }
    function getPendingApprovalsCount() external view returns (uint256) { return pendingApprovals.length; }
    function getAgentStats(address _agent) external view returns (uint256 dailySpent, uint256 monthlySpent, uint256 totalTxCount, bool isFrozen, bool policyActive) {
        SpendingPolicy storage p = policies[_agent];
        return (p.dailySpent, p.monthlySpent, txCount[_agent], frozenAgents[_agent], p.isActive);
    }

    function _resetCountersIfNeeded(SpendingPolicy storage _p) internal {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentMonth = block.timestamp / 30 days;
        if (currentDay > _p.lastDayReset) { _p.dailySpent = 0; _p.lastDayReset = currentDay; }
        if (currentMonth > _p.lastMonthReset) { _p.monthlySpent = 0; _p.lastMonthReset = currentMonth; }
    }

    function _logBlocked(address _agent, address _to, uint256 _amount, string memory _reason) internal {
        auditLog.push(AuditEntry({ agent: _agent, to: _to, amount: _amount, purpose: _reason, memo: 'BLOCKED', timestamp: block.timestamp, approved: false, requiresHuman: false }));
        emit TransactionBlocked(_agent, _to, _amount, _reason);
    }
}