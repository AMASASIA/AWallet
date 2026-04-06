import axios from 'axios';
import { ethers } from 'ethers';
import { getSigner, getProvider } from '../../../shared/providers/ethersProvider';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const FACTORY_ADDRESS = process.env.REACT_APP_FACTORY_V3_ADDRESS || '0x8183Ab6BD7A254E4510A641BDF643A36D2F10445';
const EAS_CONTRACT_ADDRESS = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e'; // Sepolia EAS

/**
 * @title agentService (V3 Deep Harness)
 * @notice 「深さ (Fukasa)」を追求したエージェント管理ロジック。
 * サーバー権限を剥奪し、オンチェーン証明(EAS)と身元(8004)を統合する。
 */
export const agentService = {
  
  /**
   * 1. createAgent: オンチェーンでのエージェント生成 (Identity & Wallet Binding)
   * ユーザーのSoul Walletで署名し、FactoryV3経由でNFTミントとWalletデプロイを実行。
   */
  async createAgentOnChain(name: string, description: string, mcpUrl: string) {
    const signer = await getSigner();
    const ownerAddress = await signer.getAddress();
    
    // 1-A. IPFS Metadata (ERC-8004 Agent Card) アップロード
    console.log("[Fukasa] Step 1: Uploading ERC-8004 Agent Card to IPFS...");
    const cid = await this.uploadAgentCard({ name, description, mcpUrl });
    const metadataURI = `ipfs://${cid}`;

    // 1-B. FactoryV3 Call (Atomic Creation)
    console.log("[Fukasa] Step 2: Minting Identity NFT and Deploying Agent Wallet...");
    const abi = [
      "function createAgent(address _owner, string memory _metadataURI) external returns (uint256)"
    ];
    const factory = new ethers.Contract(FACTORY_ADDRESS, abi, signer);
    const tx = await factory.createAgent(ownerAddress, metadataURI);
    const receipt = await tx.wait();
    
    // Log Agent ID from events
    console.log("[Fukasa] Agent Created Successfully:", receipt.hash);
    return receipt;
  },

  /**
   * 2. uploadAgentCard: ERC-8004 形式のメタデータ構築
   */
  async uploadAgentCard(agentData: { name: string; description: string; mcpUrl: string }) {
    const agentCard = {
      name: agentData.name,
      description: agentData.description,
      protocols: ["MCP/V1", "A2A/X402"],
      endpoints: {
        mcp: agentData.mcpUrl,
        a2a: `${agentData.mcpUrl}/pay`
      },
      attributes: [
        { trait_type: "Standard", value: "ERC-8004" },
        { trait_type: "TrustLayer", value: "ERC-8126/EAS" }
      ],
      createdAt: new Date().toISOString()
    };

    const response = await axios.post(`${API_BASE_URL}/api/registerIpfs`, {
      name: agentData.name,
      data: agentCard
    });
    return response.data.IpfsHash; 
  },

  /**
   * 3. issueETVAttestation: ETV (Endpoint Trust Verification) 証明の発行
   * 重要: これはサーバーではなくユーザーのブラウザ(Soul Wallet)で署名される必要がある。
   */
  async issueETVAttestation(targetWallet: string, schemaUID: string) {
    console.log("[Fukasa] Step 3: Issuing ETV Security Attestation via EAS...");
    const signer = await getSigner();
    
    /* 
       @ethereum-attestation-service/eas-sdk 相当のロジック
       ここでは、EAS.attest({ data: { recipient, expirationTime, ... } }) を呼び出す。
    */
    const easAbi = [
      "function attest(tuple(bytes32 schema, tuple(address recipient, uint64 expirationTime, bool revokable, bytes32 refUID, bytes data, uint256 value) data) request) external payable returns (bytes32)"
    ];
    const eas = new ethers.Contract(EAS_CONTRACT_ADDRESS, easAbi, signer);
    
    // Encode ETV Data (Simplified for Demo)
    const data = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["ETV Verified Endpoint"]);
    
    const request = {
      schema: schemaUID,
      data: {
        recipient: targetWallet,
        expirationTime: 0, // No expiration
        revokable: true,
        refUID: ethers.ZeroHash,
        data: data,
        value: 0
      }
    };

    const tx = await eas.attest(request);
    const receipt = await tx.wait();
    console.log("[Fukasa] EAS Attestation UID:", receipt.hash);
    return receipt.hash;
  }
};
