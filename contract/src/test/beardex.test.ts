// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

import { BearDEXSimulator } from "./beardex-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

describe("BearDEX smart contract", () => {
  it("initializes with correct oracle prices", () => {
    const simulator = new BearDEXSimulator();
    const ledger = simulator.getLedger();
    
    // Initial prices: 1 USD = 150 JPY (150000/1000), 1 USD = 0.92 EUR (92000/1000)
    expect(ledger.oracleJpyPrice).toEqual(150000n);
    expect(ledger.oracleEurPrice).toEqual(92000n);
  });

  it("mints USD tokens successfully", () => {
    const simulator = new BearDEXSimulator();
    const ledger = simulator.mintUSD(1000n, "mint-test-1");
    
    // Transaction should complete successfully
    expect(ledger).toBeDefined();
  });

  it("initializes USD/JPY pool liquidity", () => {
    const simulator = new BearDEXSimulator();
    
    // Initialize pool: 1000 USD, 150000 JPY, 12247 LP tokens (sqrt(1000 * 150000))
    const ledger = simulator.initLiquidityUSDJPY(1000n, 150000n, 12247n, "init-pool");
    
    // Pool should be initialized
    expect(ledger.poolUSDJPYInitialized).toEqual(true);
    expect(ledger.poolUSDJPY.xLiquidity).toEqual(1000n);
    expect(ledger.poolUSDJPY.yLiquidity).toEqual(150000n);
    expect(ledger.poolUSDJPY.lpCirculatingSupply).toEqual(12247n);
  });

  it("adds liquidity to USD/JPY pool", () => {
    const simulator = new BearDEXSimulator();
    simulator.initLiquidityUSDJPY(1000n, 150000n, 12247n, "init");
    
    // Add more liquidity: 500 USD, 75000 JPY, 6123 LP tokens (proportional)
    const ledger = simulator.addLiquidityUSDJPY(500n, 75000n, 6123n, "add-liquidity");
    
    // Pool should have increased liquidity
    expect(ledger.poolUSDJPY.xLiquidity).toEqual(1500n);
    expect(ledger.poolUSDJPY.yLiquidity).toEqual(225000n);
    expect(ledger.poolUSDJPY.lpCirculatingSupply).toEqual(18370n);
  });

  it("swaps USD for JPY correctly", () => {
    const simulator = new BearDEXSimulator();
    // Initialize with values that work well with integer division
    simulator.initLiquidityUSDJPY(10000n, 10000n, 10000n, "init");
    
    // Swap calculation with zero fee
    // Constant product: (x + dx) * (y - dy) = x * y
    // dy = (y * dx) / (x + dx)  <- this is the correct formula
    // With x=10000, y=10000, dx=100:
    // dy = (10000 * 100) / 10100 = 1000000 / 10100 = 99
    const xIn = 100n;
    const xFee = 0n;
    const yOut = (10000n * xIn) / (10000n + xIn); // 1000000 / 10100 = 99
    
    const ledger = simulator.swapUSDToJPY(xIn, xFee, yOut, "swap-usd-jpy");
    
    // Pool reserves should be updated
    expect(ledger.poolUSDJPY.xLiquidity).toEqual(10100n);
    expect(ledger.poolUSDJPY.yLiquidity).toEqual(10000n - yOut);
    
    // K should not decrease
    const kInitial = 10000n * 10000n;
    const kFinal = 10100n * (10000n - yOut);
    expect(kFinal).toBeGreaterThanOrEqual(kInitial);
  });

  it("updates oracle prices", () => {
    const simulator = new BearDEXSimulator();
    
    // Update prices: 1 USD = 160 JPY, 1 USD = 0.95 EUR
    const ledger = simulator.updateOraclePrices(160000n, 95000n);
    
    // Prices should be updated
    expect(ledger.oracleJpyPrice).toEqual(160000n);
    expect(ledger.oracleEurPrice).toEqual(95000n);
  });
});