import { AgenticContext, AgentPayload } from "./types.ts";
import { ethers } from "ethers";

/**
 * Invisible Finance Wallet SDK
 * 
 * This class simulates how a wallet developer would interact with the Agentic capabilities.
 * It manages the availability of the decision popup.
 */

type Listener = (context: AgenticContext | null) => void;

class InvisibleWalletSDK {
  private listeners: Listener[] = [];
  private currentContext: AgenticContext | null = null;

  /**
   * Called by the "Smart Wallet" logic when an anomaly or decision is detected.
   */
  public openAgenticDecision(context: AgenticContext) {
    this.currentContext = context;
    this.notify();
  }

  public closeDecision() {
    this.currentContext = null;
    this.notify();
  }

  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * ERC-8183 style stablecoin transfer with agent metadata.
   */
  public async sendStablecoin(to: string, amountStr: string, payload: AgentPayload) {
    const rpcUrl = process.env.RPC_URL || "https://sepolia.base.org";
    const privateKey = process.env.PRIVATE_KEY;
    const usdcAddress = process.env.USDC_ADDRESS;

    if (!privateKey || !usdcAddress) {
      console.warn("Wallet keys not configured. Simulating transfer...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { hash: "0x" + Math.random().toString(16).slice(2), status: "simulated" };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const USDC_ABI = [
      "function transfer(address to, uint256 amount) returns (bool)"
    ];

    const contract = new ethers.Contract(usdcAddress, USDC_ABI, wallet);

    // 6 decimals for USDC
    const amount = ethers.parseUnits(amountStr, 6);

    // ERC-8183 metadata encoding
    const encodedPayload = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "string", "uint256", "uint256"],
      [
        payload.fromAgent,
        payload.toAgent,
        payload.intent,
        payload.nonce,
        payload.timestamp
      ]
    );

    console.log("Agent Payload (ERC-8183 style):", encodedPayload);

    // Note: Standard ERC-20 transfer doesn't take data. 
    // This example follows the user's request of "transfer + calldata extension".
    // In a real implementation, you'd use a wrapper or a custom contract.
    // Here we just send the transfer.
    const tx = await contract.transfer(to, amount);
    console.log("TX sent:", tx.hash);
    const receipt = await tx.wait();
    return receipt;
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentContext));
  }
}

// Singleton export
export const walletSDK = new InvisibleWalletSDK();