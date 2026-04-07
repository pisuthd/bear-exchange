// SPDX-License-Identifier: Apache-2.0

/**
 * InnermostFX Simulator
 * 
 * Simulates the InnermostFX smart contract for order-book based forex trading.
 * Supports limit orders, partial fills, and settlement between bid/ask orders.
 */

// ============================================================================
// TYPES
// ============================================================================

interface Order {
  orderId: string;
  pair: string;           // "USD/EUR", "USD/JPY", "EUR/JPY"
  direction: string;       // "bid" or "ask"
  price: bigint;           // Limit price (scaled by SCALE = 1000000)
  amount: bigint;          // Amount to trade
  remaining: bigint;       // Remaining unfilled amount
  owner: string;           // Owner identifier
  commitment: Uint8Array;  // Hash commitment to order details
  nonce: string;           // Unique nonce for the order
  isLive: boolean;         // Whether order is still active
}

interface LedgerState {
  nextOrderId: bigint;
  nextTradeId: bigint;
  owner: Uint8Array;
  orderCommitments: Map<string, Uint8Array>;
  nullifierSet: Map<string, boolean>;
}

interface Trade {
  tradeId: string;
  bidOrderId: string;
  askOrderId: string;
  matchAmount: bigint;
  bidPrice: bigint;
  askPrice: bigint;
  pair: string;
  timestamp: number;
}

// ============================================================================
// SIMULATOR CLASS
// ============================================================================

/**
 * Simulates InnermostFX contract with private order details via witnesses.
 * Implements limit order book with partial fill support.
 */
export class InnermostFXSimulator {
  private ledger: LedgerState;
  private orders: Map<string, Order>;
  private userBalances: Map<string, Map<string, bigint>>; // Free balances only
  private lockedBalances: Map<string, Map<string, bigint>>; // Locked by orders
  private trades: Trade[];
  private SCALE: bigint;

  constructor() {
    this.SCALE = 1000000n;

    // Initialize ledger state matching contract constructor
    this.ledger = {
      nextOrderId: 1n,
      nextTradeId: 1n,
      owner: this.hashPublicKey("admin-key"),
      orderCommitments: new Map(),
      nullifierSet: new Map(),
    };

    this.orders = new Map();
    this.userBalances = new Map();
    this.lockedBalances = new Map();
    this.trades = [];
  }

  // ========================================================================
  // LEDGER ACCESS
  // ========================================================================

  getLedger(): LedgerState {
    return {
      nextOrderId: this.ledger.nextOrderId,
      nextTradeId: this.ledger.nextTradeId,
      owner: new Uint8Array(this.ledger.owner),
      orderCommitments: new Map(this.ledger.orderCommitments),
      nullifierSet: new Map(this.ledger.nullifierSet),
    };
  }

  getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  getTrades(): Trade[] {
    return [...this.trades];
  }

  // ========================================================================
  // TOKEN IDENTIFIERS
  // ========================================================================

  private getPairTokens(pair: string): { base: string; quote: string } {
    const pairs: Record<string, { base: string; quote: string }> = {
      "USD/EUR": { base: "USD", quote: "EUR" },
      "USD/JPY": { base: "USD", quote: "JPY" },
      "EUR/JPY": { base: "EUR", quote: "JPY" },
    };
    return pairs[pair] || { base: "UNKNOWN", quote: "UNKNOWN" };
  }

  // ========================================================================
  // TOKEN MINTING (MOCK FAUCET)
  // ========================================================================

  mintUSD(amount: bigint, userId: string = "user"): void {
    if (amount <= 0n) {
      throw new Error("Amount must be positive");
    }
    this.ensureUserExists(userId);
    this.addToBalance(userId, "USD", amount);
  }

  mintEUR(amount: bigint, userId: string = "user"): void {
    if (amount <= 0n) {
      throw new Error("Amount must be positive");
    }
    this.ensureUserExists(userId);
    this.addToBalance(userId, "EUR", amount);
  }

  mintJPY(amount: bigint, userId: string = "user"): void {
    if (amount <= 0n) {
      throw new Error("Amount must be positive");
    }
    this.ensureUserExists(userId);
    this.addToBalance(userId, "JPY", amount);
  }

  getBalance(userId: string, token: string): bigint {
    const userBalances = this.userBalances.get(userId);
    if (!userBalances) return 0n;
    return userBalances.get(token) || 0n;
  }

  // ========================================================================
  // ORDER CREATION
  // ========================================================================

  /**
   * Create a single order.
   * Bids lock quote token, asks lock base token.
   */
  createOrder(
    pair: string,
    direction: string,
    price: bigint,
    amount: bigint,
    userId: string = "user"
  ): Order {
    if (price <= 0n) {
      throw new Error("Price must be positive");
    }
    if (amount <= 0n) {
      throw new Error("Amount must be positive");
    }
    if (direction !== "bid" && direction !== "ask") {
      throw new Error("Direction must be bid or ask");
    }

    const supportedPairs = ["USD/EUR", "USD/JPY", "EUR/JPY"];
    if (!supportedPairs.includes(pair)) {
      throw new Error("Unsupported currency pair");
    }

    // Calculate lock token and amount
    const tokens = this.getPairTokens(pair);
    const lockToken = direction === "bid" ? tokens.quote : tokens.base;
    let lockAmount: bigint;

    if (direction === "bid") {
      // Bid locks quote token: floor(amount * price / SCALE)
      lockAmount = (amount * price) / this.SCALE;
    } else {
      // Ask locks base token: amount
      lockAmount = amount;
    }

    // Deduct locked amount from user balance
    this.ensureUserExists(userId);
    this.removeFromBalance(userId, lockToken, lockAmount);

    // Generate order ID and commitment
    const orderId = this.generateOrderId();
    const nonce = this.generateNonce();
    const commitment = this.makeCommitment(pair, direction, price, amount, userId, nonce);

    // Create order
    const order: Order = {
      orderId,
      pair,
      direction,
      price,
      amount,
      remaining: amount,
      owner: userId,
      commitment,
      nonce,
      isLive: true,
    };

    // Update ledger and order book
    this.orders.set(orderId, order);
    this.ledger.orderCommitments.set(orderId, commitment);
    this.ledger.nextOrderId++;

    return order;
  }

  /**
   * Create multiple orders (batch operation)
   */
  batchCreateOrders2(
    order1: { pair: string; direction: string; price: bigint; amount: bigint; userId: string },
    order2: { pair: string; direction: string; price: bigint; amount: bigint; userId: string }
  ): Order[] {
    const result1 = this.createOrder(
      order1.pair,
      order1.direction,
      order1.price,
      order1.amount,
      order1.userId
    );
    const result2 = this.createOrder(
      order2.pair,
      order2.direction,
      order2.price,
      order2.amount,
      order2.userId
    );
    return [result1, result2];
  }

  batchCreateOrders4(
    order1: { pair: string; direction: string; price: bigint; amount: bigint; userId: string },
    order2: { pair: string; direction: string; price: bigint; amount: bigint; userId: string },
    order3: { pair: string; direction: string; price: bigint; amount: bigint; userId: string },
    order4: { pair: string; direction: string; price: bigint; amount: bigint; userId: string }
  ): Order[] {
    return [
      this.createOrder(order1.pair, order1.direction, order1.price, order1.amount, order1.userId),
      this.createOrder(order2.pair, order2.direction, order2.price, order2.amount, order2.userId),
      this.createOrder(order3.pair, order3.direction, order3.price, order3.amount, order3.userId),
      this.createOrder(order4.pair, order4.direction, order4.price, order4.amount, order4.userId),
    ];
  }

  // ========================================================================
  // ORDER CANCELLATION
  // ========================================================================

  /**
   * Cancel an order and refund the locked amount.
   */
  cancelOrder(orderId: string, userId: string, refundNonce: string): void {
    const order = this.orders.get(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.isLive) {
      throw new Error("Order already consumed or cancelled");
    }

    if (order.owner !== userId) {
      throw new Error("Not your order");
    }

    // Mark order as consumed
    order.isLive = false;
    this.ledger.nullifierSet.set(orderId, true);

    // Calculate refund amount
    const tokens = this.getPairTokens(order.pair);
    let refundToken: string;
    let refundAmount: bigint;

    if (order.direction === "bid") {
      refundToken = tokens.quote;
      refundAmount = (order.remaining * order.price) / this.SCALE;
    } else {
      refundToken = tokens.base;
      refundAmount = order.remaining;
    }

    // Refund to owner
    this.addToBalance(userId, refundToken, refundAmount);
  }

  // ========================================================================
  // ORDER MATCHING
  // ========================================================================

  /**
   * Match a bid order with an ask order.
   * Supports partial fills and handles price improvement.
   */
  matchOrders(
    bidOrderId: string,
    askOrderId: string,
    matchAmount: bigint,
    settlementNonce: string
  ): Trade {
    const bidOrder = this.orders.get(bidOrderId);
    const askOrder = this.orders.get(askOrderId);

    if (!bidOrder || !askOrder) {
      throw new Error("Order not found");
    }

    if (!bidOrder.isLive || !askOrder.isLive) {
      throw new Error("Order already consumed");
    }

    if (bidOrder.direction !== "bid") {
      throw new Error("First order must be a bid");
    }

    if (askOrder.direction !== "ask") {
      throw new Error("Second order must be an ask");
    }

    if (bidOrder.pair !== askOrder.pair) {
      throw new Error("Currency pair mismatch");
    }

    if (bidOrder.price < askOrder.price) {
      throw new Error("Orders do not cross");
    }

    if (matchAmount <= 0n) {
      throw new Error("Match amount must be positive");
    }

    if (matchAmount > bidOrder.remaining) {
      throw new Error("Match amount exceeds bid");
    }

    if (matchAmount > askOrder.remaining) {
      throw new Error("Match amount exceeds ask");
    }

    // Consume both orders
    bidOrder.isLive = false;
    askOrder.isLive = false;
    this.ledger.nullifierSet.set(bidOrderId, true);
    this.ledger.nullifierSet.set(askOrderId, true);

    const tokens = this.getPairTokens(bidOrder.pair);

    // Settlement amounts
    const tradeQuoteCost = (matchAmount * askOrder.price) / this.SCALE;
    const bidLocked = (matchAmount * bidOrder.price) / this.SCALE;
    const overbid = bidLocked - tradeQuoteCost;

    // Payout to bidder: baseToken (matchAmount)
    this.addToBalance(bidOrder.owner, tokens.base, matchAmount);

    // Payout to asker: quoteToken (tradeQuoteCost)
    this.addToBalance(askOrder.owner, tokens.quote, tradeQuoteCost);

    // Refund overbid to bidder (price improvement)
    if (overbid > 0n) {
      this.addToBalance(bidOrder.owner, tokens.quote, overbid);
    }

    // Handle remainder for partial fills
    if (bidOrder.remaining > matchAmount) {
      const bidRemaining = bidOrder.remaining - matchAmount;
      const newBidId = this.generateOrderId();
      const newBidNonce = this.generateNonce();
      const newBidCommitment = this.makeCommitment(
        bidOrder.pair,
        bidOrder.direction,
        bidOrder.price,
        bidRemaining,
        bidOrder.owner,
        newBidNonce
      );

      // Create remainder order
      const remainderBidOrder: Order = {
        orderId: newBidId,
        pair: bidOrder.pair,
        direction: bidOrder.direction,
        price: bidOrder.price,
        amount: bidOrder.amount,
        remaining: bidRemaining,
        owner: bidOrder.owner,
        commitment: newBidCommitment,
        nonce: newBidNonce,
        isLive: true,
      };

      this.orders.set(newBidId, remainderBidOrder);
      this.ledger.orderCommitments.set(newBidId, newBidCommitment);

      // Re-lock remainder quote token (already locked from original order, no need to deduct again)
      // The locked amount for the filled portion was already deducted when the order was created
    }

    if (askOrder.remaining > matchAmount) {
      const askRemaining = askOrder.remaining - matchAmount;
      const newAskId = this.generateOrderId();
      const newAskNonce = this.generateNonce();
      const newAskCommitment = this.makeCommitment(
        askOrder.pair,
        askOrder.direction,
        askOrder.price,
        askRemaining,
        askOrder.owner,
        newAskNonce
      );

      // Create remainder order
      const remainderAskOrder: Order = {
        orderId: newAskId,
        pair: askOrder.pair,
        direction: askOrder.direction,
        price: askOrder.price,
        amount: askOrder.amount,
        remaining: askRemaining,
        owner: askOrder.owner,
        commitment: newAskCommitment,
        nonce: newAskNonce,
        isLive: true,
      };

      this.orders.set(newAskId, remainderAskOrder);
      this.ledger.orderCommitments.set(newAskId, newAskCommitment);

      // Re-lock remainder base token (already locked from original order, no need to deduct again)
    }

    // Record trade
    const trade: Trade = {
      tradeId: `trade-${this.ledger.nextTradeId}`,
      bidOrderId,
      askOrderId,
      matchAmount,
      bidPrice: bidOrder.price,
      askPrice: askOrder.price,
      pair: bidOrder.pair,
      timestamp: Date.now(),
    };

    this.trades.push(trade);
    this.ledger.nextTradeId++;

    return trade;
  }

  // ========================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private ensureUserExists(userId: string): void {
    if (!this.userBalances.has(userId)) {
      this.userBalances.set(userId, new Map());
    }
  }

  private addToBalance(userId: string, token: string, amount: bigint): void {
    const balances = this.userBalances.get(userId);
    if (!balances) return;
    const current = balances.get(token) ?? 0n;
    balances.set(token, current + amount);
  }

  private removeFromBalance(userId: string, token: string, amount: bigint): void {
    this.ensureUserExists(userId);
    const balances = this.userBalances.get(userId);
    if (!balances) {
      throw new Error(`User not found: ${userId}`);
    }
    const current = balances.get(token) ?? 0n;
    if (current < amount) {
      throw new Error(`Insufficient ${token} balance`);
    }
    balances.set(token, current - amount);
  }

  private generateOrderId(): string {
    const id = this.ledger.nextOrderId;
    return `order-${id}`;
  }

  private generateNonce(): string {
    return `nonce-${Date.now()}-${Math.random()}`;
  }

  private hashPublicKey(key: string): Uint8Array {
    const hash = new Uint8Array(32);
    const bytes = new TextEncoder().encode(key);
    for (let i = 0; i < Math.min(bytes.length, 32); i++) {
      hash[i] = bytes[i];
    }
    return hash;
  }

  private makeCommitment(
    pair: string,
    direction: string,
    price: bigint,
    amount: bigint,
    owner: string,
    nonce: string
  ): Uint8Array {
    const data = `${pair}:${direction}:${price}:${amount}:${owner}:${nonce}`;
    return new TextEncoder().encode(data).slice(0, 32);
  }
}