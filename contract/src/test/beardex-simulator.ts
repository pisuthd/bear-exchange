// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

  import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger
} from "../managed/beardex/contract/index.js";
import { witnesses } from "../witnesses.js";

// Private state type (empty for BearDEX)
export type BearDEXPrivateState = unknown;

// Helper to create contract address (right side of Either) - exactly 32 bytes
const contractAddress = () => {
  const addr = sampleContractAddress();
  const bytes = new TextEncoder().encode(addr);
  // Ensure exactly 32 bytes by truncating or padding
  const result = new Uint8Array(32);
  result.set(bytes.slice(0, 32));
  return {
    is_left: false as const,
    left: { bytes: new Uint8Array(32) },
    right: { bytes: result }
  };
};

// Helper to create nonce
const createNonce = (seed: string): Uint8Array => 
  new TextEncoder().encode(seed.padEnd(32, '0').substring(0, 32));

// Minimal simulator for BearDEX testing
export class BearDEXSimulator {
  readonly contract: Contract<BearDEXPrivateState>;
  circuitContext: CircuitContext<BearDEXPrivateState>;

  constructor() {
    this.contract = new Contract<BearDEXPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState
    } = this.contract.initialState(
      createConstructorContext({} as BearDEXPrivateState, "0".repeat(64))
    );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): BearDEXPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  // Mint USD tokens
  public mintUSD(amount: bigint, nonce: string): Ledger {
    this.circuitContext = this.contract.impureCircuits.mintUSD(
      this.circuitContext,
      amount,
      contractAddress(),
      createNonce(nonce)
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  // Initialize USD/JPY pool
  public initLiquidityUSDJPY(
    xIn: bigint,
    yIn: bigint,
    lpOut: bigint,
    nonce: string
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.initLiquidityUSDJPY(
      this.circuitContext,
      xIn,
      yIn,
      lpOut,
      contractAddress(),
      createNonce(nonce)
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  // Add liquidity to USD/JPY pool
  public addLiquidityUSDJPY(
    xIn: bigint,
    yIn: bigint,
    lpOut: bigint,
    nonce: string
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.addLiquidityUSDJPY(
      this.circuitContext,
      xIn,
      yIn,
      lpOut,
      contractAddress(),
      createNonce(nonce)
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  // Swap USD for JPY
  public swapUSDToJPY(
    xIn: bigint,
    xFee: bigint,
    yOut: bigint,
    nonce: string
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.swapUSDToJPY(
      this.circuitContext,
      xIn,
      xFee,
      yOut,
      contractAddress(),
      createNonce(nonce)
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  // Update oracle prices
  public updateOraclePrices(
    usdJpyPrice: bigint,
    usdEurPrice: bigint
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.updateOraclePrices(
      this.circuitContext,
      usdJpyPrice,
      usdEurPrice
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}