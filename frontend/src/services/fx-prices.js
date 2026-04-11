// Mock FX price service with simulated fluctuations
const BASE_PRICES = {
  'USD/EUR': 0.9215,
  'USD/JPY': 149.85,
  'EUR/JPY': 162.72,
};

const PRICE_HISTORY_LENGTH = 50;

// Store price history in memory
const priceHistory = {};
Object.keys(BASE_PRICES).forEach((pair) => {
  priceHistory[pair] = [];
});

let lastPrices = { ...BASE_PRICES };

/**
 * Get current mock FX prices with slight random fluctuation
 */
export function getCurrentPrices() {
  const prices = {};
  for (const [pair, base] of Object.entries(BASE_PRICES)) {
    // Random walk with mean reversion
    const noise = (Math.random() - 0.5) * base * 0.002; // ±0.1% per tick
    const meanReversion = (base - lastPrices[pair]) * 0.1;
    const newPrice = lastPrices[pair] + noise + meanReversion;
    const rounded = Math.round(newPrice * 1e6) / 1e6;

    prices[pair] = rounded;
    lastPrices[pair] = rounded;

    // Store history
    priceHistory[pair].push({
      price: rounded,
      timestamp: Date.now(),
    });
    if (priceHistory[pair].length > PRICE_HISTORY_LENGTH) {
      priceHistory[pair].shift();
    }
  }
  return prices;
}

/**
 * Get price history for a pair
 */
export function getPriceHistory(pair) {
  return priceHistory[pair] || [];
}

/**
 * Get base prices (no fluctuation)
 */
export function getBasePrices() {
  return { ...BASE_PRICES };
}

/**
 * Convert human-readable price to contract format (6 decimals)
 * For USD/EUR: 0.9215 → "921500"
 * For USD/JPY: 149.85 → "149850000"
 */
export function priceToContract(pair, humanPrice) {
  return Math.round(humanPrice * 1e6).toString();
}

/**
 * Convert contract format to human-readable
 */
export function contractToPrice(pair, contractPrice) {
  const num = typeof contractPrice === 'string' ? parseInt(contractPrice) : contractPrice;
  return num / 1e6;
}

/**
 * Format price for display
 */
export function formatPrice(pair, price) {
  if (pair.includes('JPY')) {
    return price.toFixed(2);
  }
  return price.toFixed(4);
}