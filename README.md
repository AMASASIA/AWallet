# AWallet — Agent-Native Financial Infrastructure

> **AIエージェントが人間の介在なしに資金を保有・支払いできる金融インフラ**

AWalletは、AIエージェントが自律的にサービス利用料の支払い・送金・投資判断を実行し、企業がエージェントから直接決済を受け取れる「エージェント経済（Agentic Economy）」を実現するプラットフォームです。

## 🏗️ アーキテクチャ

### Phase 1.5: V3 Harness (Identity & Trust) ✅ 完了

| # | タスク | ステータス |
|---|---|---|
| 1.5.1 | **AgentWalletFactoryV3.sol** (ERC-8004 & EAS) | ✅ 完了 |
| 1.5.2 | **FSD Architecture Implementation** | ✅ 完了 |
| 1.5.3 | **EAS Security Check UI** (SwipeToConfirm) | ✅ 完了 |
| 1.5.4 | **IPFS Agent Card Logic** (ERC-8004) | ✅ 完了 |

*Last updated: 2026-04-04*
*Version: 3.0.0 — V3 Harness Integrated*
*Author: AWallet Architecture Team*

```
Human UI / Agent SDK / AIM3 Gateway (A2A)
              │
        Policy Engine (Guardrails)
              │
        AWallet Core Engine
   ┌──────────┼──────────┐
   Agent    Treasury   Settlement
   Identity  Manager   Protocol
   (DID)              (A2A/M2M)
              │
        Blockchain Layer
   ┌──────────┼──────────┐
   Agent     Awallet   Stablecoin
   Wallet    Token     Bridge
   (ERC4337) (ERC20)   (USDC)
```

## 🔑 コアコンポーネント

| コンポーネント | 説明 |
|---|---|
| **Agent Identity** | DIDベースのエージェント身元証明・権限管理 |
| **Policy Engine** | オンチェーンの支出制限・異常検知・人間エスカレーション |
| **A2A Settlement** | エージェント間のエスクロー型自動決済プロトコル |
| **Treasury Manager** | 資金管理・自動チャージ・投資判断エンジン |

## 🛡️ セキュリティ（不正利用防止）

- **Smart Contract Level**: PolicyGuard（改竄不可能な支出上限）
- **API Gateway Level**: Rate Limiting + Intent Validation
- **Monitoring Level**: リアルタイム異常検知
- **Human Oversight**: 緊急停止 + 完全な監査ログ

## 📂 プロジェクト構成

```
AWallet/
├── backend/          # Solidity スマートコントラクト (Base/Sepolia)
├── api/              # Express API サーバー (Cloud Run)
│   ├── contracts/    # V3 ABI, アドレス管理
│   └── modules/      # Agent API, IPFS, DID
└── frontend/         # React (FSD Structure)
    └── src/
        ├── entities/    # Agent (ERC-8004 Metadata + EAS Logic)
        ├── features/    # Agent Control (SwipeToConfirm Security UI)
        ├── shared/      # Contracts, Providers, UI Components
        └── AWalletApp.tsx
```

## 🔐 V3 Harness (ERC-8004 & EAS)
最新の **AgentWalletFactoryV3** は、以下の規格を統合した「オンチェーン・ハーネス」として機能します：
- **ERC-8004**: エージェント身元（NFT）とメタデータ（Agent Card）の統合。
- **ERC-8126 / EAS**: オンチェーン・セキュリティ・アテステーション（ETV）によるリスク遮断。
- **FSD (Feature-Sliced Design)**: AIエージェントに構造的制約を強制するディレクトリ設計。

## 🚀 Getting Started

```bash
# API サーバー起動
cd api && npm install && node server.js

# フロントエンド起動
cd frontend && npm install && npm start

# スマートコントラクトデプロイ
cd backend && npm install && npx truffle migrate
```

## 🔗 関連プロジェクト

- **AIM3 Gateway** — Agent-to-Agent 通信メッシュ
- **OKE Protocol** — オンチェーン認証プロトコル

## 📫 License

Private — All rights reserved.
