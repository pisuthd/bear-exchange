// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0
/**
 * Generates a random nonce for replay protection.
 *
 * @returns A 32-byte random nonce
 */
export function generateNonce() {
    return crypto.getRandomValues(new Uint8Array(32));
}
/**
 * Generates a random secret key for the dapp.
 *
 * @returns A 32-byte random secret key
 */
export function generateSecretKey() {
    return crypto.getRandomValues(new Uint8Array(32));
}
/**
 * Witness functions for InnermostFX contract
 * Based on the RWA-API pattern, witnesses provide access to private state
 * during ZK proof generation.
 */
export const witnesses = {
    /**
     * Returns the caller's secret key from private state
     * This is used for bid operations and ownership verification
     */
    localSk: (context) => {
        return [context.privateState, context.privateState.secretKey];
    },
    /**
     * Returns the ask party's secret key for order matching
     * In production, this would come from multi-party proof composition
     */
    askSk: (context) => {
        return [context.privateState, context.privateState.secretKey];
    },
    /**
     * Performs off-chain integer division for quoteCost calculations
     * Returns floor(numerator / denominator)
     */
    witDivide: (context, numerator, denominator) => {
        const result = numerator / denominator;
        return [context.privateState, result];
    },
};
//# sourceMappingURL=witnesses.js.map