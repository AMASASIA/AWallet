import React, { useState, useRef } from "react";
import { Decision } from "../types";

interface FinalConsentCardProps {
  summary: string;
  onFinalConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function FinalConsentCard({
  summary,
  onFinalConfirm,
  onCancel,
  isProcessing = false
}: FinalConsentCardProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [progress, setProgress] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const canConfirm = decision === "yes" && progress >= 80;

  const styles = {
    card: {
      width: 320,
      padding: 24,
      borderRadius: 24,
      background: "#fff",
      boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
      fontFamily: "Inter, sans-serif",
      position: 'relative' as const,
      overflow: 'hidden'
    },
    title: { fontSize: 12, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: 600 },
    text: { fontSize: 16, marginBottom: 24, lineHeight: 1.5, color: '#111', fontWeight: 500 },
    buttons: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
    },
    button: {
      flex: 1,
      padding: '12px 0',
      borderRadius: 12,
      border: 'none',
      background: '#f3f4f6',
      color: '#4b5563',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    buttonActive: {
      background: '#111',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    },
    slider: {
      position: "relative" as const,
      height: 48,
      borderRadius: 24,
      background: "#f3f4f6",
      overflow: "hidden",
      cursor: "grab",
      touchAction: "none" as const,
      marginTop: 8
    },
    sliderFill: {
      position: "absolute" as const,
      left: 0,
      top: 0,
      bottom: 0,
      background: "#10b981",
      transition: 'width 0.1s linear'
    },
    sliderText: {
      position: "absolute" as const,
      width: "100%",
      textAlign: "center" as const,
      lineHeight: "48px",
      fontSize: 14,
      color: "#6b7280",
      fontWeight: 500,
      pointerEvents: 'none' as const
    },
    close: {
        position: 'absolute' as const,
        top: 16,
        right: 16,
        background: 'transparent',
        border: 'none',
        color: '#9ca3af',
        cursor: 'pointer'
    },
    overlay: {
        position: 'absolute' as const,
        inset: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        gap: 12
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isProcessing) return;
    if (!sliderRef.current) return;
    if (e.buttons > 0) {
      sliderRef.current.setPointerCapture(e.pointerId);
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const p = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setProgress(p);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isProcessing) return;
    if (progress >= 80) {
        onFinalConfirm();
    }
    setProgress(0);
    if(sliderRef.current) sliderRef.current.releasePointerCapture(e.pointerId);
  };

  return (
    <div style={styles.card} className="animate-in zoom-in-95 duration-200">
      {isProcessing && (
        <div style={styles.overlay}>
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Minting Soul...</div>
        </div>
      )}
      <button style={styles.close} onClick={onCancel} disabled={isProcessing}>✕</button>
      <div style={styles.title}>AI Assistant</div>
      <div style={styles.text}>{summary}</div>

      {!decision ? (
        <div style={styles.buttons}>
          <button style={styles.button} onClick={() => onCancel()} disabled={isProcessing}>NO</button>
          <button style={styles.button} onClick={() => onCancel()} disabled={isProcessing}>NOT NOW</button>
          <button style={{...styles.button, ...styles.buttonActive}} onClick={() => setDecision("yes")} disabled={isProcessing}>YES</button>
        </div>
      ) : (
        <div
          ref={sliderRef}
          style={styles.slider}
          onPointerDown={(e) => handlePointerMove(e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div
            style={{
              ...styles.sliderFill,
              width: `${progress}%`,
            }}
          />
          <span style={{
              ...styles.sliderText,
              color: progress > 50 ? 'white' : '#6b7280',
              opacity: progress > 80 ? 0 : 1
          }}>Slide to confirm →</span>
        </div>
      )}
    </div>
  );
}