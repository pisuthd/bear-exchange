// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0
 

/**
 * Generates a random nonce for replay protection.
 * 
 * @returns A 32-byte random nonce
 */
export function generateNonce(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}
