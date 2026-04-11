/**
 * Mock AI service — simulates Claude-like market analysis and ladder generation.
 * Generates realistic-looking reasoning and optimal order ladders.
 */

const AI_DELAY_MS = 1500; // Simulate API latency

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Risk profile configurations
 */
const RISK_PROFILES = {
  conservative: { spreadPct: 0.002, sizeScale: 0.5, label: 'Conservative' },
  moderate: { spreadPct: 0.005, sizeScale: 1.0, label: 'Moderate' },
  aggressive: { spreadPct: 0.01, sizeScale: 1.5, label: 'Aggressive' },
};

/**
 * Generate a market making ladder with mock AI reasoning
 * @param {Object} params
 * @param {string} params.pair - e.g. "USD/EUR"
 * @param {number} params.midPrice - Current mid price
 * @param {number} params.levels - Number of bid/ask levels (1-10)
 * @param {number} params.totalAmount - Total amount to deploy (human readable, e.g. 10000)
 * @param {'conservative'|'moderate'|'aggressive'} params.riskLevel
 * @returns {Promise<{orders: Array, reasoning: string, confidence: number}>}
 */
export async function generateLadder({ pair, midPrice, levels = 5, totalAmount = 10000, riskLevel = 'moderate' }) {
  await sleep(AI_DELAY_MS + Math.random() * 1000); // Simulate thinking time

  const risk = RISK_PROFILES[riskLevel] || RISK_PROFILES.moderate;
  const [base, quote] = pair.split('/');
  const isJPY = pair.includes('JPY');
  const decimals = isJPY ? 2 : 4;

  const spreadPct = risk.spreadPct;
  const halfSpread = midPrice * spreadPct;
  const levelSpacing = halfSpread / levels;

  const orders = [];
  const amountPerLevel = Math.floor((totalAmount * risk.sizeScale) / levels);

  // Generate bid levels (below mid)
  for (let i = 1; i <= levels; i++) {
    const price = midPrice - halfSpread + (levels - i) * levelSpacing;
    const priceStr = price.toFixed(decimals + 2); // extra precision for contract
    const contractPrice = Math.round(price * 1e6).toString();
    const contractAmount = (amountPerLevel * 1e6).toString();
    orders.push({
      direction: 'bid',
      pair,
      price: parseFloat(price.toFixed(decimals)),
      priceStr,
      contractPrice,
      amount: amountPerLevel,
      contractAmount,
      label: `Bid L${i}`,
    });
  }

  // Generate ask levels (above mid)
  for (let i = 1; i <= levels; i++) {
    const price = midPrice + halfSpread + (i - 1) * levelSpacing;
    const priceStr = price.toFixed(decimals + 2);
    const contractPrice = Math.round(price * 1e6).toString();
    const contractAmount = (amountPerLevel * 1e6).toString();
    orders.push({
      direction: 'ask',
      pair,
      price: parseFloat(price.toFixed(decimals)),
      priceStr,
      contractPrice,
      amount: amountPerLevel,
      contractAmount,
      label: `Ask L${i}`,
    });
  }

  // Sort bids descending, asks ascending
  orders.sort((a, b) => {
    if (a.direction !== b.direction) return a.direction === 'bid' ? -1 : 1;
    if (a.direction === 'bid') return b.price - a.price;
    return a.price - b.price;
  });

  const bestBid = orders.find((o) => o.direction === 'bid');
  const bestAsk = orders.find((o) => o.direction === 'ask');
  const effectiveSpread = bestAsk && bestBid ? bestAsk.price - bestBid.price : 0;
  const spreadPctDisplay = ((effectiveSpread / midPrice) * 100).toFixed(3);

  const reasoning = generateReasoning(pair, midPrice, riskLevel, levels, spreadPctDisplay, base, quote, isJPY, amountPerLevel);
  const confidence = riskLevel === 'conservative' ? 92 : riskLevel === 'moderate' ? 85 : 73;

  return { orders, reasoning, confidence, spreadPct: spreadPctDisplay };
}

/**
 * Generate mock AI analysis text
 */
function generateReasoning(pair, midPrice, riskLevel, levels, spreadPct, base, quote, isJPY, amountPerLevel) {
  const riskEmoji = riskLevel === 'conservative' ? '🛡️' : riskLevel === 'moderate' ? '⚖️' : '🔥';
  const trend = Math.random() > 0.5 ? 'bullish' : 'bearish';
  const momentum = Math.random() > 0.5 ? 'strong' : 'moderate';

  return `${riskEmoji} **AI Market Analysis — ${pair}**

📊 **Current Market State:**
Mid price: ${isJPY ? midPrice.toFixed(2) : midPrice.toFixed(4)} ${quote}
Detected trend: ${trend === 'bullish' ? '↗️ Bullish' : '↘️ Bearish'} with ${momentum} momentum
Volatility: ${riskLevel === 'aggressive' ? 'High — wider spreads recommended' : riskLevel === 'moderate' ? 'Moderate — balanced approach' : 'Low — tight spreads safe'}

📋 **Strategy: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} (${levels} levels)**
• Spread: ${spreadPct}% effective
• ${levels} bid levels below mid, ${levels} ask levels above mid
• ~${amountPerLevel.toLocaleString()} ${base} per level
• Total deployment: ~${(amountPerLevel * levels).toLocaleString()} ${base} per side

💡 **Rationale:**
${riskLevel === 'conservative'
    ? 'Tight spreads capture high-frequency small profits. Lower risk of adverse selection. Suitable for range-bound markets.'
    : riskLevel === 'moderate'
    ? 'Balanced spread captures reasonable profit while maintaining fill probability. Good for markets with moderate directional bias.'
    : 'Wide spreads maximize profit per fill but reduce fill frequency. Best for volatile markets where price swings are expected.'
  }

⚠️ **Risk Assessment:** ${riskLevel === 'conservative' ? 'Low risk. Max drawdown ~0.5%.' : riskLevel === 'moderate' ? 'Medium risk. Max drawdown ~1.5%.' : 'Higher risk. Max drawdown ~3%. Monitor closely.'}`;
}

/**
 * Mock chat response for market questions
 */
export async function chatResponse(message) {
  await sleep(AI_DELAY_MS + Math.random() * 500);

  const lower = message.toLowerCase();

  if (lower.includes('spread') || lower.includes('wide') || lower.includes('tight')) {
    return "For stablecoin FX pairs, I recommend a spread of 0.3-0.5% for conservative strategies and 0.8-1.2% for aggressive ones. In the current low-volatility environment, tighter spreads can capture more fills.";
  }
  if (lower.includes('risk') || lower.includes('safe')) {
    return "For hackathon demo purposes, I'd suggest starting with a moderate risk profile. This gives you visible order activity while keeping drawdowns manageable. Conservative is best for real capital.";
  }
  if (lower.includes('which pair') || lower.includes('recommend')) {
    return "USD/EUR is the most liquid pair and great for demos — it has intuitive pricing (~0.92) and tight spreads. USD/JPY has larger price numbers (~149.85) which makes for impressive-looking order books.";
  }
  if (lower.includes('how much') || lower.includes('amount')) {
    return "For the testnet demo, 5,000-10,000 tokens per side works well. This gives you enough depth across 5 levels to show a realistic-looking order book without depleting your faucet tokens too quickly.";
  }

  return "I'm your AI market making assistant. I can help you set up optimal order ladders for shielded FX trading. Try asking about spreads, risk levels, pair selection, or just hit 'Generate Ladder' to get started!";
}