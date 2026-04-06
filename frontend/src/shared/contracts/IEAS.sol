// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IEAS
 * @notice Simplified EAS interface for security attestation checks (ERC-8126 oriented)
 */
interface IEAS {
    /**
     * @dev Check if a recipient has a valid, non-expired attestation for a specific schema.
     * @param recipient The address (AgentWallet) to verify
     * @param schemaUID The UID of the schema defining security trust metrics
     */
    function hasValidAttestation(address recipient, bytes32 schemaUID) external view returns (bool);
}
