
/**
 * InnermostFX Test Suite
 * 
 * Tests for the InnermostFX smart contract matching current implementation.
 * Tests cover order creation, cancellation, matching, and partial fills.
 */

import { InnermostFXSimulator } from "./innermostfx-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

// ============================================================================
// TEST SUITE
// ============================================================================

describe("InnermostFX smart contract", () => {
  // ========================================================================
  // INITIALIZATION TESTS
  // ========================================================================

  describe("Initialization", () => {
    it("initializes with correct order ID counter", () => {
      const simulator = new InnermostFXSimulator();
      const ledger = simulator.getLedger();
      
      expect(ledger.nextOrderId).toEqual(1n);
    });

    it("initializes with correct trade ID counter", () => {
      const simulator = new InnermostFXSimulator();
      const ledger = simulator.getLedger();
      
      expect(ledger.nextTradeId).toEqual(1n);
    });

    it("initializes with empty order commitments", () => {
      const simulator = new InnermostFXSimulator();
      const ledger = simulator.getLedger();
      
      expect(ledger.orderCommitments.size).toEqual(0);
    });

    it("initializes with empty nullifier set", () => {
      const simulator = new InnermostFXSimulator();
      const ledger = simulator.getLedger();
      
      expect(ledger.nullifierSet.size).toEqual(0);
    });
  });

  // ========================================================================
  // TOKEN MINTING TESTS
  // ========================================================================

  describe("Token Minting", () => {
    it("mints USD tokens successfully", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(1000n, "user1");
      
      expect(simulator.getBalance("user1", "USD")).toEqual(1000n);
    });

    it("mints EUR tokens successfully", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintEUR(800n, "user1");
      
      expect(simulator.getBalance("user1", "EUR")).toEqual(800n);
    });

    it("mints JPY tokens successfully", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintJPY(150000n, "user1");
      
      expect(simulator.getBalance("user1", "JPY")).toEqual(150000n);
    });

    it("rejects minting zero tokens", () => {
      const simulator = new InnermostFXSimulator();
      
      expect(() => {
        simulator.mintUSD(0n, "user1");
      }).toThrow("Amount must be positive");
    });

    it("tracks multiple user balances separately", () => {
      const simulator = new InnermostFXSimulator();
      
      simulator.mintUSD(1000n, "user1");
      simulator.mintUSD(2000n, "user2");
      
      expect(simulator.getBalance("user1", "USD")).toEqual(1000n);
      expect(simulator.getBalance("user2", "USD")).toEqual(2000n);
    });
  });

  // ========================================================================
  // ORDER CREATION TESTS
  // ========================================================================

  describe("Order Creation", () => {
    it("creates a bid order successfully", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintEUR(95000n, "user1"); // 100 USD * 0.95 EUR/USD
      
      const order = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "user1");
      
      expect(order.direction).toEqual("bid");
      expect(order.pair).toEqual("USD/EUR");
      expect(order.price).toEqual(950000n);
      expect(order.amount).toEqual(100n);
      expect(order.isLive).toEqual(true);
    });

    it("creates an ask order successfully", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      const order = simulator.createOrder("USD/EUR", "ask", 950000n, 100n, "user1");
      
      expect(order.direction).toEqual("ask");
      expect(order.pair).toEqual("USD/EUR");
      expect(order.price).toEqual(950000n);
      expect(order.amount).toEqual(100n);
      expect(order.isLive).toEqual(true);
    });

    it("locks correct amount for bid orders", () => {
      const simulator = new InnermostFXSimulator();
      const lockAmount = (100n * 950000n) / 1000000n;
      simulator.mintEUR(lockAmount, "user1");
      
      simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "user1");
      
      expect(simulator.getBalance("user1", "EUR")).toEqual(0n);
    });

    it("locks correct amount for ask orders", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      simulator.createOrder("USD/EUR", "ask", 950000n, 100n, "user1");
      
      expect(simulator.getBalance("user1", "USD")).toEqual(0n);
    });

    it("rejects order with zero price", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      expect(() => {
        simulator.createOrder("USD/EUR", "ask", 0n, 100n, "user1");
      }).toThrow("Price must be positive");
    });

    it("rejects order with zero amount", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      expect(() => {
        simulator.createOrder("USD/EUR", "ask", 950000n, 0n, "user1");
      }).toThrow("Amount must be positive");
    });

    it("rejects invalid direction", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      expect(() => {
        simulator.createOrder("USD/EUR", "invalid", 950000n, 100n, "user1");
      }).toThrow("Direction must be bid or ask");
    });

    it("rejects unsupported currency pair", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      expect(() => {
        simulator.createOrder("BTC/ETH", "ask", 950000n, 100n, "user1");
      }).toThrow("Unsupported currency pair");
    });

    it("creates batch of 2 orders successfully", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(200n, "user1");
      simulator.mintEUR(190n, "user1");
      
      const orders = simulator.batchCreateOrders2(
        { pair: "USD/EUR", direction: "ask", price: 950000n, amount: 100n, userId: "user1" },
        { pair: "USD/EUR", direction: "bid", price: 940000n, amount: 100n, userId: "user1" }
      );
      
      expect(orders.length).toEqual(2);
      expect(orders[0].isLive).toEqual(true);
      expect(orders[1].isLive).toEqual(true);
    });

    it("creates batch of 4 orders successfully", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(400n, "user1");
      simulator.mintEUR(380n, "user1");
      
      const orders = simulator.batchCreateOrders4(
        { pair: "USD/EUR", direction: "ask", price: 950000n, amount: 100n, userId: "user1" },
        { pair: "USD/EUR", direction: "ask", price: 960000n, amount: 100n, userId: "user1" },
        { pair: "USD/EUR", direction: "bid", price: 940000n, amount: 100n, userId: "user1" },
        { pair: "USD/EUR", direction: "bid", price: 930000n, amount: 100n, userId: "user1" }
      );
      
      expect(orders.length).toEqual(4);
      expect(orders.every(o => o.isLive)).toEqual(true);
    });
  });

  // ========================================================================
  // ORDER CANCELLATION TESTS
  // ========================================================================

  describe("Order Cancellation", () => {
    it("cancels a bid order successfully", () => {
      const simulator = new InnermostFXSimulator();
      const lockAmount = (100n * 950000n) / 1000000n;
      simulator.mintEUR(lockAmount, "user1");
      
      const order = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "user1");
      simulator.cancelOrder(order.orderId, "user1", "refund-nonce");
      
      expect(order.isLive).toEqual(false);
      expect(simulator.getBalance("user1", "EUR")).toEqual(lockAmount);
    });

    it("cancels an ask order successfully", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      const order = simulator.createOrder("USD/EUR", "ask", 950000n, 100n, "user1");
      simulator.cancelOrder(order.orderId, "user1", "refund-nonce");
      
      expect(order.isLive).toEqual(false);
      expect(simulator.getBalance("user1", "USD")).toEqual(100n);
    });

    it("rejects cancelling non-existent order", () => {
      const simulator = new InnermostFXSimulator();
      
      expect(() => {
        simulator.cancelOrder("non-existent", "user1", "refund-nonce");
      }).toThrow("Order not found");
    });

    it("rejects cancelling already consumed order", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      const order = simulator.createOrder("USD/EUR", "ask", 950000n, 100n, "user1");
      simulator.cancelOrder(order.orderId, "user1", "refund-nonce-1");
      
      expect(() => {
        simulator.cancelOrder(order.orderId, "user1", "refund-nonce-2");
      }).toThrow("Order already consumed");
    });

    it("rejects cancelling another user's order", () => {
      const simulator = new InnermostFXSimulator();
      simulator.mintUSD(100n, "user1");
      
      const order = simulator.createOrder("USD/EUR", "ask", 950000n, 100n, "user1");
      
      expect(() => {
        simulator.cancelOrder(order.orderId, "user2", "refund-nonce");
      }).toThrow("Not your order");
    });
  });

  // ========================================================================
  // ORDER MATCHING TESTS
  // ========================================================================

  describe("Order Matching", () => {
    it("matches orders successfully - full fill", () => {
      const simulator = new InnermostFXSimulator();
      
      const bidLock = (100n * 950000n) / 1000000n;
      simulator.mintEUR(bidLock, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      const trade = simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 100n, "settlement");
      
      expect(trade.matchAmount).toEqual(100n);
      expect(trade.pair).toEqual("USD/EUR");
      expect(simulator.getBalance("bidder", "USD")).toEqual(100n);
      
      const tradeQuoteCost = (100n * 940000n) / 1000000n;
      expect(simulator.getBalance("asker", "EUR")).toEqual(tradeQuoteCost);
      
      const overbid = bidLock - tradeQuoteCost;
      expect(simulator.getBalance("bidder", "EUR")).toEqual(overbid);
    });

    it("rejects matching orders that don't cross", () => {
      const simulator = new InnermostFXSimulator();
      
      simulator.mintEUR(95000n, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 940000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 950000n, 100n, "asker");
      
      expect(() => {
        simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 100n, "settlement");
      }).toThrow("Orders do not cross");
    });

    it("rejects matching orders from different pairs", () => {
      const simulator = new InnermostFXSimulator();
      
      simulator.mintEUR(95000n, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/JPY", "ask", 1500000n, 100n, "asker");
      
      expect(() => {
        simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 100n, "settlement");
      }).toThrow("Currency pair mismatch");
    });

    it("rejects match amount of zero", () => {
      const simulator = new InnermostFXSimulator();
      
      simulator.mintEUR(95000n, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      expect(() => {
        simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 0n, "settlement");
      }).toThrow("Match amount must be positive");
    });

    it("rejects match amount exceeding bid", () => {
      const simulator = new InnermostFXSimulator();
      
      simulator.mintEUR(95000n, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      expect(() => {
        simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 150n, "settlement");
      }).toThrow("Match amount exceeds bid");
    });

    it("rejects match amount exceeding ask", () => {
      const simulator = new InnermostFXSimulator();
      
      simulator.mintEUR(95000n, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 150n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      expect(() => {
        simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 150n, "settlement");
      }).toThrow("Match amount exceeds ask");
    });
  });

  // ========================================================================
  // PARTIAL FILL TESTS
  // ========================================================================

  describe("Partial Fills", () => {
    it("handles partial fill on bid order", () => {
      const simulator = new InnermostFXSimulator();
      
      simulator.mintEUR(95000n, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(50n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 50n, "asker");
      
      simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 50n, "settlement");
      
      const orders = simulator.getOrders();
      const remainderBid = orders.find(o => o.owner === "bidder" && o.isLive);
      
      expect(remainderBid).toBeDefined();
      expect(remainderBid?.remaining).toEqual(50n);
    });

    it("handles partial fill on ask order", () => {
      const simulator = new InnermostFXSimulator();
      
      const bidLock = (50n * 950000n) / 1000000n;
      simulator.mintEUR(bidLock, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 50n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 50n, "settlement");
      
      const orders = simulator.getOrders();
      const remainderAsk = orders.find(o => o.owner === "asker" && o.isLive);
      
      expect(remainderAsk).toBeDefined();
      expect(remainderAsk?.remaining).toEqual(50n);
    });

    it("handles partial fill on both orders", () => {
      const simulator = new InnermostFXSimulator();
      
      const bidLock = (100n * 950000n) / 1000000n;
      simulator.mintEUR(bidLock, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 50n, "settlement");
      
      const orders = simulator.getOrders();
      const liveOrders = orders.filter(o => o.isLive);
      
      expect(liveOrders.length).toEqual(1);
      expect(liveOrders.every(o => o.remaining === 50n)).toEqual(true);
    });
  });

  // ========================================================================
  // PRICE IMPROVEMENT TESTS
  // ========================================================================

  describe("Price Improvement", () => {
    it("refunds overbid amount to bidder", () => {
      const simulator = new InnermostFXSimulator();
      
      const bidLock = (100n * 950000n) / 1000000n;
      simulator.mintEUR(bidLock, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 100n, "settlement");
      
      const tradeQuoteCost = (100n * 940000n) / 1000000n;
      const overbid = bidLock - tradeQuoteCost;
      
      expect(simulator.getBalance("bidder", "EUR")).toEqual(overbid);
    });

    it("no overbid when prices are equal", () => {
      const simulator = new InnermostFXSimulator();
      
      const bidLock = (100n * 950000n) / 1000000n;
      simulator.mintEUR(bidLock, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 950000n, 100n, "asker");
      
      simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 100n, "settlement");
      
      expect(simulator.getBalance("bidder", "EUR")).toEqual(0n);
    });
  });

  // ========================================================================
  // CURRENCY PAIR TESTS
  // ========================================================================

  describe("Currency Pairs", () => {
    it("handles orders on USD/JPY pair", () => {
      const simulator = new InnermostFXSimulator();
      
      const bidLock = (100n * 1500000n) / 1000000n;
      simulator.mintJPY(bidLock, "bidder");
      const bidOrder = simulator.createOrder("USD/JPY", "bid", 1500000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/JPY", "ask", 1400000n, 100n, "asker");
      
      const trade = simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 100n, "settlement");
      
      expect(trade.pair).toEqual("USD/JPY");
      expect(simulator.getBalance("bidder", "USD")).toEqual(100n);
      
      const tradeQuoteCost = (100n * 1400000n) / 1000000n;
      expect(simulator.getBalance("asker", "JPY")).toEqual(tradeQuoteCost);
    });

    it("handles orders on EUR/JPY pair", () => {
      const simulator = new InnermostFXSimulator();
      
      const bidLock = (100n * 1700000n) / 1000000n;
      simulator.mintJPY(bidLock, "bidder");
      const bidOrder = simulator.createOrder("EUR/JPY", "bid", 1700000n, 100n, "bidder");
      
      simulator.mintEUR(100n, "asker");
      const askOrder = simulator.createOrder("EUR/JPY", "ask", 1600000n, 100n, "asker");
      
      const trade = simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 100n, "settlement");
      
      expect(trade.pair).toEqual("EUR/JPY");
      expect(simulator.getBalance("bidder", "EUR")).toEqual(100n);
      
      const tradeQuoteCost = (100n * 1600000n) / 1000000n;
      expect(simulator.getBalance("asker", "JPY")).toEqual(tradeQuoteCost);
    });
  });

  // ========================================================================
  // TRADE RECORDING TESTS
  // ========================================================================

  describe("Trade Recording", () => {
    it("records trade successfully", () => {
      const simulator = new InnermostFXSimulator();
      
      const bidLock = (100n * 950000n) / 1000000n;
      simulator.mintEUR(bidLock, "bidder");
      const bidOrder = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(100n, "asker");
      const askOrder = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      simulator.matchOrders(bidOrder.orderId, askOrder.orderId, 100n, "settlement");
      
      const trades = simulator.getTrades();
      expect(trades.length).toEqual(1);
      expect(trades[0].matchAmount).toEqual(100n);
    });

    it("increments trade ID after each trade", () => {
      const simulator = new InnermostFXSimulator();
      
      simulator.mintEUR(190000n, "bidder");
      const bidOrder1 = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      const bidOrder2 = simulator.createOrder("USD/EUR", "bid", 950000n, 100n, "bidder");
      
      simulator.mintUSD(200n, "asker");
      const askOrder1 = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      const askOrder2 = simulator.createOrder("USD/EUR", "ask", 940000n, 100n, "asker");
      
      simulator.matchOrders(bidOrder1.orderId, askOrder1.orderId, 100n, "settlement-1");
      simulator.matchOrders(bidOrder2.orderId, askOrder2.orderId, 100n, "settlement-2");
      
      const trades = simulator.getTrades();
      expect(trades.length).toEqual(2);
      expect(trades[0].tradeId).toContain("trade-1");
      expect(trades[1].tradeId).toContain("trade-2");
    });
  });

  // ========================================================================
  // REAL-WORLD USE CASES
  // ========================================================================

  describe("Real-World Use Cases", () => {
    it("market maker posts ladder via batchCreateOrders4 - USD/JPY", () => {
      const simulator = new InnermostFXSimulator();
      
      // Market maker posts a 4-order ladder
      // Mid rate: 152.50 JPY/USD
      // Ask 1: 50k USD at 152.80 (tight spread) - seller locks USD
      simulator.mintUSD(50000n, "market-maker");
      
      // Ask 2: 200k USD at 152.96 - seller locks USD
      simulator.mintUSD(200000n, "market-maker");
      
      // Bid 1: 50k USD at 152.20 - buyer locks JPY
      const bid1Lock = (50000n * 1522000n) / 1000000n;
      simulator.mintJPY(bid1Lock, "market-maker");
      
      // Bid 2: 200k USD at 152.04 - buyer locks JPY
      const bid2Lock = (200000n * 1520400n) / 1000000n;
      simulator.mintJPY(bid2Lock, "market-maker");
      
      const orders = simulator.batchCreateOrders4(
        { pair: "USD/JPY", direction: "ask", price: 1528000n, amount: 50000n, userId: "market-maker" },
        { pair: "USD/JPY", direction: "ask", price: 1529600n, amount: 200000n, userId: "market-maker" },
        { pair: "USD/JPY", direction: "bid", price: 1522000n, amount: 50000n, userId: "market-maker" },
        { pair: "USD/JPY", direction: "bid", price: 1520400n, amount: 200000n, userId: "market-maker" }
      );
      
      expect(orders.length).toEqual(4);
      expect(orders.every(o => o.isLive)).toEqual(true);
      expect(orders[0].amount).toEqual(50000n);
      expect(orders[1].amount).toEqual(200000n);
    });

    it("trader fills 150k USD across multiple ask orders - blended rate", () => {
      const simulator = new InnermostFXSimulator();
      
      // Market maker ladder setup
      // Ask 1: 50k USD at 152.80 - seller locks USD
      simulator.mintUSD(50000n, "market-maker");
      const ask1 = simulator.createOrder("USD/JPY", "ask", 1528000n, 50000n, "market-maker");
      
      // Ask 2: 200k USD at 152.96 - seller locks USD
      simulator.mintUSD(200000n, "market-maker");
      const ask2 = simulator.createOrder("USD/JPY", "ask", 1529600n, 200000n, "market-maker");
      
      // Trader wants to sell 150k USD for JPY (bid at market price)
      const traderBidLock = (150000n * 1529600n) / 1000000n; // Willing to pay ask2 price
      simulator.mintJPY(traderBidLock, "trader");
      const traderBid = simulator.createOrder("USD/JPY", "bid", 1529600n, 150000n, "trader");
      
      // Fill: 50k at 152.80, then 100k at 152.96
      let currentBid = traderBid;
      simulator.matchOrders(currentBid.orderId, ask1.orderId, 50000n, "settlement-1");
      currentBid = simulator.getOrders().find(o => o.owner === "trader" && o.isLive)!;
      
      // Trader bid now has 100k remaining (new remainder order created)
      simulator.matchOrders(currentBid.orderId, ask2.orderId, 100000n, "settlement-2");
      
      // Trader receives 150k USD
      expect(simulator.getBalance("trader", "USD")).toEqual(150000n);
      
      // Ask1 is fully consumed
      const ask1Orders = simulator.getOrders().filter(o => o.orderId === ask1.orderId);
      expect(ask1Orders.length).toEqual(1);
      expect(ask1Orders[0].isLive).toEqual(false);
      
      // Ask2 is fully consumed (100k was full amount)
      const ask2Orders = simulator.getOrders().filter(o => o.orderId === ask2.orderId);
      expect(ask2Orders.length).toEqual(1);
      expect(ask2Orders[0].isLive).toEqual(false);
    });

    it("large volume trading with multiple partial fills", () => {
      const simulator = new InnermostFXSimulator();
      
      // Multiple small ask orders (sellers)
      const smallOrders = [];
      for (let i = 0; i < 5; i++) {
        simulator.mintUSD(25000n, `seller-${i}`);
        const order = simulator.createOrder("USD/JPY", "ask", 1500000n, 25000n, `seller-${i}`);
        smallOrders.push(order);
      }
      
      // One large bid order (buyer)
      const buyerLock = (125000n * 1510000n) / 1000000n;
      simulator.mintJPY(buyerLock, "buyer");
      const buyerBid = simulator.createOrder("USD/JPY", "bid", 1510000n, 125000n, "buyer");
      
      // Fill across 5 orders: 25k each
      let currentBid = buyerBid;
      for (let i = 0; i < 5; i++) {
        simulator.matchOrders(currentBid.orderId, smallOrders[i].orderId, 25000n, `settlement-${i}`);
        if (i < 4) {
          currentBid = simulator.getOrders().find(o => o.owner === "buyer" && o.isLive)!;
        }
      }
      
      // Buyer receives 125k USD
      expect(simulator.getBalance("buyer", "USD")).toEqual(125000n);
      
      // All small orders are consumed
      const liveOrders = simulator.getOrders().filter(o => o.isLive);
      expect(liveOrders.length).toEqual(0);
      
      // 5 trades recorded
      const trades = simulator.getTrades();
      expect(trades.length).toEqual(5);
    });

    it("market maker adjusts ladder after partial fills", () => {
      const simulator = new InnermostFXSimulator();
      
      // Initial ladder: 3 asks at different prices - sellers lock USD
      simulator.mintUSD(50000n, "market-maker");
      const ask1 = simulator.createOrder("USD/JPY", "ask", 1528000n, 50000n, "market-maker");
      
      simulator.mintUSD(50000n, "market-maker");
      const ask2 = simulator.createOrder("USD/JPY", "ask", 1529000n, 50000n, "market-maker");
      
      simulator.mintUSD(100000n, "market-maker");
      const ask3 = simulator.createOrder("USD/JPY", "ask", 1530000n, 100000n, "market-maker");
      
      // Trader fills 75k: 50k from ask1, 25k from ask2
      const traderBidLock = (75000n * 1530000n) / 1000000n;
      simulator.mintJPY(traderBidLock, "trader");
      const traderBid = simulator.createOrder("USD/JPY", "bid", 1530000n, 75000n, "trader");
      
      simulator.matchOrders(traderBid.orderId, ask1.orderId, 50000n, "settlement-1");
      const remainderBid = simulator.getOrders().find(o => o.owner === "trader" && o.isLive)!;
      simulator.matchOrders(remainderBid.orderId, ask2.orderId, 25000n, "settlement-2");
      
      // Ask1 consumed, original ask2 consumed, ask3 untouched
      const orders = simulator.getOrders();
      const ask1After = orders.find(o => o.orderId === ask1.orderId);
      const ask2After = orders.find(o => o.orderId === ask2.orderId);
      const ask3After = orders.find(o => o.orderId === ask3.orderId);
      
      expect(ask1After?.isLive).toEqual(false);
      expect(ask2After?.isLive).toEqual(false); // Original ask2 is consumed
      
      // New remainder ask order created for market-maker with 25k remaining
      // Exclude ask3 (the untouched order)
      const mmRemainderOrders = orders.filter(o => 
        o.owner === "market-maker" && 
        o.isLive && 
        o.direction === "ask" && 
        o.orderId !== ask3.orderId // Exclude the untouched ask3
      );
      expect(mmRemainderOrders.length).toBeGreaterThan(0);
      expect(mmRemainderOrders[0].remaining).toEqual(25000n);
      
      expect(ask3After?.isLive).toEqual(true);
      expect(ask3After?.remaining).toEqual(100000n);
      
      // Market maker posts new ask to refresh ladder
      simulator.mintUSD(50000n, "market-maker");
      const newAsk = simulator.createOrder("USD/JPY", "ask", 1528500n, 50000n, "market-maker");
      
      expect(newAsk.isLive).toEqual(true);
      expect(newAsk.amount).toEqual(50000n);
    });

    it("price improvement across multiple orders", () => {
      const simulator = new InnermostFXSimulator();
      
      // Asks: 100k at 152.50, 100k at 152.75, 100k at 153.00 - sellers lock USD
      simulator.mintUSD(100000n, "seller-1");
      const ask1 = simulator.createOrder("USD/JPY", "ask", 1525000n, 100000n, "seller-1");
      
      simulator.mintUSD(100000n, "seller-2");
      const ask2 = simulator.createOrder("USD/JPY", "ask", 1527500n, 100000n, "seller-2");
      
      simulator.mintUSD(100000n, "seller-3");
      const ask3 = simulator.createOrder("USD/JPY", "ask", 1530000n, 100000n, "seller-3");
      
      // Buyer willing to pay 153.00 for 150k
      const buyerLock = (150000n * 1530000n) / 1000000n;
      simulator.mintJPY(buyerLock, "buyer");
      const buyerBid = simulator.createOrder("USD/JPY", "bid", 1530000n, 150000n, "buyer");
      
      // Fill: 100k at 152.50, 50k at 152.75
      simulator.matchOrders(buyerBid.orderId, ask1.orderId, 100000n, "settlement-1");
      const remainderBid = simulator.getOrders().find(o => o.owner === "buyer" && o.isLive)!;
      simulator.matchOrders(remainderBid.orderId, ask2.orderId, 50000n, "settlement-2");
      
      // Buyer receives 150k USD
      expect(simulator.getBalance("buyer", "USD")).toEqual(150000n);
      
      // Price improvement:
      // Without improvement: 150k * 153.00 = 22,950,000 JPY
      // With improvement: 100k * 152.50 + 50k * 152.75 = 22,787,500 JPY
      // Savings: 162,500 JPY
      const pricePaid = (100000n * 1525000n) / 1000000n + (50000n * 1527500n) / 1000000n;
      const priceWanted = (150000n * 1530000n) / 1000000n;
      const savings = priceWanted - pricePaid;
      
      expect(savings).toBeGreaterThan(0n);
      expect(simulator.getBalance("buyer", "JPY")).toEqual(buyerLock - pricePaid);
    });

    it("concurrent market makers with competing ladders", () => {
      const simulator = new InnermostFXSimulator();
      
      // Market Maker A's ladder: tighter spreads, smaller sizes - sellers lock USD
      simulator.mintUSD(25000n, "mm-a");
      const mmAsk1 = simulator.createOrder("USD/JPY", "ask", 1527500n, 25000n, "mm-a");
      
      simulator.mintUSD(50000n, "mm-a");
      const mmAsk2 = simulator.createOrder("USD/JPY", "ask", 1528500n, 50000n, "mm-a");
      
      // Market Maker B's ladder: wider spreads, larger sizes - sellers lock USD
      simulator.mintUSD(100000n, "mm-b");
      const bmmAsk1 = simulator.createOrder("USD/JPY", "ask", 1529000n, 100000n, "mm-b");
      
      simulator.mintUSD(200000n, "mm-b");
      const bmmAsk2 = simulator.createOrder("USD/JPY", "ask", 1530000n, 200000n, "mm-b");
      
      // Trader fills 100k: 25k from MM-A @152.75, 50k from MM-A @152.85, 25k from MM-B @152.90
      const traderLock = (100000n * 1530000n) / 1000000n;
      simulator.mintJPY(traderLock, "trader");
      const traderBid = simulator.createOrder("USD/JPY", "bid", 1530000n, 100000n, "trader");
      
      simulator.matchOrders(traderBid.orderId, mmAsk1.orderId, 25000n, "settlement-1");
      let currentBid = simulator.getOrders().find(o => o.owner === "trader" && o.isLive)!;
      simulator.matchOrders(currentBid.orderId, mmAsk2.orderId, 50000n, "settlement-2");
      currentBid = simulator.getOrders().find(o => o.owner === "trader" && o.isLive)!;
      simulator.matchOrders(currentBid.orderId, bmmAsk1.orderId, 25000n, "settlement-3");
      
      // Trader receives 100k USD
      expect(simulator.getBalance("trader", "USD")).toEqual(100000n);
      
      // Blended rate should be better than worst price
      const blendedRate = ((25000n * 1527500n) / 1000000n + 
                         (50000n * 1528500n) / 1000000n + 
                         (25000n * 1529000n) / 1000000n) / 100000n;
      expect(blendedRate).toBeLessThan(1529000n);
      
      // Original orders consumed
      const orders = simulator.getOrders();
      const mmAsk1After = orders.find(o => o.orderId === mmAsk1.orderId);
      const mmAsk2After = orders.find(o => o.orderId === mmAsk2.orderId);
      const bmmAsk1After = orders.find(o => o.orderId === bmmAsk1.orderId);
      const bmmAsk2After = orders.find(o => o.orderId === bmmAsk2.orderId);
      
      expect(mmAsk1After?.isLive).toEqual(false);
      expect(mmAsk2After?.isLive).toEqual(false);
      expect(bmmAsk1After?.isLive).toEqual(false); // Original fully consumed
      
      // MM-B has 75k remaining in new order (exclude the untouched bmmAsk2)
      const bmmLiveOrders = orders.filter(o => 
        o.owner === "mm-b" && 
        o.isLive && 
        o.direction === "ask" && 
        o.orderId !== bmmAsk2.orderId // Exclude the untouched bmmAsk2
      );
      expect(bmmLiveOrders.length).toBeGreaterThan(0);
      expect(bmmLiveOrders[0].remaining).toEqual(75000n);
      
      expect(bmmAsk2After?.isLive).toEqual(true);
      expect(bmmAsk2After?.remaining).toEqual(200000n);
    });

    it("slippage-free execution with perfect price discovery", () => {
      const simulator = new InnermostFXSimulator();
      
      // Deep order book: 5 asks at incrementally better prices - sellers lock USD
      const asks = [
        { price: 1525000n, amount: 20000n },
        { price: 1526000n, amount: 20000n },
        { price: 1527000n, amount: 20000n },
        { price: 1528000n, amount: 20000n },
        { price: 1529000n, amount: 20000n }
      ];
      
      const askOrders = [];
      for (let i = 0; i < asks.length; i++) {
        simulator.mintUSD(asks[i].amount, `seller-${i}`);
        const order = simulator.createOrder("USD/JPY", "ask", asks[i].price, asks[i].amount, `seller-${i}`);
        askOrders.push(order);
      }
      
      // Trader fills 100k, gets best prices across the board
      const traderLock = (100000n * 1529000n) / 1000000n;
      simulator.mintJPY(traderLock, "trader");
      const traderBid = simulator.createOrder("USD/JPY", "bid", 1529000n, 100000n, "trader");
      
      // Fill across all 5 orders
      let currentBid = traderBid;
      for (let i = 0; i < askOrders.length; i++) {
        simulator.matchOrders(currentBid.orderId, askOrders[i].orderId, 20000n, `settlement-${i}`);
        if (i < askOrders.length - 1) {
          currentBid = simulator.getOrders().find(o => o.owner === "trader" && o.isLive)!;
        }
      }
      
      // Trader receives 100k USD
      expect(simulator.getBalance("trader", "USD")).toEqual(100000n);
      
      // Average execution rate should be better than mid
      const avgRate = ((20000n * 1525000n) / 1000000n +
                      (20000n * 1526000n) / 1000000n +
                      (20000n * 1527000n) / 1000000n +
                      (20000n * 1528000n) / 1000000n +
                      (20000n * 1529000n) / 1000000n) / 100000n;
      expect(avgRate).toBeLessThan(1527500n); // Better than mid of first and last
    });
  });

});