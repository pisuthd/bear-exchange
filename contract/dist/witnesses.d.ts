import { Ledger } from './managed/innermost/contract/index.js';
import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
/**
 * Generates a random nonce for replay protection.
 *
 * @returns A 32-byte random nonce
 */
export declare function generateNonce(): Uint8Array;
/**
 * Generates a random secret key for the dapp.
 *
 * @returns A 32-byte random secret key
 */
export declare function generateSecretKey(): Uint8Array;
/**
 * Witness functions for InnermostFX contract
 * Based on the RWA-API pattern, witnesses provide access to private state
 * during ZK proof generation.
 */
export declare const witnesses: {
    /**
     * Returns the caller's secret key from private state
     * This is used for bid operations and ownership verification
     */
    readonly localSk: (context: WitnessContext<Ledger, InnermostFXPrivateState>) => [InnermostFXPrivateState, Uint8Array];
    /**
     * Returns the ask party's secret key for order matching
     * In production, this would come from multi-party proof composition
     */
    readonly askSk: (context: WitnessContext<Ledger, InnermostFXPrivateState>) => [InnermostFXPrivateState, Uint8Array];
    /**
     * Performs off-chain integer division for quoteCost calculations
     * Returns floor(numerator / denominator)
     */
    readonly witDivide: (context: WitnessContext<Ledger, InnermostFXPrivateState>, numerator: bigint, denominator: bigint) => [InnermostFXPrivateState, bigint];
};
/**
 * Private state contains the dapp's secret key
 * This key is used to derive the public key that's stored in the contract
 */
export type InnermostFXPrivateState = {
    readonly secretKey: Uint8Array;
};
