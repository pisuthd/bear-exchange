// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

/**
 * BearDEX Simulator
 * 
 * A simulator that mirrors the current BearDEX contract exactly.
 * 
 */

import { generateNonce } from "../witnesses.js";

// ============================================================================
// TYPES
// ============================================================================

interface PoolState {
  xLiquidity: bigint;      // USD reserves (private - from witnesses)
  yLiquidity: bigint;      // JPY reserves (private - from witnesses)
  lpCirculatingSupply: bigint;  // LP token supply (public ledger)
}

interface LedgerState {
  // Public state
  owner: Uint8Array;
  lpTotalSupply: bigint;
  hashedReserveUSD: Uint8Array;  // Hashed reserves (public)
  hashedReserveJPY: Uint8Array; // Hashed reserves (public)
  oracleJpyPrice: bigint;
  poolInitialized: boolean;

  // Private state (witness-based - sealed in contract)
  pool: PoolState;
}

// ============================================================================
// SIMULATOR CLASS
// ============================================================================

/**
 * Simulates the BearDEX contract exactly as implemented.
 */
export class BearDEXSimulator {
  private ledger: LedgerState;
  private userKeys: Map<string, Uint8Array>;
  private userBalances: Map<string, Map<string, bigint>>;
  private reservesUSD: bigint;  // Witness values
  private reservesJPY: bigint;  // Witness values

  constructor() {
    // Initialize with default values matching the contract constructor
    this.ledger = {
      owner: this.generateRandomKey(),
      lpTotalSupply: 0n,
      hashedReserveUSD: this.hashAmount(0n),
      hashedReserveJPY: this.hashAmount(0n),
      oracleJpyPrice: 1500000n,  // Contract initializes to 1500000
      poolInitialized: false,
      pool: {
        xLiquidity: 0n,
        yLiquidity: 0n,
        lpCirculatingSupply: 0n,
      },
    };

    this.reservesUSD = 0n;
    this.reservesJPY = 0n;
    this.userKeys = new Map();
    this.userBalances = new Map();
  }

  // ========================================================================
  // LEDGER ACCESS
  // ========================================================================

  getLedger(): LedgerState {
    return { ...this.ledger };
  }

  getPoolState(): PoolState {
    return { ...this.ledger.pool };
  }

  // ========================================================================
  // TOKEN MINTING
  // ========================================================================

  mintUSD(amount: bigint, userId: string = "user"): LedgerState {
    if (amount <= 0n) {
      throw new Error("Amount must be positive");
    }
    this.ensureUserExists(userId);
    this.addToBalance(userId, "USD", amount);
    return this.getLedger();
  }

  mintJPY(amount: bigint, userId: string = "user"): LedgerState {
    if (amount <= 0n) {
      throw new Error("Amount must be positive");
    }
    this.ensureUserExists(userId);
    this.addToBalance(userId, "JPY", amount);
    return this.getLedger();
  }

  getBalance(userId: string, token: string): bigint {
    const userBalances = this.userBalances.get(userId);
    if (!userBalances) return 0n;
    return userBalances.get(token) || 0n;
  }

  // ========================================================================
  // ORACLE MANAGEMENT
  // ========================================================================

  updateOraclePrice(usd_jpy_price: bigint): LedgerState {
    if (usd_jpy_price <= 0n) {
      throw new Error("Price must be positive");
    }
    this.ledger.oracleJpyPrice = usd_jpy_price;
    return this.getLedger();
  }

  getOraclePrice(): bigint {
    return this.ledger.oracleJpyPrice;
  }

  // ========================================================================
  // POOL MANAGEMENT
  // ========================================================================

  initPool(
    xIn: bigint,
    yIn: bigint,
    lpOut: bigint,
    userId: string = "admin"
  ): LedgerState {
    // Check if pool is already initialized (check this FIRST)
    if (this.ledger.poolInitialized) {
      throw new Error("Pool already initialized");
    }

    // Verify caller is owner (simplified - assume admin userId)
    const callerKey = this.userKeys.get(userId);
    if (callerKey && !this.equalKeys(callerKey, this.ledger.owner)) {
      throw new Error("Unauthorized: only owner can initialize pool");
    }

    // Validate LP tokens: lpOut^2 <= xIn * yIn
    const lpOut128 = lpOut;
    const xIn128 = xIn;
    const yIn128 = yIn;
    const lpOutSquared = (lpOut128 as bigint) * (lpOut128 as bigint);
    const xInY = (xIn128 as bigint) * (yIn128 as bigint);
    if (lpOutSquared > xInY) {
      throw new Error("Too many LP tokens taken");
    }

    // Update witness reserves
    this.reservesUSD = xIn;
    this.reservesJPY = yIn;

    // Update pool state
    this.ledger.pool = {
      xLiquidity: xIn,
      yLiquidity: yIn,
      lpCirculatingSupply: lpOut,
    };

    // Update public ledger
    this.ledger.lpTotalSupply = lpOut;
    this.ledger.hashedReserveUSD = this.hashAmount(xIn);
    this.ledger.hashedReserveJPY = this.hashAmount(yIn);
    this.ledger.poolInitialized = true;

    // Mint LP tokens to provider
    this.ensureUserExists(userId);
    this.addToBalance(userId, "LP", lpOut);

    return this.getLedger();
  }

  addLiquidity(
    xIn: bigint,
    yIn: bigint,
    lpOut: bigint,
    userId: string = "user"
  ): LedgerState {
    if (!this.ledger.poolInitialized) {
      throw new Error("Pool not initialized");
    }

    const pool = this.ledger.pool;
    const xIn128 = xIn;
    const yIn128 = yIn;

    // Validate LP tokens using multiplication (avoiding division)
    if (xIn128 * pool.yLiquidity < yIn128 * pool.xLiquidity) {
      const xLhs = lpOut * pool.xLiquidity;
      const xRhs = xIn128 * pool.lpCirculatingSupply;
      if (xLhs > xRhs) {
        throw new Error("Too many LP tokens taken (bound by USD)");
      }
    } else {
      const yLhs = lpOut * pool.yLiquidity;
      const yRhs = yIn128 * pool.lpCirculatingSupply;
      if (yLhs > yRhs) {
        throw new Error("Too many LP tokens taken (bound by JPY)");
      }
    }

    // Update witness reserves
    this.reservesUSD = pool.xLiquidity + xIn;
    this.reservesJPY = pool.yLiquidity + yIn;

    // Update pool state
    this.ledger.pool = {
      xLiquidity: pool.xLiquidity + xIn,
      yLiquidity: pool.yLiquidity + yIn,
      lpCirculatingSupply: pool.lpCirculatingSupply + lpOut,
    };

    // Update public ledger
    this.ledger.lpTotalSupply = this.ledger.pool.lpCirculatingSupply;
    this.ledger.hashedReserveUSD = this.hashAmount(this.reservesUSD);
    this.ledger.hashedReserveJPY = this.hashAmount(this.reservesJPY);

    // Mint LP tokens to provider
    this.ensureUserExists(userId);
    this.addToBalance(userId, "LP", lpOut);

    return this.getLedger();
  }

  removeLiquidity(
    lpIn: bigint,
    xOut: bigint,
    yOut: bigint,
    userId: string = "user"
  ): LedgerState {
    if (!this.ledger.poolInitialized) {
      throw new Error("Pool not initialized");
    }

    const pool = this.ledger.pool;
    const xOut128 = xOut;
    const yOut128 = yOut;
    const lpIn128 = lpIn;

    // Validate output tokens using multiplication
    const xLhs = xOut128 * pool.lpCirculatingSupply;
    const xRhs = lpIn128 * pool.xLiquidity;
    if (xLhs > xRhs) {
      throw new Error("Too much USD requested");
    }

    const yLhs = yOut128 * pool.lpCirculatingSupply;
    const yRhs = lpIn128 * pool.yLiquidity;
    if (yLhs > yRhs) {
      throw new Error("Too much JPY requested");
    }

    // Update witness reserves
    this.reservesUSD = pool.xLiquidity - xOut;
    this.reservesJPY = pool.yLiquidity - yOut;

    // Update pool state
    this.ledger.pool.xLiquidity = this.reservesUSD;
    this.ledger.pool.yLiquidity = this.reservesJPY;
    this.ledger.pool.lpCirculatingSupply = pool.lpCirculatingSupply - lpIn128;

    // Update public ledger
    this.ledger.lpTotalSupply = this.ledger.pool.lpCirculatingSupply;
    this.ledger.hashedReserveUSD = this.hashAmount(this.reservesUSD);
    this.ledger.hashedReserveJPY = this.hashAmount(this.reservesJPY);

    // Send tokens to recipient
    this.ensureUserExists(userId);
    this.removeFromBalance(userId, "LP", lpIn);
    this.addToBalance(userId, "USD", xOut);
    this.addToBalance(userId, "JPY", yOut);

    return this.getLedger();
  }

  // ========================================================================
  // SWAPS
  // ========================================================================

  swapUSDToJPY(xIn: bigint, yOut: bigint, userId: string = "user"): LedgerState {
    if (!this.ledger.poolInitialized) {
      throw new Error("Pool not initialized");
    }

    const currentX = this.reservesUSD;
    const currentY = this.reservesJPY;

    // Verify K invariant (constant product maintained)
    const kValid = this.verifyKInvariant(xIn, yOut, currentX, currentY);
    if (!kValid) {
      throw new Error("K invariant violated");
    }

    // Verify oracle rate constraint (swap rate >= oracle rate)
    const oracleValid = this.verifyUSDToJPYOracle(yOut, xIn);
    if (!oracleValid) {
      throw new Error("Swap rate worse than oracle");
    }

    // Update witness reserves
    this.reservesUSD = this.reservesUSD + xIn;
    this.reservesJPY = this.reservesJPY - yOut;

    // Update pool state
    this.ledger.pool.xLiquidity = this.reservesUSD;
    this.ledger.pool.yLiquidity = this.reservesJPY;

    // Update public ledger
    this.ledger.hashedReserveUSD = this.hashAmount(this.reservesUSD);
    this.ledger.hashedReserveJPY = this.hashAmount(this.reservesJPY);

    // Update user balances
    this.ensureUserExists(userId);
    this.removeFromBalance(userId, "USD", xIn);
    this.addToBalance(userId, "JPY", yOut);

    return this.getLedger();
  }

  swapJPYToUSD(yIn: bigint, xOut: bigint, userId: string = "user"): LedgerState {
    if (!this.ledger.poolInitialized) {
      throw new Error("Pool not initialized");
    }

    const currentX = this.reservesUSD;
    const currentY = this.reservesJPY;

    // Verify K invariant (constant product maintained)
    // For JPY->USD: we remove USD from X (-xOut) and add JPY to Y (+yIn)
    // So verifyKInvariant expects (xIn, yOut) where xIn = -xOut, yOut = -yIn
    // We use a different approach: verify X decreases and Y increases
    const initialK = this.calcK(currentX, currentY);
    const newX = currentX - xOut;
    const newY = currentY + yIn;
    const finalK = this.calcK(newX, newY);
    if (finalK < initialK) {
      throw new Error("K invariant violated");
    }

    // Verify oracle rate constraint (swap rate >= inverse oracle rate)
    const oracleValid = this.verifyJPYToUSDOracle(xOut, yIn);
    if (!oracleValid) {
      throw new Error("Swap rate worse than oracle");
    }

    // Update witness reserves
    this.reservesUSD = this.reservesUSD - xOut;
    this.reservesJPY = this.reservesJPY + yIn;

    // Update pool state
    this.ledger.pool.xLiquidity = this.reservesUSD;
    this.ledger.pool.yLiquidity = this.reservesJPY;

    // Update public ledger
    this.ledger.hashedReserveUSD = this.hashAmount(this.reservesUSD);
    this.ledger.hashedReserveJPY = this.hashAmount(this.reservesJPY);

    // Update user balances
    this.ensureUserExists(userId);
    this.removeFromBalance(userId, "JPY", yIn);
    this.addToBalance(userId, "USD", xOut);

    return this.getLedger();
  }

  // ========================================================================
  // ORACLE VERIFICATION
  // ========================================================================

  private verifyUSDToJPYOracle(yOut: bigint, xIn: bigint): boolean {
    const SCALE = 10000n;
    const lhs = yOut * SCALE;
    const rhs = this.ledger.oracleJpyPrice * xIn;
    return lhs >= rhs;
  }

  private verifyJPYToUSDOracle(xOut: bigint, yIn: bigint): boolean {
    const SCALE = 10000n;
    const lhs = xOut * this.ledger.oracleJpyPrice;
    const rhs = SCALE * yIn;
    return lhs >= rhs;
  }

  // ========================================================================
  // K INVARIANT VERIFICATION
  // ========================================================================

  private verifyKInvariant(
    xIn: bigint,
    yOut: bigint,
    currentX: bigint,
    currentY: bigint
  ): boolean {
    const initialK = this.calcK(currentX, currentY);
    const newX = currentX + xIn;
    const newY = currentY - yOut;
    const finalK = this.calcK(newX, newY);
    return finalK >= initialK;
  }

  private calcK(x: bigint, y: bigint): bigint {
    // Cast to smaller Uint to prevent overflow (matching contract)
    const x124 = x & ((1n << 124n) - 1n);
    const y124 = y & ((1n << 124n) - 1n);
    return x124 * y124;
  }

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  private hashAmount(amount: bigint): Uint8Array {
    // Simplified hash - in contract this uses commitAmount
    const amountBytes = new Uint8Array(32);
    const amountStr = amount.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      amountBytes[i] = parseInt(amountStr.slice(i * 2, i * 2 + 2), 16);
    }
    return amountBytes;
  }

  private ensureUserExists(userId: string): void {
    if (!this.userKeys.has(userId)) {
      this.userKeys.set(userId, this.generateRandomKey());
      this.userBalances.set(userId, new Map());
    }
  }

  private addToBalance(userId: string, token: string, amount: bigint): void {
    const balances = this.userBalances.get(userId);
    if (balances) {
      const current = balances.get(token) || 0n;
      balances.set(token, current + amount);
    }
  }

  private removeFromBalance(userId: string, token: string, amount: bigint): void {
    const balances = this.userBalances.get(userId);
    if (balances) {
      const current = balances.get(token) || 0n;
      if (current < amount) {
        throw new Error(`Insufficient ${token} balance`);
      }
      balances.set(token, current - amount);
    }
  }

  private generateRandomKey(): Uint8Array {
    return generateNonce();
  }

  private equalKeys(key1: Uint8Array, key2: Uint8Array): boolean {
    if (key1.length !== key2.length) return false;
    for (let i = 0; i < key1.length; i++) {
      if (key1[i] !== key2[i]) return false;
    }
    return true;
  }
}