/**
 * @title Agent Entity Public API (ERC-8004/EAS oriented)
 * @notice Central entry point for agent logic within the FSD entities layer.
 */

export { agentService } from './api/agentService';
export { default as AgentWalletFactoryABI } from '../../shared/contracts/AgentWalletFactoryV3.abi.json';

export interface AgentCard {
    id: string;
    walletAddress: string;
    metadata: {
        name: string;
        description: string;
        protocols: string[];
    };
    isSecured: boolean;
}
