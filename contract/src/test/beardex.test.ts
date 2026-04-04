// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

/**
 * BearDEX Test Suite
 * 
 * Tests for the BearDEX smart contract matching the current implementation.
 * 
 */

import { BearDEXSimulator } from "./beardex-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

// ============================================================================
// TEST SUITE
// ============================================================================

describe("BearDEX smart contract", () => {
  // ========================================================================
  // INITIALIZATION TESTS
  // ========================================================================

  describe("Initialization", () => {
    it("initializes with correct oracle price", () => {
      const simulator = new BearDEXSimulator();
      const ledger = simulator.getLedger();
      
      // Initial oracle: 1 USD = 150 JPY (stored as 1500000 with SCALE 10000)
      expect(ledger.oracleJpyPrice).toEqual(1500000n);
    });

    it("initializes with pool not initialized", () => {
      const simulator = new BearDEXSimulator();
      const ledger = simulator.getLedger();
      
      expect(ledger.poolInitialized).toEqual(false);
    });

    it("initializes with empty pool state", () => {
      const simulator = new BearDEXSimulator();
      const pool = simulator.getPoolState();
      
      expect(pool.xLiquidity).toEqual(0n);
      expect(pool.yLiquidity).toEqual(0n);
      expect(pool.lpCirculatingSupply).toEqual(0n);
    });
  });

  // ========================================================================
  // ORACLE MANAGEMENT TESTS
  // ========================================================================

  describe("Oracle Price Management", () => {
    it("updates oracle price successfully", () => {
      const simulator = new BearDEXSimulator();
      
      // Update to 1 USD = 160 JPY (1600000 with SCALE 10000)
      const ledger = simulator.updateOraclePrice(1600000n);
      
      expect(ledger.oracleJpyPrice).toEqual(1600000n);
    });

    it("rejects non-positive oracle price", () => {
      const simulator = new BearDEXSimulator();
      
      expect(() => {
        simulator.updateOraclePrice(0n);
      }).toThrow("Price must be positive");
    });

    it("allows changing oracle price multiple times", () => {
      const simulator = new BearDEXSimulator();
      
      simulator.updateOraclePrice(1550000n);
      expect(simulator.getLedger().oracleJpyPrice).toEqual(1550000n);
      
      simulator.updateOraclePrice(1600000n);
      expect(simulator.getLedger().oracleJpyPrice).toEqual(1600000n);
      
      simulator.updateOraclePrice(1450000n);
      expect(simulator.getLedger().oracleJpyPrice).toEqual(1450000n);
    });

    it("retrieves oracle price correctly", () => {
      const simulator = new BearDEXSimulator();
      simulator.updateOraclePrice(1650000n);
      
      expect(simulator.getOraclePrice()).toEqual(1650000n);
    });
  });

  // ========================================================================
  // TOKEN MINTING TESTS
  // ========================================================================

  describe("Token Minting", () => {
    it("mints USD tokens successfully", () => {
      const simulator = new BearDEXSimulator();
      simulator.mintUSD(1000n, "user1");
      
      expect(simulator.getBalance("user1", "USD")).toEqual(1000n);
    });

    it("mints JPY tokens successfully", () => {
      const simulator = new BearDEXSimulator();
      simulator.mintJPY(150000n, "user1");
      
      expect(simulator.getBalance("user1", "JPY")).toEqual(150000n);
    });

    it("rejects minting zero tokens", () => {
      const simulator = new BearDEXSimulator();
      
      expect(() => {
        simulator.mintUSD(0n, "user1");
      }).toThrow("Amount must be positive");
    });

    it("tracks multiple user balances separately", () => {
      const simulator = new BearDEXSimulator();
      
      simulator.mintUSD(1000n, "user1");
      simulator.mintUSD(2000n, "user2");
      
      expect(simulator.getBalance("user1", "USD")).toEqual(1000n);
      expect(simulator.getBalance("user2", "USD")).toEqual(2000n);
    });
  });

  // ========================================================================
  // POOL MANAGEMENT TESTS
  // ========================================================================

  describe("Pool Management", () => {
    it("initializes pool successfully", () => {
      const simulator = new BearDEXSimulator();
      
      // Initialize with 1000 USD, 150000 JPY, 12247 LP tokens
      const ledger = simulator.initPool(1000n, 150000n, 12247n, "admin");
      
      expect(ledger.poolInitialized).toEqual(true);
      expect(ledger.pool.xLiquidity).toEqual(1000n);
      expect(ledger.pool.yLiquidity).toEqual(150000n);
      expect(ledger.pool.lpCirculatingSupply).toEqual(12247n);
    });

    it("rejects pool re-initialization", () => {
      const simulator = new BearDEXSimulator();
      simulator.initPool(1000n, 150000n, 12247n, "admin");
      
      expect(() => {
        simulator.initPool(500n, 75000n, 6123n, "admin");
      }).toThrow("Pool already initialized");
    });

    it("rejects too many LP tokens on initialization", () => {
      const simulator = new BearDEXSimulator();
      
      expect(() => {
        // lpOut^2 > xIn * yIn would violate the constraint
        simulator.initPool(1000n, 150000n, 20000n, "admin");
      }).toThrow("Too many LP tokens taken");
    });

    it("adds liquidity successfully", () => {
      const simulator = new BearDEXSimulator();
      simulator.initPool(1000n, 150000n, 12247n, "admin");
      
      // Add 500 USD, 75000 JPY, get 6123 LP tokens
      const ledger = simulator.addLiquidity(500n, 75000n, 6123n, "user1");
      
      expect(ledger.pool.xLiquidity).toEqual(1500n);
      expect(ledger.pool.yLiquidity).toEqual(225000n);
      expect(ledger.pool.lpCirculatingSupply).toEqual(18370n);
      expect(simulator.getBalance("user1", "LP")).toEqual(6123n);
    });

    it("rejects adding liquidity to uninitialized pool", () => {
      const simulator = new BearDEXSimulator();
      
      expect(() => {
        simulator.addLiquidity(500n, 75000n, 6123n, "user1");
      }).toThrow("Pool not initialized");
    });

    it("removes liquidity successfully", () => {
      const simulator = new BearDEXSimulator();
      simulator.initPool(1000n, 150000n, 12247n, "admin");
      
      // Remove 1000 LP tokens - should get proportional amount
      const ledger = simulator.removeLiquidity(1000n, 81n, 12245n, "admin");
      
      expect(ledger.pool.xLiquidity).toEqual(919n);
      expect(ledger.pool.yLiquidity).toEqual(137755n);
      expect(ledger.pool.lpCirculatingSupply).toEqual(11247n);
      expect(simulator.getBalance("admin", "USD")).toEqual(81n);
      expect(simulator.getBalance("admin", "JPY")).toEqual(12245n);
    });

    it("rejects removing liquidity from uninitialized pool", () => {
      const simulator = new BearDEXSimulator();
      
      expect(() => {
        simulator.removeLiquidity(1000n, 81n, 12245n, "admin");
      }).toThrow("Pool not initialized");
    });
  });

  // ========================================================================
  // ORACLE CONSTRAINT TESTS - USD to JPY
  // ========================================================================

  describe("Oracle Constraints - USD to JPY", () => {
    it("succeeds when swap rate >= oracle rate", () => {
      const simulator = new BearDEXSimulator();
      
      // Set oracle to 1400000 (1 USD = 140 JPY with SCALE 10000)
      simulator.updateOraclePrice(1400000n);
      
      // Initialize pool with high JPY reserves to allow good rates
      simulator.initPool(1000n, 200000n, 14142n, "admin");
      
      // Mint USD for user1
      simulator.mintUSD(10n, "user1");
      
      // Try to swap 10 USD
      // AMM calculation: dy = (200000 * 10) / 1010 = 1980 JPY
      // Swap rate: 1980 * 10000 / 10 = 1980000
      // Oracle rate: 1400000
      // 1980000 >= 1400000 ✓
      
      const ledger = simulator.swapUSDToJPY(10n, 1980n, "user1");
      
      expect(ledger.pool.xLiquidity).toEqual(1010n);
      expect(ledger.pool.yLiquidity).toEqual(200000n - 1980n);
    });

    it("fails when swap rate < oracle rate", () => {
      const simulator = new BearDEXSimulator();
      
      // Set oracle to 2000000 (1 USD = 200 JPY with SCALE 10000)
      simulator.updateOraclePrice(2000000n);
      
      // Initialize pool with low JPY reserves
      simulator.initPool(1000n, 150000n, 12247n, "admin");
      
      // Try to swap 10 USD
      // AMM calculation: dy = (150000 * 10) / 1010 = 1485 JPY
      // Swap rate: 1485 * 10000 / 10 = 1485000
      // Oracle rate: 2000000
      // 1485000 < 2000000 ✗
      
      expect(() => {
        simulator.swapUSDToJPY(10n, 1485n, "user1");
      }).toThrow(/Swap rate.*worse than oracle/);
    });

    it("succeeds when swap rate equals oracle rate exactly", () => {
      const simulator = new BearDEXSimulator();
      
      // Set oracle to match expected swap rate
      simulator.updateOraclePrice(1485000n);
      
      simulator.initPool(1000n, 150000n, 12247n, "admin");
      
      // Mint USD for user1
      simulator.mintUSD(10n, "user1");
      
      // Swap rate will equal oracle rate
      const ledger = simulator.swapUSDToJPY(10n, 1485n, "user1");
      
      expect(ledger.pool.xLiquidity).toEqual(1010n);
      expect(ledger.pool.yLiquidity).toEqual(148515n);
    });
  });

  // ========================================================================
  // ORACLE CONSTRAINT TESTS - JPY to USD
  // ========================================================================

  describe("Oracle Constraints - JPY to USD", () => {
    it("succeeds when swap rate >= oracle rate", () => {
      const simulator = new BearDEXSimulator();
      
      // Set oracle to 1400000 (1 USD = 140 JPY, so 1 JPY = 10000000/1400000 ≈ 7.14 USD)
      simulator.updateOraclePrice(1400000n);
      
      // Initialize pool with high USD reserves
      simulator.initPool(2000n, 150000n, 17320n, "admin");
      
      // Mint JPY for user1
      simulator.mintJPY(10000n, "user1");
      
      // Try to swap 10000 JPY
      // AMM calculation: dx = (2000 * 10000) / 160000 = 125 USD
      // Swap rate (JPY->USD): 125 * 10000 / 10000 = 1250
      // Oracle rate (JPY->USD): 10000000 / 1400000 = 7.14
      // 1250 >= 7.14 ✓
      
      const ledger = simulator.swapJPYToUSD(10000n, 125n, "user1");
      
      expect(ledger.pool.xLiquidity).toEqual(2000n - 125n);
      expect(ledger.pool.yLiquidity).toEqual(160000n);
    });

    it("fails when swap rate < oracle rate", () => {
      const simulator = new BearDEXSimulator();
      
      // Set oracle to 1000000 (1 USD = 100 JPY, so 1 JPY = 10 USD)
      simulator.updateOraclePrice(1000000n);
      
      // Initialize pool with low USD reserves
      simulator.initPool(1000n, 150000n, 12247n, "admin");
      
      // Mint JPY for user1
      simulator.mintJPY(10000n, "user1");
      
      // Try to swap 10000 JPY
      // AMM calculation: dx = (1000 * 10000) / 160000 = 62.5 USD
      // Swap rate (JPY->USD): 62.5 * 10000 / 10000 = 625
      // Oracle rate (JPY->USD): 10000000 / 1000000 = 1000
      // 625 < 1000 ✗
      
      expect(() => {
        simulator.swapJPYToUSD(10000n, 62n, "user1");
      }).toThrow(/Swap rate.*worse than oracle/);
    });
  });

  // ========================================================================
  // K INVARIANT TESTS
  // ========================================================================

  describe("K Invariant Protection", () => {
    it("maintains K invariant on successful USD->JPY swap", () => {
      const simulator = new BearDEXSimulator();
      simulator.updateOraclePrice(900000n); // Lower than swap rate
      simulator.initPool(1000n, 100000n, 10000n, "admin");
      simulator.mintUSD(100n, "user1");
      
      const initialPool = simulator.getPoolState();
      const initialK = initialPool.xLiquidity * initialPool.yLiquidity;
      
      simulator.swapUSDToJPY(100n, 9090n, "user1");
      
      const finalPool = simulator.getPoolState();
      const finalK = finalPool.xLiquidity * finalPool.yLiquidity;
      
      expect(finalK).toBeGreaterThanOrEqual(initialK);
    });

    it("maintains K invariant on successful JPY->USD swap", () => {
      const simulator = new BearDEXSimulator();
      simulator.updateOraclePrice(10000000000n); // Very high oracle to bypass
      simulator.initPool(1000n, 100000n, 10000n, "admin");
      simulator.mintJPY(10000n, "user1");
      
      const initialPool = simulator.getPoolState();
      const initialK = initialPool.xLiquidity * initialPool.yLiquidity;
      
      simulator.swapJPYToUSD(10000n, 90n, "user1");
      
      const finalPool = simulator.getPoolState();
      const finalK = finalPool.xLiquidity * finalPool.yLiquidity;
      
      expect(finalK).toBeGreaterThanOrEqual(initialK);
    });

    it("fails swap that would decrease K invariant", () => {
      const simulator = new BearDEXSimulator();
      simulator.updateOraclePrice(1n); // Very low oracle to bypass oracle check
      simulator.initPool(1000n, 100000n, 10000n, "admin");
      simulator.mintUSD(100n, "user1");
      
      // Try to take more than AMM allows
      expect(() => {
        simulator.swapUSDToJPY(100n, 10000n, "user1");
      }).toThrow(/K invariant violated/);
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe("Edge Cases", () => {
    it("handles very small swap amounts", () => {
      const simulator = new BearDEXSimulator();
      simulator.updateOraclePrice(980000n);
      simulator.initPool(1000n, 100000n, 10000n, "admin");
      simulator.mintUSD(1n, "user1");
      
      const ledger = simulator.swapUSDToJPY(1n, 99n, "user1");
      
      expect(ledger.pool.xLiquidity).toEqual(1001n);
      expect(ledger.pool.yLiquidity).toEqual(99901n);
    });

    it("handles large swap amounts", () => {
      const simulator = new BearDEXSimulator();
      simulator.updateOraclePrice(900000n);
      simulator.initPool(10000n, 1000000n, 100000n, "admin");
      simulator.mintUSD(1000n, "user1");
      
      const ledger = simulator.swapUSDToJPY(1000n, 90908n, "user1");
      
      expect(ledger.pool.xLiquidity).toEqual(11000n);
      expect(ledger.pool.yLiquidity).toEqual(909092n);
    });

    it("rejects swap before pool initialization", () => {
      const simulator = new BearDEXSimulator();
      
      expect(() => {
        simulator.swapUSDToJPY(10n, 1500n, "user1");
      }).toThrow("Pool not initialized");
    });

    it("handles swaps in both directions", () => {
      const simulator = new BearDEXSimulator();
      simulator.initPool(1000n, 100000n, 10000n, "admin");
      simulator.mintUSD(100n, "user1");
      simulator.mintUSD(100n, "user3");
      simulator.mintJPY(9000n, "user2");
      
      // USD -> JPY: dy = (100000 * 100) / 1100 = 9090
      simulator.updateOraclePrice(1n);
      simulator.swapUSDToJPY(100n, 9090n, "user1");
      expect(simulator.getPoolState().xLiquidity).toEqual(1100n);
      
      // JPY -> USD: dx = (1100 * 9000) / 99910 = 99
      simulator.updateOraclePrice(10000000000n);
      simulator.swapJPYToUSD(9000n, 99n, "user2");
      expect(simulator.getPoolState().xLiquidity).toEqual(1001n);
      
      // Back to USD -> JPY: dy = (99910 * 100) / 1101 = 9074
      simulator.updateOraclePrice(1n);
      simulator.swapUSDToJPY(100n, 9074n, "user3");
      expect(simulator.getPoolState().xLiquidity).toEqual(1101n);
    });
  });
});