# Quick Start Guide - InnermostFX Backend API

This guide will help you get the backend API up and running quickly.

## What Changed?

The backend has been updated to **initialize the wallet on server startup** instead of requiring API calls to create/init the wallet. This provides:

1. **Simpler workflow** - Just start the server and it's ready
2. **Better reliability** - Wallet is fully synced before accepting requests
3. **Easier frontend integration** - Frontend just needs to wait for `/health` to return `walletReady: true`

## Quick Start (5 minutes)

### 1. Build the Contract

```bash
cd contract
npm run build
cd ..
```

### 2. Install Backend Dependencies

```bash
cd backend-api-new
npm install
```

### 3. Start the Server

```bash
npm run build
npm start
```

**Wait for initialization** (this takes 1-3 minutes):
- Database initializes
- Wallet is created/imported
- Wallet syncs with network
- Server starts accepting requests

You'll see:
```
✓ Wallet initialized
✓ Wallet synced
✓ Server started successfully!
Server is ready to accept requests!
```

### 4. Test the API

In a new terminal:

```bash
# Check health
curl http://localhost:3000/health

# Get wallet info
curl http://localhost:3000/api/wallet/info

# Mint USD tokens
curl -X POST http://localhost:3000/api/tokens/mint/usd \
  -H "Content-Type: application/json" \
  -d '{"amount": "1000000000"}'

# Check balances
curl http://localhost:3000/api/wallet/balances
```

## Frontend Integration

### Simple Integration Pattern

```javascript
// 1. Wait for server to be ready
async function waitForServerReady() {
  while (true) {
    try {
      const response = await fetch('http://localhost:3000/health');
      const data = await response.json();
      if (data.walletReady) {
        console.log('Server is ready!');
        return true;
      }
      console.log('Wallet not ready yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log('Server not responding, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// 2. Use the API
async function mintTokens() {
  await waitForServerReady();
  
  const response = await fetch('http://localhost:3000/api/tokens/mint/usd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: '1000000000' }),
  });
  
  const data = await response.json();
  console.log('Minted:', data);
}

// 3. Create order
async function createOrder() {
  const response = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pair: 'USD/JPY',
      direction: 'bid',
      price: '150000000',
      amount: '1000000000',
    }),
  });
  
  const data = await response.json();
  console.log('Order created:', data);
}
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useBackendAPI() {
  const [isReady, setIsReady] = useState(false);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('http://localhost:3000/health');
      const data = await response.json();
      setIsReady(data.walletReady);
    } catch (error) {
      console.error('Health check failed:', error);
      setTimeout(checkHealth, 2000);
    }
  };

  const getWalletInfo = async () => {
    if (!isReady) throw new Error('Server not ready');
    const response = await fetch('http://localhost:3000/api/wallet/info');
    return response.json();
  };

  const mintUSD = async (amount) => {
    if (!isReady) throw new Error('Server not ready');
    const response = await fetch('http://localhost:3000/api/tokens/mint/usd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return response.json();
  };

  const createOrder = async (order) => {
    if (!isReady) throw new Error('Server not ready');
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return response.json();
  };

  return { isReady, getWalletInfo, mintUSD, createOrder };
}
```

## Common Scenarios

### Scenario 1: Fresh Start (New Wallet)

Just run `npm start`. The backend will:
1. Create a new wallet
2. Save the seed to `database/wallet-seed.txt`
3. Sync with the network
4. Be ready to accept requests

**IMPORTANT**: Backup the seed after first run!
```bash
cat database/wallet-seed.txt
```

### Scenario 2: Restarting with Same Wallet

Just run `npm start` again. The backend will:
1. Read seed from `database/wallet-seed.txt`
2. Restore the wallet
3. Sync with the network
4. Be ready to accept requests

### Scenario 3: Using Existing Wallet

```bash
export WALLET_SEED="your-existing-hex-seed"
export CREATE_NEW_WALLET=false
npm start
```

### Scenario 4: Development Mode

```bash
# Terminal 1: Start server with auto-reload
npm run dev

# Terminal 2: Run tests
curl http://localhost:3000/health
```

## API Endpoints Reference

### Health
- `GET /health` - Check if server and wallet are ready

### Wallet
- `GET /api/wallet/info` - Get wallet information
- `GET /api/wallet/balances` - Get all balances

### Tokens
- `POST /api/tokens/mint/usd` - Mint USD tokens
- `POST /api/tokens/mint/eur` - Mint EUR tokens
- `POST /api/tokens/mint/jpy` - Mint JPY tokens

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `DELETE /api/orders/:orderId` - Cancel order
- `POST /api/orders/match` - Match two orders

## Troubleshooting

### "Server not ready" error

**Solution**: Wait for the server to fully initialize. Check the logs:
```
✓ Wallet initialized
✓ Wallet synced
✓ Server started successfully!
```

### "Wallet not ready" in health check

**Solution**: The wallet is still syncing. This can take 1-3 minutes on first run. Wait and try again.

### "Connection refused"

**Solution**: Make sure the server is running:
```bash
npm start
```

### "No wallet found"

**Solution**: This shouldn't happen with the new initialization flow. If it does, delete the database and restart:
```bash
rm -rf database/
npm start
```

## Next Steps

1. **Test the API**: Try all endpoints to ensure everything works
2. **Integrate with Frontend**: Use the frontend integration patterns above
3. **Deploy**: Set up environment variables for production
4. **Monitor**: Check `/health` endpoint regularly to ensure server is operational

## Additional Resources

- Full documentation: See `README.md`
- API reference: See `README.md` - API Endpoints section
- Troubleshooting: See `README.md` - Troubleshooting section

## Support

If you encounter issues:
1. Check the server logs
2. Verify network connectivity
3. Ensure contract artifacts are built
4. Check environment variables