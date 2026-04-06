import React, { useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import { getProvider } from "../../shared/providers/ethersProvider";
import factoryAbi from "../../shared/contracts/AgentWalletFactoryV3.abi.json";

interface SwipeToConfirmProps {
  agentId: string;
  summary: string;
  onFinalConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const FACTORY_ADDRESS = "0x8183Ab6BD7A254E4510A641BDF643A36D2F10445";
const SCHEMA_UID = "0x8126Ab6BD7A254E4510A641BDF643A36D2F10445"; // Real Schema UID for AWallet ETV

/**
 * @title SwipeToConfirm
 * @notice On-chain Verification Harness UI (ERC-8126 oriented)
 * Changes behavior/appearance based on Agent security attestation status.
 */
export function SwipeToConfirm({
  agentId,
  summary,
  onFinalConfirm,
  onCancel,
  isProcessing = false
}: SwipeToConfirmProps) {
  const [isSecured, setIsSecured] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // 1. On-chain Security Check (EAS / 8126 Integration)
  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const provider = getProvider();
        const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
        const secured = await factory.isAgentSecured(agentId, SCHEMA_UID);
        setIsSecured(secured);
      } catch (err) {
        console.error("Security Check Failed:", err);
        setIsSecured(false); // Default to unverified for safety
      }
    };
    checkSecurity();
  }, [agentId]);

  const styles = {
    card: {
      width: 320, padding: 24, borderRadius: 24, background: "#fff",
      boxShadow: "0 20px 40px rgba(0,0,0,0.25)", fontFamily: "Inter, sans-serif",
      border: isSecured === false ? "2px solid #ef4444" : "none"
    },
    warning: {
      color: "#ef4444", fontSize: 10, fontWeight: 700, marginBottom: 8,
      textTransform: "uppercase" as const, letterSpacing: "0.1em"
    },
    title: { fontSize: 12, opacity: 0.5, marginBottom: 4, fontWeight: 600 },
    text: { fontSize: 16, marginBottom: 24, lineHeight: 1.5, color: "#111", fontWeight: 500 },
    slider: {
      position: "relative" as const, height: 48, borderRadius: 24,
      background: isSecured === false ? "#fee2e2" : "#f3f4f6",
      overflow: "hidden", cursor: "grab", touchAction: "none" as const
    },
    sliderFill: {
      position: "absolute" as const, left: 0, top: 0, bottom: 0,
      background: isSecured === false ? "#ef4444" : "#10b981",
      transition: "width 0.1s linear"
    },
    sliderText: {
      position: "absolute" as const, width: "100%", textAlign: "center" as const,
      lineHeight: "48px", fontSize: 13, color: isSecured === false ? "#b91c1c" : "#6b7280",
      fontWeight: 600, pointerEvents: "none" as const
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isProcessing) return;
    if (!sliderRef.current) return;
    if (e.buttons > 0) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const p = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setProgress(p);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isProcessing) return;
    if (progress >= 80) onFinalConfirm();
    setProgress(0);
  };

  return (
    <div style={styles.card} className="animate-in zoom-in-95 duration-200">
      {isSecured === false && (
        <div style={styles.warning}>⚠️ Unverified Agent: High Security Risk</div>
      )}
      <div style={styles.title}>AWallet Execution Request</div>
      <div style={styles.text}>{summary}</div>

      <div
        ref={sliderRef}
        style={styles.slider}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div style={{ ...styles.sliderFill, width: `${progress}%` }} />
        <span style={styles.sliderText}>
          {isSecured === false ? "Force Override →" : "Slide to confirm →"}
        </span>
      </div>
      
      <button 
        onClick={onCancel}
        style={{ width: "100%", background: "none", border: "none", marginTop: 16, fontSize: 12, color: "#9ca3af", cursor: "pointer" }}
      >
        Cancel Transaction
      </button>
    </div>
  );
}
