const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Check if the backend wallet is ready
 */
export async function checkHealth() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

/**
 * Wait for backend wallet to be ready
 */
export async function waitForBackend(maxRetries = 30, intervalMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const data = await checkHealth();
      if (data.walletReady) return data;
    } catch {
      // ignore, retry
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Backend wallet not ready after waiting');
}

/**
 * Get wallet info from backend
 */
export async function getWalletInfo() {
  const res = await fetch(`${API_URL}/api/wallet/info`);
  if (!res.ok) throw new Error('Failed to get wallet info');
  return res.json();
}

/**
 * Get wallet balances from backend
 */
export async function getBalances() {
  const res = await fetch(`${API_URL}/api/wallet/balances`);
  if (!res.ok) throw new Error('Failed to get balances');
  return res.json();
}

/**
 * Mint tokens via backend faucet
 * @param {'usd'|'eur'|'jpy'} token
 * @param {string} amount - Amount as string (e.g. "1000000000")
 */
export async function mintToken(token, amount) {
  const res = await fetch(`${API_URL}/api/tokens/mint/${token.toLowerCase()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Mint failed' }));
    throw new Error(err.error || `Failed to mint ${token.toUpperCase()}`);
  }
  return res.json();
}

/**
 * Get all orders
 */
export async function getOrders() {
  const res = await fetch(`${API_URL}/api/orders`);
  if (!res.ok) throw new Error('Failed to get orders');
  return res.json();
}

/**
 * Create a new order
 * @param {string} pair - e.g. "USD/EUR"
 * @param {'bid'|'ask'} direction
 * @param {string} price - Contract format (6 decimals, e.g. "921500")
 * @param {string} amount - Contract format (6 decimals, e.g. "1000000000")
 */
export async function createOrder(pair, direction, price, amount) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pair, direction, price, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Create order failed' }));
    throw new Error(err.error || 'Failed to create order');
  }
  return res.json();
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Cancel failed' }));
    throw new Error(err.error || 'Failed to cancel order');
  }
  return res.json();
}

/**
 * Match two orders
 */
export async function matchOrders(bidOrderId, askOrderId, matchAmount) {
  const res = await fetch(`${API_URL}/api/orders/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidOrderId, askOrderId, matchAmount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Match failed' }));
    throw new Error(err.error || 'Failed to match orders');
  }
  return res.json();
}
