  // This file is part of bear-exchange.
  // SPDX-License-Identifier: Apache-2.0

  import { Ledger } from '../../contract/src/managed/beardex/contract/index.js';
  import { WitnessContext } from '@midnight-ntwrk/compact-runtime';

  /**
   * Generates a random nonce for replay protection.
   * 
   * @returns A 32-byte random nonce
   */
  export function generateNonce(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  /**
   * Generates a random secret key for the dapp.
   * 
   * @returns A 32-byte random secret key
   */
  export function generateSecretKey(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  /**
   * Witness functions for BearDEX contract
   * Based on the RWA-API pattern, witnesses provide access to private state
   * during ZK proof generation.
   */
  export const witnesses = {
    /**
     * Returns the USD reserve balance from private state
     * Currently returns 0 as reserves are public
     */
    localReserveUSD: (context: WitnessContext<Ledger, BearDEXPrivateState>): 
        [BearDEXPrivateState, bigint] => {
      return [context.privateState, 0n];
    },

    /**
     * Returns the JPY reserve balance from private state
     * Currently returns 0 as reserves are public
     */
    localReserveJPY: (context: WitnessContext<Ledger, BearDEXPrivateState>): 
        [BearDEXPrivateState, bigint] => {
      return [context.privateState, 0n];
    },

    /**
     * Returns the dapp's secret key from private state
     * This is critical for deriving the dapp public key used in contract
     */
    localSk: (context: WitnessContext<Ledger, BearDEXPrivateState>): 
        [BearDEXPrivateState, Uint8Array] => {
      return [context.privateState, context.privateState.secretKey];
    },
  } as const;

  /**
   * Private state contains the dapp's secret key
   * This key is used to derive the public key that's stored in the contract
   */
  export type BearDEXPrivateState = {
    readonly secretKey: Uint8Array;
  };
