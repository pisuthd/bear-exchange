# InnermostFX — AI-Powered Private FX on Midnight

InnermostFX solves a core gap in both DeFi and TradFi: professional traders need private, efficient FX swaps (USDC/EURC/JPYC), but public chains leak strategy while AMMs introduce slippage and front-running. Built in Compact on Midnight, InnermostFX delivers a fully shielded limit orderbook where prices, sizes, and trade intent never appear on-chain — only commitment hashes and nullifiers are visible.

At the core is AI-powered market making. AI agents generate and manage dynamic order ladders using real-time FX signals, enabling deep liquidity without exposing strategies. Trades are executed via user-driven atomic matching with built-in price improvement, while partial fills automatically create remainder orders — preserving precision, capital efficiency, and privacy. The result is a system that combines confidential execution with verifiable settlement, aligned with Midnight's vision for shielded FX infrastructure.

## Key Features

- **Live on Midnight Preprod** — contract deployed and callable on preprod with real shielded transactions
- **AI order ladder generation** — market-making agents auto-create and refresh bid/ask spreads from FX feeds
- **Non-AMM execution — zero slippage** — exact-price matching, no curve-based pricing or front-running
- **Atomic Zswap matching + price improvement** — cross-spread trades settle atomically via Zswap shielded transfers; bidders get the better rate
- **Native partial fills** — remainder orders created automatically, preserving capital efficiency

## Quick Links

- [5-min Video Demo](https://drive.google.com/file/d/1pFQNdtphlIgGs_-8hJDnSvqLJFNrTu5k/view?usp=drive_link)
- [Live URL](https://innermost-midnight.vercel.app/)

## Project Structure

```
innermost/
├── contract/          # Compact smart contract (InnermostFX.compact) + tests
├── cli/               # CLI tool for deploying & joining contracts on preprod
├── backend-api/       # Express API server wrapping contract interactions
└── frontend/          # React + Vite + Tailwind frontend dApp
```

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────┐
│  AI Market   │────▶│  Backend API │────▶│  Compact Smart  │────▶│ Midnight │
│  Making      │     │  (Express)   │     │  Contract       │     │ Preprod  │
└─────────────┘     └──────┬───────┘     └─────────────────┘     └──────────┘
                           │                     ▲
                           ▼                     │
                    ┌──────────────┐     ┌───────────────┐
                    │  Frontend    │     │  CLI          │
                    │  (React)     │     │  (Deploy/Join)│
                    └──────────────┘     └───────────────┘
```

- **Contract** — Written in Compact (v0.20+), manages shielded orders, matching, and token operations via ZK proofs
- **CLI** — Deploys new contracts or joins existing ones on Midnight preprod using `ledger-v8` wallet SDK
- **Backend API** — Express server with a shared wallet that mediates all contract calls; provides REST endpoints for wallet, tokens, orders, and matching
- **Frontend** — React dApp with AI market-making dashboard, order creation, and trade execution UI

## Smart Contract

The core contract is written in **Compact v0.20+** (~500 LOC) and implements a shielded CLOB with these circuits:

- **`createOrder` / `batchCreateOrders2` / `batchCreateOrders4`** — post single or multi-level orders with shielded price, amount, and direction
- **`cancelOrder`** — cancel and refund locked tokens with ownership proof
- **`matchOrders`** — atomic cross-spread settlement with partial fill support and automatic price improvement
- **`mintUSD` / `mintEUR` / `mintJPY`** — mock faucet minting for shielded test tokens (callable from frontend)

Supports **3 FX pairs** (USD/EUR, USD/JPY, EUR/JPY) with 6-decimal price precision. On-chain state is minimal — only commitment hashes, nullifiers, and counters. All prices, amounts, and trade details remain shielded via ZK proofs.

### Mock Shielded Tokens

Test tokens can be minted by anyone directly from the frontend. Each token type has a unique **token color** (Zswap identifier) derived from the contract:

| Token | Color |
|-------|-------|
| USD | `50438fab45db36f4dd0e622c65212fd3dc02e868d1cd429eac61c4dfa77c32e1` |
| EUR | `83363546497e9db339b499268eabed92521a4558a27a5337bcf0fee689013780` |
| JPY | `a136e50f63889250cd276e0f9767ecac7b0f9a18ec06d44f23621cf7b57870d9` |

**Test coverage: 46/46 tests passing** — full & partial fills, price improvement, batch operations, multi-pair, and market-maker scenarios.

## Development Progress

This project was built as a **10-day hackathon** submission. During the last few days, we attempted to integrate the frontend directly with the live smart contract on Midnight's preprod network. However, due to wallet SDK integration challenges on the browser side, we pivoted to a **backend API with a shared wallet** architecture — all contract interactions are proxied through an Express server that holds a single server-side wallet.

Additionally, Midnight's `ledger-v8` SDK had very limited documentation and examples (only a counter project template was available), which required significant reverse-engineering to implement a complex multi-circuit DEX contract. Despite these constraints, we delivered a fully functional shielded FX orderbook with AI market making, atomic matching, and partial fills — all running on live preprod infrastructure.

## How to Test

### Prerequisites

**Compact Compiler**

Install the Midnight Compact compiler (follow the official [Midnight docs](https://docs.midnight.network/compact)).

Verify installation:

```bash
compact --version        # Compact CLI version
```

**Node.js** — v20+ required.

**Proof Server** — Run via Docker:

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:8.0.3 midnight-proof-server -v
```

### Steps

```bash
# 1. Install dependencies (all workspaces)
npm install

# 2. Compile the Compact contract artifacts
cd contract && npm run compact && npm run build && cd ..

# 3. Deploy or join a contract on preprod (requires proof server running)
cd cli && npm start && cd ..
# Follow the interactive prompts to deploy

# 4. Start the backend API server
cd backend-api
npm run dev
# Wait for "Server is ready to accept requests!"

# 5. Start the frontend
cd frontend && npm run dev
```

> **Live dApp**: A deployed frontend is available at [https://innermost-midnight.vercel.app/](https://innermost-midnight.vercel.app/) — however, no backend API has been deployed publicly, so on-chain features require running the backend locally.

## Deployment (Midnight Preprod)

| Contract | Address |
|----------|---------|
| InnermostFX | `75ae07cea19e9bbb34a6e8599174f6504744c67dbf49872c79a07a150a6eb316` |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Compact (v0.20+), Midnight ZK proofs |
| Blockchain | Midnight Network (Preprod) |
| Wallet SDK | `@midnight-ntwrk/ledger-v8`, `wallet-sdk-*` |
| Proof Generation | `midnightntwrk/proof-server:8.0.3` |
| Backend | Express, TypeScript, SQLite (better-sqlite3) |
| Frontend | React 19, Vite, Tailwind CSS |

## License

Apache-2.0
