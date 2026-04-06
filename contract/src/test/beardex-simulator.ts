// SPDX-License-Identifier: Apache-2.0

/**
 * BearDEX Simulator
 * 
 */

// ============================================================================
// TYPES
// ============================================================================

interface PoolState {
  xLiquidity: bigint;      // USD reserves (PRIVATE - witness-based)
  yLiquidity: bigint;      // JPY reserves (PRIVATE - witness-based)
  lpCirculatingSupply: bigint;  // LP token supply (public ledger)
}

interface LedgerState {
  // Public state
  oraclePrice: bigint;     // Oracle reference price (oracleJpyPrice)
  hashedReserveUSD: Uint8Array;  // Hash commitment to USD reserves
  hashedReserveJPY: Uint8Array;  // Hash commitment to JPY reserves
  lpTotalSupply: bigint;
  poolInitialized: boolean;
}

interface SwapInputs {
  dx: bigint;       // Public: amount in (USD or JPY)
  dy: bigint;       // Public: amount out (JPY or USD) - user calculates off-chain
}

// ============================================================================
// SIMULATOR CLASS
// ============================================================================

/**
 * Simulates BearDEX contract with private pool reserves via witnesses.
 * Uses Constant Product AMM with multiplication-only verification (NO DIVISION).
 */
export class BearDEXSimulator {
  private ledger: LedgerState;
  private privatePool: PoolState;  // Private pool state (witness-based)
  private userBalances: Map<string, Map<string, bigint>>;
  private swapInputs: SwapInputs;

  constructor() {
    // Initialize with default values matching the contract constructor
    this.ledger = {
      oraclePrice: 1500000n,    // 1 USD = 150.00 JPY (scaled by SCALE=10000)
      hashedReserveUSD: this.commitAmount(0n),
      hashedReserveJPY: this.commitAmount(0n),
      lpTotalSupply: 0n,
      poolInitialized: false,
    };

    this.privatePool = {
      xLiquidity: 0n,
      yLiquidity: 0n,
      lpCirculatingSupply: 0n,
    };

    this.userBalances = new Map();
    this.swapInputs = { dx: 0n, dy: 0n };
  }

  // ========================================================================
  // LEDGER ACCESS
  // ========================================================================

  getLedger(): LedgerState {
    return { ...this.ledger };
  }

  getPoolState(): PoolState {
    return {
      xLiquidity: this.privatePool.xLiquidity,
      yLiquidity: this.privatePool.yLiquidity,
      lpCirculatingSupply: this.privatePool.lpCirculatingSupply,
    };
  }

  // ========================================================================
  // SWAP INPUTS (PUBLIC CIRCUIT PARAMETERS)
  // ========================================================================

  /**
   * Set swap inputs (public circuit parameters)
   * These values are disclosed on-chain as part of the circuit!
   */
  setSwapInputs(dx: bigint, dy: bigint): void {
    this.swapInputs = { dx, dy };
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
  // POOL PARAMETER MANAGEMENT
  // ========================================================================

  updateOraclePrice(newPrice: bigint): LedgerState {
    if (newPrice <= 0n) {
      throw new Error("Oracle price must be positive");
    }
    this.ledger.oraclePrice = newPrice;
    return this.getLedger();
  }

  getOraclePrice(): bigint {
    return this.ledger.oraclePrice;
  }

  // ========================================================================
  // HASH COMMITMENTS
  // ========================================================================

  /**
   * Commit to an amount without revealing it
   * Simulates the contract's commitAmount function
   */
  private commitAmount(amount: bigint): Uint8Array {
    const amountBytes = new Uint8Array(32);
    const value = Number(amount);
    for (let i = 0; i < 8; i++) {
      amountBytes[i] = (value >> (i * 8)) & 0xff;
    }
    // Add salt
    const salt = new Uint8Array(32);
    for (let i = 0; i < 12; i++) {
      salt[i] = "BearDEX:salt".charCodeAt(i % 13);
    }
    // Simple hash simulation
    const combined = new Uint8Array(64);
    combined.set(amountBytes, 0);
    combined.set(salt, 32);
    return combined.slice(0, 32);
  }

  // ========================================================================
  // CONSTANT PRODUCT AMM - DIVISION-FREE VERIFICATION
  // ============================================================================

  /**
   * Calculate K invariant for LP validation.
   * K = x * y
   */
  private calcK(x: bigint, y: bigint): bigint {
    return x * y;
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
    // Check if pool is already initialized
    if (this.ledger.poolInitialized) {
      throw new Error("Pool already initialized");
    }

    // Verify LP tokens: lpOut^2 <= xIn * yIn
    const lpOutSquared = lpOut * lpOut;
    const xInY = xIn * yIn;
    if (lpOutSquared > xInY) {
      throw new Error("Too many LP tokens taken");
    }

    // Update private pool reserves (witness-based)
    this.privatePool.xLiquidity = xIn;
    this.privatePool.yLiquidity = yIn;
    this.privatePool.lpCirculatingSupply = lpOut;

    // Update hash commitments (public proof of reserves)
    this.ledger.hashedReserveUSD = this.commitAmount(xIn);
    this.ledger.hashedReserveJPY = this.commitAmount(yIn);

    // Update LP token supply (public)
    this.ledger.lpTotalSupply = lpOut;

    // Mint LP tokens to provider (shielded)
    this.ensureUserExists(userId);
    this.addToBalance(userId, "LP", lpOut);

    // Mark pool as initialized
    this.ledger.poolInitialized = true;

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

    const pool = this.getPoolState();

    // Validate LP tokens using multiplication (avoiding division)
    if (xIn * pool.yLiquidity < yIn * pool.xLiquidity) {
      const xLhs = lpOut * pool.xLiquidity;
      const xRhs = xIn * pool.lpCirculatingSupply;
      if (xLhs > xRhs) {
        throw new Error("Too many LP tokens taken (bound by USD)");
      }
    } else {
      const yLhs = lpOut * pool.yLiquidity;
      const yRhs = yIn * pool.lpCirculatingSupply;
      if (yLhs > yRhs) {
        throw new Error("Too many LP tokens taken (bound by JPY)");
      }
    }

    // Update private pool reserves (witness-based)
    const newX = pool.xLiquidity + xIn;
    const newY = pool.yLiquidity + yIn;
    this.privatePool.xLiquidity = newX;
    this.privatePool.yLiquidity = newY;
    this.privatePool.lpCirculatingSupply = pool.lpCirculatingSupply + lpOut;

    // Update hash commitments (public proof of reserves)
    this.ledger.hashedReserveUSD = this.commitAmount(newX);
    this.ledger.hashedReserveJPY = this.commitAmount(newY);

    // Update LP token supply (public)
    this.ledger.lpTotalSupply = pool.lpCirculatingSupply + lpOut;

    // Mint LP tokens to provider (shielded)
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

    const pool = this.getPoolState();

    // Validate output tokens using multiplication
    const xLhs = xOut * pool.lpCirculatingSupply;
    const xRhs = lpIn * pool.xLiquidity;
    if (xLhs > xRhs) {
      throw new Error("Too much USD requested");
    }

    const yLhs = yOut * pool.lpCirculatingSupply;
    const yRhs = lpIn * pool.yLiquidity;
    if (yLhs > yRhs) {
      throw new Error("Too much JPY requested");
    }

    // Burn LP tokens from sender
    this.ensureUserExists(userId);
    this.removeFromBalance(userId, "LP", lpIn);

    // Update private pool reserves (witness-based)
    const newX = pool.xLiquidity - xOut;
    const newY = pool.yLiquidity - yOut;
    this.privatePool.xLiquidity = newX;
    this.privatePool.yLiquidity = newY;
    this.privatePool.lpCirculatingSupply = pool.lpCirculatingSupply - lpIn;

    // Update hash commitments (public proof of reserves)
    this.ledger.hashedReserveUSD = this.commitAmount(newX);
    this.ledger.hashedReserveJPY = this.commitAmount(newY);

    // Update LP token supply (public)
    this.ledger.lpTotalSupply = pool.lpCirculatingSupply - lpIn;

    // Send tokens to recipient (shielded - private)
    this.addToBalance(userId, "USD", xOut);
    this.addToBalance(userId, "JPY", yOut);

    return this.getLedger();
  }

  // ========================================================================
  // SWAPS (WITH PUBLIC CIRCUIT PARAMETERS - NO DIVISION, NO FEES)
  // ========================================================================

  swapUSDToJPY(userId: string = "user"): LedgerState {
    if (!this.ledger.poolInitialized) {
      throw new Error("Pool not initialized");
    }

    // Get private pool reserves (witness-based)
    const x = this.privatePool.xLiquidity;
    const y = this.privatePool.yLiquidity;
    const oraclePrice = this.ledger.oraclePrice;

    // Get PUBLIC inputs via circuit parameters
    const dx = this.swapInputs.dx;      // Public: amount of USD to swap
    const dy = this.swapInputs.dy;      // Public: amount of JPY to receive

    // Verify oracle rate constraint (NO DIVISION - uses multiplication)
    // dy * SCALE >= dx * oraclePrice
    const SCALE = 10000n;
    const rateLhs = dy * SCALE;
    const rateRhs = dx * oraclePrice;
    if (rateLhs < rateRhs) {
      throw new Error("Swap rate worse than oracle");
    }

    // Verify K invariant (NO DIVISION - uses multiplication, NO FEES)
    // Final state: x' = x + dx, y' = y - dy
    // K invariant: (x + dx) * (y - dy) >= x * y
    const kLhs = y * dx;
    const kRhs = dy * (x + dx);
    if (kLhs < kRhs) {
      throw new Error("K invariant violated");
    }

    // Update private pool reserves (witness-based)
    const newX = x + dx;
    const newY = y - dy;
    this.privatePool.xLiquidity = newX;
    this.privatePool.yLiquidity = newY;

    // Update hash commitments (public proof of reserves)
    this.ledger.hashedReserveUSD = this.commitAmount(newX);
    this.ledger.hashedReserveJPY = this.commitAmount(newY);

    // Update user balances (shielded - private)
    this.ensureUserExists(userId);
    this.removeFromBalance(userId, "USD", dx);
    this.addToBalance(userId, "JPY", dy);

    return this.getLedger();
  }

  swapJPYToUSD(userId: string = "user"): LedgerState {
    if (!this.ledger.poolInitialized) {
      throw new Error("Pool not initialized");
    }

    // Get private pool reserves (witness-based)
    const x = this.privatePool.xLiquidity;
    const y = this.privatePool.yLiquidity;
    const oraclePrice = this.ledger.oraclePrice;

    // Get PUBLIC inputs via circuit parameters
    const dy = this.swapInputs.dx;      // Public: amount of JPY to swap
    const dx = this.swapInputs.dy;      // Public: amount of USD to receive

    // Verify oracle rate constraint (NO DIVISION - uses multiplication)
    // dx * oraclePrice >= dy * SCALE
    const SCALE = 10000n;
    const rateLhs = dx * oraclePrice;
    const rateRhs = dy * SCALE;
    if (rateLhs < rateRhs) {
      throw new Error("Swap rate worse than oracle");
    }

    // Verify K invariant (NO DIVISION - uses multiplication, NO FEES)
    // Final state: x' = x - dx, y' = y + dy
    // K invariant: (x - dx) * (y + dy) >= x * y
    const kLhs = x * dy;
    const kRhs = dx * (y + dy);
    if (kLhs < kRhs) {
      throw new Error("K invariant violated");
    }

    // Update private pool reserves (witness-based)
    const newX = x - dx;
    const newY = y + dy;
    this.privatePool.xLiquidity = newX;
    this.privatePool.yLiquidity = newY;

    // Update hash commitments (public proof of reserves)
    this.ledger.hashedReserveUSD = this.commitAmount(newX);
    this.ledger.hashedReserveJPY = this.commitAmount(newY);

    // Update user balances (shielded - private)
    this.ensureUserExists(userId);
    this.removeFromBalance(userId, "JPY", dy);
    this.addToBalance(userId, "USD", dx);

    return this.getLedger();
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

  /**
   * Calculate what constant product AMM would give for USD->JPY (for off-chain calculation).
   * Users calculate this offline to determine expected output.
   * 
   * Formula: dy = (y * dx) / (x + dx)
   * 
   * NOTE: This is NOT used in the circuit - it's only for users to
   * calculate expected swap outcomes off-chain.
   */
  calculateConstantProductUSDToJPY(x: bigint, y: bigint, dx: bigint): bigint {
    return (y * dx) / (x + dx);
  }

  /**
   * Calculate what constant product AMM would give for JPY->USD (for off-chain calculation).
   * Users calculate this offline to determine expected output.
   * 
   * Formula: dx = (x * dy) / (y + dy)
   * 
   * NOTE: This is NOT used in the circuit - it's only for users to
   * calculate expected swap outcomes off-chain.
   */
  calculateConstantProductJPYToUSD(x: bigint, y: bigint, dy: bigint): bigint {
    return (x * dy) / (y + dy);
  }

  /**
   * Calculate K invariant for monitoring.
   * K = x * y
   * 
   * This should never decrease after a valid swap.
   */
  calculateKInvariant(x: bigint, y: bigint): bigint {
    return this.calcK(x, y);
  }
}