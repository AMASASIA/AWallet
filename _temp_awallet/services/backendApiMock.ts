import { ConsentPayload, ConsentResponse, DecisionType } from '../types';
import { VALIDATION_RULES } from '../constants';

/**
 * SIMULATED BACKEND API
 * 
 * In a real environment, this code runs on a secure Node.js server.
 * It verifies the physical proofs of consent before executing any logic.
 */

// Simulated database of logs
const auditLog: ConsentPayload[] = [];

export const verifyConsent = async (payload: ConsentPayload): Promise<ConsentResponse> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log('[BACKEND] Received Payload:', payload);

  // 1. Basic Schema Validation
  if (!payload.wallet_env || payload.wallet_env.financial_ui_exposed) {
    return {
      success: false,
      message: "Security Violation: Financial UI exposed."
    };
  }

  // 2. Handle "NO" and "NOT NOW"
  if (payload.decision !== DecisionType.YES) {
    auditLog.push(payload);
    return {
      success: true,
      message: payload.decision === DecisionType.NO ? "Action rejected." : "Action deferred."
    };
  }

  // 3. STRICT CONSENT VALIDATION FOR "YES"
  const metrics = payload.confirmation;
  
  if (!metrics) {
    return { success: false, message: "Missing confirmation metrics." };
  }

  // Rule: Progress >= 80%
  if (metrics.progress < VALIDATION_RULES.MIN_SWIPE_PROGRESS) {
    return { success: false, message: "Consent incomplete: insufficient slide distance." };
  }

  // Rule: Duration >= 500ms
  // This prevents accidental clicks or automated scripts simulating simple events fast
  if (metrics.duration_ms < VALIDATION_RULES.MIN_DURATION_MS) {
    return { success: false, message: "Consent invalid: Interaction too fast (bot protection)." };
  }

  // 4. "Invisible Execution"
  // At this point, the backend would trigger the blockchain tx or fiat movement.
  // The frontend never sees the tx hash in this flow.
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  auditLog.push({ ...payload, context: auditId }); // Storing context/id mapping

  return {
    success: true,
    message: "Action scheduled successfully.",
    audit_id: auditId
  };
};