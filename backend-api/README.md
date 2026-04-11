# InnermostFX Backend API

A backend service that mimics the CLI functionality for the Midnight compact project, providing REST API endpoints for wallet management, token operations, and order management.

## Overview

This backend API wraps the Midnight SDK functionality, allowing frontend applications to interact with the InnermostFX contract through simple HTTP requests instead of directly using the CLI. It includes:

- **Server-Side Wallet**: Wallet is initialized once on server startup, not via API calls
- **Token Operations**: Mint USD, EUR, and JPY tokens
- **Order Management**: Create, cancel, and match orders
- **Database**: SQLite database for persisting contract and order data

## Key Features

- ✅ Express.js REST API
- ✅ Wallet initialized on server startup (no API-based wallet creation)
- ✅ Automatic wallet sync with network on startup
- ✅ SQLite database for data persistence
- ✅ Token minting (USD, EUR, JPY)
- ✅ Order creation and management
- ✅ Order matching functionality
- ✅ CORS enabled for frontend integration

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Midnight network access (indexer, node, proof server)
- Contract artifacts (from `contract/` directory)

## Installation

1. **Navigate to the backend directory**:
   ```bash
   cd backend-api-new
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Ensure contract artifacts are built**:
   ```bash
   cd ../contract
   npm run build
   cd ../backend-api-new
   ```

## Configuration

Configuration is handled in `src/config.ts` and can be customized via environment variables:

```typescript
export const apiConfig = {
  port: 3000,
  corsOrigins: ['http://localhost:5173', 'http://localhost:3000'],
  databasePath: path.join(process.cwd(), 'database', 'innermostfx.db'),
  // Wallet configuration
  wallet: {
    // Set to true to create a new wallet on startup
    // Set to false to import existing wallet from seed
    createNew: process.env.CREATE_NEW_WALLET !== 'false',
    // Seed for existing wallet (only used if createNew is false)
    seed: process.env.WALLET_SEED || '',
    // Path to store wallet seed
    seedPath: path.join(process.cwd(), 'database', 'wallet-seed.txt'),
  },
  // Contract configuration
  contract: {
    // Contract address to join (if not deploying new contract)
    address: process.env.CONTRACT_ADDRESS || '',
    // Deploy new contract on startup if no contract exists
    deployNew: process.env.DEPLOY_NEW_CONTRACT === 'true',
  },
};
```

### Environment Variables

- `CREATE_NEW_WALLET` - Set to `false` to import existing wallet (default: true)
- `WALLET_SEED` - Hex seed for existing wallet (required if CREATE_NEW_WALLET is false)
- `CONTRACT_ADDRESS` - Contract address to join (optional)
- `DEPLOY_NEW_CONTRACT` - Set to `true` to deploy new contract (default: false)

## Running the Server

1. **Build the TypeScript code**:
   ```bash
   npm run build
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

The server will:
1. Initialize the database
2. Create or import the wallet (this may take time)
3. Sync with the network (this may take time)
4. Start the Express server on `http://localhost:3000`

The server will not accept requests until the wallet is fully initialized and synced.

### Startup Process

```
============================================================
Starting InnermostFX Backend API...
============================================================

[1/3] Database initialized

[2/3] Initializing wallet (this may take some time)...
Creating new wallet...
Deriving wallet keys...
Building wallet configuration...
Initializing wallet...
Wallet initialized:
  Shielded Address: ztest...
  Unshielded Address: t...
  Dust Address: d...
✓ Wallet initialized

[3/3] Waiting for wallet to sync with network...
✓ Wallet synced

============================================================
Starting Express server...
============================================================

✓ Server started successfully!

Server Information:
  Port: 3000
  Health check: http://localhost:3000/health
  API base URL: http://localhost:3000/api

Available Endpoints:
  - Wallet: http://localhost:3000/api/wallet/*
  - Tokens: http://localhost:3000/api/tokens/*
  - Orders: http://localhost:3000/api/orders/*

============================================================
Server is ready to accept requests!
============================================================
```

3. **Check health**:
   ```bash
   curl http://localhost:3000/health
   ```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-11T12:00:00.000Z",
  "walletReady": true
}
```

## API Endpoints

### Health Check

```
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-11T12:00:00.000Z",
  "walletReady": true
}
```

### Wallet Endpoints

> **Note**: Wallet is initialized during server startup. There are no create/init endpoints.

#### Get Wallet Info

```
GET /api/wallet/info
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "shieldedAddress": "ztest...",
    "unshieldedAddress": "t...",
    "dustAddress": "d...",
    "createdAt": "2026-04-11T12:00:00.000Z"
  }
}
```

#### Get Balances

```
GET /api/wallet/balances
```

**Response**:
```json
{
  "success": true,
  "data": {
    "shielded": {
      "USD": "1000000000",
      "EUR": "2000000000",
      "JPY": "3000000000"
    },
    "unshielded": "5000000000",
    "dust": "100000000"
  }
}
```

### Token Endpoints

#### Mint USD

```
POST /api/tokens/mint/usd
Content-Type: application/json

{
  "amount": "1000000000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "USD tokens minted successfully",
  "data": {
    "amount": "1000000000"
  }
}
```

#### Mint EUR

```
POST /api/tokens/mint/eur
Content-Type: application/json

{
  "amount": "2000000000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "EUR tokens minted successfully",
  "data": {
    "amount": "2000000000"
  }
}
```

#### Mint JPY

```
POST /api/tokens/mint/jpy
Content-Type: application/json

{
  "amount": "3000000000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "JPY tokens minted successfully",
  "data": {
    "amount": "3000000000"
  }
}
```

### Order Endpoints

#### Create Order

```
POST /api/orders
Content-Type: application/json

{
  "pair": "USD/JPY",
  "direction": "bid",
  "price": "150000000",
  "amount": "1000000000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "0x..."
  }
}
```

#### Get All Orders

```
GET /api/orders
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderId": "0x...",
      "pair": "USD/JPY",
      "direction": "bid",
      "price": "150000000",
      "amount": "1000000000",
      "status": "pending",
      "createdAt": "2026-04-11T12:00:00.000Z"
    }
  ]
}
```

#### Cancel Order

```
DELETE /api/orders/:orderId
```

**Response**:
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "orderId": "0x..."
  }
}
```

#### Match Orders

```
POST /api/orders/match
Content-Type: application/json

{
  "bidOrderId": "0x...",
  "askOrderId": "0x...",
  "matchAmount": "500000000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Orders matched successfully",
  "data": {
    "bidOrderId": "0x...",
    "askOrderId": "0x...",
    "matchAmount": "500000000"
  }
}
```

## Usage Examples

### Example: Complete Workflow

```bash
# 1. Server is already running with initialized wallet
# (Wallet was initialized during server startup)

# 2. Check wallet info
curl http://localhost:3000/api/wallet/info

# 3. Mint some USD tokens
curl -X POST http://localhost:3000/api/tokens/mint/usd \
  -H "Content-Type: application/json" \
  -d '{"amount": "1000000000"}'

# 4. Create a bid order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "pair": "USD/JPY",
    "direction": "bid",
    "price": "150000000",
    "amount": "1000000000"
  }'

# 5. Check balances
curl http://localhost:3000/api/wallet/balances

# 6. Get all orders
curl http://localhost:3000/api/orders
```

### Example: Using with Frontend

```javascript
// Check if server is ready
const health = await fetch('http://localhost:3000/health')
  .then(r => r.json());
if (!health.walletReady) {
  throw new Error('Server not ready yet');
}

// Get wallet info
const wallet = await fetch('http://localhost:3000/api/wallet/info')
  .then(r => r.json());

// Mint tokens
await fetch('http://localhost:3000/api/tokens/mint/usd', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: '1000000000' }),
});

// Create order
const order = await fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pair: 'USD/JPY',
    direction: 'bid',
    price: '150000000',
    amount: '1000000000',
  }),
});
```

### Example: Using Existing Wallet

```bash
# Set environment variable to use existing wallet
export WALLET_SEED="your-hex-seed-here"
export CREATE_NEW_WALLET=false

# Start server
npm start
```

## Database Schema

### Wallets Table
```sql
CREATE TABLE wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seed TEXT NOT NULL UNIQUE,
  shieldedAddress TEXT NOT NULL,
  unshieldedAddress TEXT NOT NULL,
  dustAddress TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Contracts Table
```sql
CREATE TABLE contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractAddress TEXT NOT NULL UNIQUE,
  secretKey TEXT NOT NULL,
  deployed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL UNIQUE,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL,
  price TEXT NOT NULL,
  amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Wallet Seed Management

The wallet seed is stored in `database/wallet-seed.txt` by default. This file is created automatically when:

1. A new wallet is created (default behavior)
2. The seed needs to be persisted for future server restarts

**Important**: Keep this file secure! Anyone with access to it can control your wallet.

### Backup Your Seed

After the first run, backup your wallet seed:

```bash
cat database/wallet-seed.txt
```

Save this seed in a secure location.

### Restore from Seed

```bash
export WALLET_SEED="your-backed-up-seed"
export CREATE_NEW_WALLET=false
npm start
```

## Error Handling

All endpoints return responses in the following format:

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Troubleshooting

### Server Not Starting

If the server fails to start, check:
1. Midnight node is running on the correct endpoint
2. Indexer is accessible
3. Proof server is running
4. Contract artifacts are built

### Wallet Not Ready

If `/health` returns `"walletReady": false`:
1. Wait a few more seconds - wallet sync can take time
2. Check server logs for initialization progress
3. Verify network connectivity

### Connection Errors

Ensure that:
- Midnight node is running on `https://rpc.preprod.midnight.network`
- Indexer is running on `https://indexer.preprod.midnight.network/api/v3/graphql`
- Proof server is running on `http://127.0.0.1:6300`

## Development

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

### Watch mode (for development)
```bash
npm run dev
```

## License

Apache-2.0

## Support

For issues and questions, please refer to the main project documentation or create an issue in the repository.