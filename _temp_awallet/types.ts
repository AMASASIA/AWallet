export type Decision = "no" | "not_now" | "yes";

export enum DecisionType {
  NO = "no",
  NOT_NOW = "not_now",
  YES = "yes"
}

export interface SoulMetrics {
  soulPoints: number;
  pluralityScore: number; // Π(Q)
  stamps: number;
  isPinnedToMap: boolean;
  did?: string;
  policyStatus?: 'active' | 'warning' | 'restricted';
}

export interface SpendingPolicy {
  id: string;
  maxPerTx: string;
  dailyLimit: string;
  spentToday: string;
  categories: string[];
}

export interface X402Discovery {
  id: string;
  serviceName: string;
  domain: string;
  costPerRequest: string;
  status: 'discovered' | 'authorized' | 'blocked';
  lastUsed?: string;
}

export interface AgenticTask {
  id: string;
  title: string;
  subtitle: string;
  deadline: string;
  icon: string; // url or emoji
  summary: string; // The full text for the consent card
  soulReward: number;
  status: 'pending' | 'completed' | 'dismissed';
}

export enum ConfirmationMethod {
  SWIPE = "swipe",
  KEYBOARD = "keyboard"
}

export interface ConfirmationMetrics {
  method: ConfirmationMethod;
  progress: number;
  duration_ms: number;
  input_type: string;
}

export type WalletType = "standard" | "smart" | "hardware" | "mock";

export interface WalletEnv {
  type: WalletType;
  financial_ui_exposed: boolean;
}

export interface AgenticContext {
  id: string;
  summary: string;
}

export interface ConsentPayload {
  decision: DecisionType;
  confirmation: ConfirmationMetrics | null;
  context: string;
  timestamp: string;
  wallet_env: WalletEnv;
}

export interface AgentPayload {
  fromAgent: string;
  toAgent: string;
  intent: string;
  nonce: number;
  timestamp: number;
}

export interface ConsentResponse {
  success: boolean;
  message: string;
  audit_id?: string;
}