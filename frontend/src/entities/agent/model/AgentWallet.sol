// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPolicyGuard {
    function validateTransaction(address agent, address to, uint256 amount, string calldata purpose, string calldata memo) 
        external view returns (bool approved, bool requiresHuman, string memory reason);
}

/**
 * @title AgentWallet
 * @notice AWallet Core Execution Harness - Secured by PolicyGuard
 */
contract AgentWallet {
    enum TxStatus { Pending, Executed, Cancelled }

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

    address public immutable owner;
    address public immutable policyGuard;
    TransactionRecord[] public transactions;

    event PaymentExecuted(uint256 indexed txId, address indexed to, uint256 amount, string purpose);
    event PaymentReceived(address indexed from, uint256 amount, address token);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _owner, address _policyGuard) {
        owner = _owner;
        policyGuard = _policyGuard;
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value, address(0));
    }

    /**
     * @dev 执行支付 (Execute Payment)
     * 只有符合 On-chain PolicyGuard 规则的交易才能被自律执行。
     */
    function executePayment(
        address _to, 
        uint256 _amount, 
        address _token, 
        string calldata _purpose, 
        string calldata _memo
    ) external onlyOwner returns (uint256 txId) {
        (bool approved, bool requiresHuman, ) = IPolicyGuard(policyGuard).validateTransaction(
            msg.sender, _to, _amount, _purpose, _memo
        );
        
        require(approved, "Policy Violation: Transaction Blocked");
        require(!requiresHuman, "Manual Approval Required: Swipe on Dashboard");

        if (_token == address(0)) {
            require(address(this).balance >= _amount, "Insufficient ETH");
            payable(_to).transfer(_amount);
        } else {
            IERC20(_token).transfer(_to, _amount);
        }

        txId = transactions.length;
        transactions.push(TransactionRecord({
            id: txId,
            to: _to,
            amount: _amount,
            token: _token,
            purpose: _purpose,
            memo: _memo,
            timestamp: block.timestamp,
            status: TxStatus.Executed
        }));

        emit PaymentExecuted(txId, _to, _amount, _purpose);
        return txId;
    }
}
