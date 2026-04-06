# AWallet — Agent-Native Financial Infrastructure
## AIエージェント自律金融インフラ アーキテクチャ設計書

> **Mission**: AIエージェントが人間の介在なしに資金を保有・支払いできる金融インフラを提供し、エージェント経済（Agentic Economy）を実現する。

---

## 1. 現状の技術基盤（As-Is）

### 1.1 スマートコントラクト層
| コントラクト | 機能 | ファイル |
|---|---|---|
| `MultiSigWallet.sol` | マルチシグウォレット（submit/approve/execute） | `backend/contracts/Wallet/` |
| `WalletFactoryV4.sol` | ウォレット生成ファクトリー + DID登録 | `backend/contracts/Wallet/` |
| `MyToken.sol` | ERC20トークン（mint/burn/transfer + Votes） | `backend/contracts/Token/` |

### 1.2 API層（Express + ethers.js）
- Token mint/burn/balance/send
- MultiSig操作（submit/approve/revoke/execute）
- DID生成（ION）・IPFS保管
- Stripe Payment Intent

### 1.3 フロントエンド（React + MUI）
- ウォレット管理UI、トークン購入、トランザクション管理、VC管理

---

## 2. ターゲットアーキテクチャ（To-Be）

```
┌──────────────────────────────────────────────────────────────────┐
│                    AWallet Agent Economy Stack                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  Human UI   │  │  Agent SDK   │  │  AIM3 Gateway (A2A)   │   │
│  │  (React)    │  │  (REST/gRPC) │  │  Agent-to-Agent Mesh  │   │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬───────────┘   │
│         │                │                      │               │
│  ═══════╪════════════════╪══════════════════════╪═══════════     │
│         │          ┌─────┴──────┐               │               │
│         │          │  Policy    │               │               │
│         │          │  Engine    │◄──────────────┘               │
│         │          │ (Guardrail)│                               │
│         │          └─────┬──────┘                               │
│         │                │                                      │
│  ═══════╪════════════════╪══════════════════════════════════     │
│         │                │                                      │
│    ┌────┴────────────────┴──────────────────────────────┐       │
│    │              AWallet Core Engine                    │       │
│    │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │       │
│    │  │ Agent    │ │ Treasury │ │ Settlement         │  │       │
│    │  │ Identity │ │ Manager  │ │ Protocol (A2A/M2M) │  │       │
│    │  │ (DID)    │ │          │ │                    │  │       │
│    │  └──────────┘ └──────────┘ └────────────────────┘  │       │
│    └────────────────────┬───────────────────────────────┘       │
│                         │                                       │
│  ═══════════════════════╪═══════════════════════════════════     │
│                         │                                       │
│    ┌────────────────────┴───────────────────────────────┐       │
│    │            Blockchain / Settlement Layer            │       │
│    │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │       │
│    │  │  Agent   │ │ Awallet  │ │ Stablecoin         │  │       │
│    │  │  Wallet  │ │ Token    │ │ Bridge (USDC/USDT) │  │       │
│    │  │  (ERC4337│ │ (ERC20)  │ │                    │  │       │
│    │  │  +MultiSi│ │          │ │                    │  │       │
│    │  └──────────┘ └──────────┘ └────────────────────┘  │       │
│    └────────────────────────────────────────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. 新規レイヤー設計

### 3.1 Agent Identity Layer（エージェント身元証明）

**目的**: AIエージェントに固有のDID（Decentralized Identifier）を発行し、「誰が」「何の権限で」操作しているかを暗号学的に証明する。

```
┌─────────────────────────────────────────────┐
│           Agent Identity Structure           │
├─────────────────────────────────────────────┤
│  did:awallet:agent:<uuid>                    │
│                                              │
│  ├── agentType: "autonomous" | "supervised"  │
│  ├── owner: did:awallet:human:<address>      │
│  ├── capabilities: ["pay", "receive", ...]   │
│  ├── spendingPolicy: <policy-hash>           │
│  ├── createdAt: <timestamp>                  │
│  └── verificationMethod: <public-key>        │
└─────────────────────────────────────────────┘
```

**既存との接続**: 
- `WalletFactoryV4.sol` の `register()` を拡張し、Agent DIDを登録
- Agent DIDから対応するウォレットアドレスへの解決を実装

### 3.2 Policy Engine（ガードレール/不正利用防止）

**目的**: 人間の監督なしにAIが資金を動かす際の**安全装置**。これがAWalletの競争優位の核心。

```javascript
// Policy定義の例
{
  "policyId": "pol_agent_spending_001",
  "agentDid": "did:awallet:agent:abc123",
  "rules": [
    {
      "type": "SPENDING_LIMIT",
      "maxPerTransaction": "100 USDC",    // 1回あたり上限
      "maxDaily": "1000 USDC",            // 日次上限
      "maxMonthly": "10000 USDC"          // 月次上限
    },
    {
      "type": "APPROVED_RECIPIENTS",
      "whitelist": ["did:awallet:agent:*", "did:awallet:merchant:*"],
      "blacklist": ["did:awallet:agent:suspicious_*"]
    },
    {
      "type": "TRANSACTION_PURPOSE",
      "allowedCategories": ["service_payment", "api_usage", "data_purchase"],
      "requireJustification": true
    },
    {
      "type": "ANOMALY_DETECTION",
      "velocityCheck": true,              // 急激な送金パターン検知
      "geographicCheck": false,           // エージェントには不要
      "amountDeviationThreshold": 3.0     // 標準偏差3倍超で一時停止
    },
    {
      "type": "HUMAN_ESCALATION",
      "triggerOn": ["amount > 500 USDC", "new_recipient", "policy_violation"],
      "escalationMethod": "push_notification",
      "autoApproveAfter": null           // null = 必ず人間承認
    }
  ]
}
```

**オンチェーン実装**:
```solidity
// PolicyGuard.sol - スマートコントラクトレベルでの強制
contract PolicyGuard {
    struct SpendingPolicy {
        uint256 maxPerTx;
        uint256 maxDaily;
        uint256 maxMonthly;
        uint256 dailySpent;
        uint256 monthlySpent;
        uint256 lastDayReset;
        uint256 lastMonthReset;
        bool requiresHumanApproval;
        uint256 humanApprovalThreshold;
    }
    
    mapping(address => SpendingPolicy) public policies;
    mapping(address => bool) public frozenAgents;
    
    modifier withinPolicy(address agent, uint256 amount) {
        require(!frozenAgents[agent], "Agent is frozen");
        SpendingPolicy storage p = policies[agent];
        _resetIfNeeded(p);
        require(amount <= p.maxPerTx, "Exceeds per-tx limit");
        require(p.dailySpent + amount <= p.maxDaily, "Exceeds daily limit");
        require(p.monthlySpent + amount <= p.maxMonthly, "Exceeds monthly limit");
        _;
        p.dailySpent += amount;
        p.monthlySpent += amount;
    }
}
```

### 3.3 A2A Settlement Protocol（Agent-to-Agent決済）

**目的**: エージェント間のサービス利用料・データ購入・API呼び出し料を**自動精算**する。

```
 Agent A (Client)                    Agent B (Provider)
      │                                    │
      │  1. Service Request + Intent       │
      ├───────────────────────────────────► │
      │                                    │
      │  2. Quote (price + terms)          │
      │ ◄─────────────────────────────────┤
      │                                    │
      │  3. Escrow Lock (Policy Check)     │
      ├───────────────────────────────────► │
      │         │                          │
      │    [AWallet Policy Engine]         │
      │    ✓ Within spending limit         │
      │    ✓ Recipient whitelisted         │
      │    ✓ Purpose: "api_usage"          │
      │         │                          │
      │  4. Service Delivery               │
      │ ◄─────────────────────────────────┤
      │                                    │
      │  5. Delivery Confirmation          │
      ├───────────────────────────────────► │
      │                                    │
      │  6. Escrow Release                 │
      │         └──────► [Settlement]      │
      │                                    │
```

### 3.4 Treasury Manager（資金管理）

**目的**: エージェントの資金をプログラマティックに管理（入金・残高照会・自動チャージ・投資判断）

```javascript
// Agent Treasury Interface
{
  "agentDid": "did:awallet:agent:abc123",
  "balances": {
    "USDC": "2,450.00",
    "AWT": "10,000",         // AWallet Token
    "ETH": "0.5"
  },
  "autoRecharge": {
    "enabled": true,
    "threshold": "100 USDC",
    "rechargeAmount": "500 USDC",
    "source": "owner_bank_account"
  },
  "investmentPolicy": {
    "enabled": false,        // Phase 2で実装
    "strategy": "conservative",
    "maxAllocation": "20%"
  }
}
```

---

## 4. 実装フェーズ

### Phase 1: Foundation（基盤構築）— 4-6週間
| # | タスク | 詳細 |
|---|---|---|
| 1.1 | **AgentWallet.sol** | ERC-4337 Account Abstractionベースのエージェント専用ウォレット。既存MultiSigWalletを拡張し、Policy Guardを組み込む |
| 1.2 | **PolicyGuard.sol** | オンチェーンの支出制限・フリーズ機能・人間エスカレーション |
| 1.3 | **Agent DID拡張** | 既存DID生成APIにエージェントタイプ・権限情報を追加 |
| 1.4 | **Agent SDK (REST API)** | AIエージェントがAWalletを操作するためのAPIエンドポイント群 |

### Phase 2: A2A Economy（エージェント間経済）— 6-8週間
| # | タスク | 詳細 |
|---|---|---|
| 2.1 | **EscrowSettlement.sol** | エスクロー型のA2A決済コントラクト |
| 2.2 | **AIM3 Gateway統合** | A2Aメッシュネットワークとの接続。サービスディスカバリ・価格交渉プロトコル |
| 2.3 | **Stablecoin Bridge** | USDC/USDT対応。Circle MPC Walletとの統合も検討 |
| 2.4 | **Transaction Ledger** | 全A2A/M2M取引の監査ログ。不正検知用のリアルタイム分析 |

### Phase 3: Intelligence（自律投資）— 8-12週間
| # | タスク | 詳細 |
|---|---|---|
| 3.1 | **Investment Logic Engine** | AIエージェントによる自律的な資産運用判断エンジン |
| 3.2 | **Risk Management** | ポジションサイズ制限・ストップロス・分散投資の強制 |
| 3.3 | **Regulatory Compliance** | KYC/AMLフレームワークのエージェント版。監査証跡の完全記録 |

---

## 5. セキュリティ設計（不正利用防止）

### 5.1 多層防御アーキテクチャ

```
Layer 1: Smart Contract Level
├── PolicyGuard: 支出上限・ホワイトリスト（改竄不可能）
├── TimeLock: 大口取引の遅延実行
└── Circuit Breaker: 異常検知時の全停止

Layer 2: API Gateway Level
├── Rate Limiting: APIコール数制限
├── Intent Validation: 取引意図の妥当性検証
└── Agent Authentication: DID + JWT認証

Layer 3: Monitoring Level
├── Real-time Anomaly Detection: 取引パターンのAI監視
├── Velocity Checks: 短時間大量送金の検知
└── Cross-Agent Correlation: 共謀パターンの検出

Layer 4: Human Oversight Level
├── Dashboard: リアルタイム監視画面
├── Emergency Stop: ワンクリック停止
└── Audit Trail: 完全な取引監査ログ
```

### 5.2 脅威モデルと対策

| 脅威 | 攻撃シナリオ | 対策 |
|---|---|---|
| **Agent Hijacking** | AIエージェントのプロンプトインジェクションで不正送金指示 | 送金はすべてオンチェーンPolicy経由で検証。プロンプトで上限突破は不可能 |
| **Sybil Attack** | 大量のエージェントを生成し、少額ずつ資金を積荷 | エージェント生成にはオーナーDIDのstake必須。エージェント数上限 |
| **Wash Trading** | エージェント間で循環取引を繰り返し | グラフ分析で循環検知。同一オーナー間取引に特別監視 |
| **Fund Drain** | エージェントの秘密鍵漏洩 | ERC-4337 Social Recovery + 自動フリーズ + 資金の大部分をTimeLock付き |
| **Regulatory Evasion** | マネーロンダリング目的 | 全取引にDID紐付け。FATF Travel Rule準拠のデータ記録 |

---

## 6. API設計（Agent SDK）

### 6.1 新規エンドポイント

```
# Agent Management
POST   /api/v2/agent/register          # エージェントDID発行
GET    /api/v2/agent/:agentDid/status   # エージェント状態取得
PATCH  /api/v2/agent/:agentDid/policy   # ポリシー更新（オーナーのみ）
POST   /api/v2/agent/:agentDid/freeze   # 緊急停止

# Agent Wallet Operations
GET    /api/v2/wallet/:agentDid/balance     # 残高照会
POST   /api/v2/wallet/:agentDid/pay         # 支払い実行
POST   /api/v2/wallet/:agentDid/request     # 支払い請求
GET    /api/v2/wallet/:agentDid/history      # 取引履歴

# A2A Settlement
POST   /api/v2/settlement/quote             # 見積もり取得
POST   /api/v2/settlement/escrow/create      # エスクロー作成
POST   /api/v2/settlement/escrow/release     # エスクロー解放
POST   /api/v2/settlement/escrow/dispute     # 紛争申立て

# Policy & Compliance
GET    /api/v2/compliance/:agentDid/audit    # 監査ログ
GET    /api/v2/compliance/report             # コンプライアンスレポート
```

### 6.2 Agent SDK使用例

```javascript
// 他のAIエージェントが AWallet を使う場合のコード例
import { AwalletSDK } from '@awallet/agent-sdk';

const awallet = new AwalletSDK({
  agentDid: 'did:awallet:agent:my-trading-bot',
  apiKey: process.env.AWALLET_API_KEY,
  network: 'base-sepolia'
});

// 1. 残高確認
const balance = await awallet.getBalance('USDC');
console.log(`Current balance: ${balance} USDC`);

// 2. 別のエージェントにサービス料を支払い
const payment = await awallet.pay({
  to: 'did:awallet:agent:data-provider-001',
  amount: '5.00',
  currency: 'USDC',
  purpose: 'api_data_feed',
  memo: 'Market data subscription - Feb 2026'
});

// 3. エスクロー付きの取引
const escrow = await awallet.settlement.createEscrow({
  provider: 'did:awallet:agent:design-agent',
  amount: '150.00',
  currency: 'USDC',
  deliverable: 'Logo design for Project X',
  deadline: '2026-03-01T00:00:00Z'
});

// サービス完了後にリリース
await awallet.settlement.releaseEscrow(escrow.id);
```

---

## 7. 差別化要因（Why AWallet）

| 競合 | アプローチ | AWalletの優位性 |
|---|---|---|
| **Stripe Agent Toolkit** | 既存Stripe APIのラッパー | AWalletはネイティブにオンチェーン。ポリシーが改竄不可能で信頼性が桁違い |
| **Coinbase AgentKit** | CEX中心の暗号資産操作 | AWalletはA2A決済プロトコルまで包含。DID統合で身元保証 |
| **Skyfire** | 汎用Agent支払い | AWalletはMultiSig + Policy Guardによる多層防御が独自 |
| **従来のMultiSig** | 人間向け設計 | AWalletはAgent-Nativeで設計。ERC-4337 AA対応でガスレス |

---

## 8. 技術スタック

| レイヤー | 技術 |
|---|---|
| **Smart Contracts** | Solidity 0.8+, OpenZeppelin, ERC-4337 |
| **Blockchain** | Base (L2) / Ethereum メインネット |
| **Backend API** | Node.js (Express) → NestJS移行を推奨 |
| **Agent SDK** | TypeScript / Python |
| **DID** | ION (既存) → did:web 併用 |
| **Monitoring** | Grafana + Prometheus + カスタムアノマリ検知 |
| **Stablecoin** | USDC (Circle) / USDT |

---

## 9. 実装状況

### Phase 1: Foundation ✅ 完了

| # | タスク | ファイル | ステータス |
|---|---|---|---|
| 1.1 | **AgentWallet.sol** | `backend/contracts/Agent/AgentWallet.sol` | ✅ 完了 |
| 1.2 | **PolicyGuard.sol** | `backend/contracts/Agent/PolicyGuard.sol` | ✅ 完了 |
| 1.3 | **AgentWalletFactory.sol** | `backend/contracts/Agent/AgentWalletFactory.sol` | ✅ 完了 |
| 1.4 | **Agent API v2** | `api/modules/agentApi.js` | ✅ 完了 |
| 1.5 | **Agent Dashboard** | `frontend/src/components/pages/AgentDashboard.jsx` | ✅ 完了 |

### 実装済みユースケース

1. **データ購入と投資判断**: AIが10-K年次報告書を有料APIから購入 → 売上成長率分析 → 条件合致時に株式購入を自動実行
2. **サービス代金の送金・決済**: A2Aエスクロー決済。$150のデザイン料をエスクローにロック → 納品確認後に解放
3. **監査ログ**: 全取引（支払い・投資・データ購入・エスクロー・ブロックされた取引）を自動記録・追跡

### Phase 1.5: V3 Harness (2026 Strategy) — 現行 ✅ 完了
| # | タスク | 詳細 | ステータス |
|---|---|---|---|
| 1.5 | **AgentWalletFactoryV3** | ERC-8004/8126 統合ファクトリー。NFTミントとWallet生成をアトミック化 | ✅ 完了 |
| 1.6 | **EAS Security Check** | オンチェーン証明(EAS)を フロントエンドUI (SwipeToConfirm) に統合 | ✅ 完了 |
| 1.7 | **FSD Architecture** | AIエージェントへの「ディレクトリ制約(Harness)」の適用 | ✅ 完了 |

### 次のアクション（Phase 2）

1. **Phase 2.1**: AIM3 Gateway統合（A2Aメッシュネットワーク接続）
2. **Phase 2.2**: Stablecoin Bridge（USDC/USDT実トークン対応）
3. **Phase 2.3**: Risk Management（ストップロス・分散投資の強制）
4. **Phase 2.4**: 本番ネットワーク対応（Base Sepolia → Base Mainnet）

---

*Last updated: 2026-04-04*
*Version: 3.0.0 — Phase 1.5 V3 Harness Complete*
*Author: AWallet Architecture Team*

