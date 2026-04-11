// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import path from 'node:path';
import { contractConfig } from '../config.js';

export interface WitnessState {
  contractAddress: string;
  secretKey?: string;  // Hex-encoded secret key for reconnection
}

const WITNESS_STATE_DIR = path.dirname(contractConfig.witnessStatePath);
const WITNESS_STATE_FILE = contractConfig.witnessStatePath;

/**
 * Ensure witness state directory exists
 */
export function ensureWitnessStateDir(): void {
  if (!fs.existsSync(WITNESS_STATE_DIR)) {
    fs.mkdirSync(WITNESS_STATE_DIR, { recursive: true });
  }
}

/**
 * Load witness state from local file
 */
export function loadWitnessState(): WitnessState | null {
  try {
    if (!fs.existsSync(WITNESS_STATE_FILE)) {
      return null;
    }

    const data = fs.readFileSync(WITNESS_STATE_FILE, 'utf-8');
    const state = JSON.parse(data) as WitnessState;

    return state;
  } catch (error) {
    console.error('Failed to load witness state:', error);
    return null;
  }
}

/**
 * Save witness state to local file
 */
export function saveWitnessState(state: WitnessState): void {
  try {
    ensureWitnessStateDir();

    const data = JSON.stringify({
      contractAddress: state.contractAddress,
      secretKey: state.secretKey
    }, null, 2);

    fs.writeFileSync(WITNESS_STATE_FILE, data, 'utf-8');
  } catch (error) {
    console.error('Failed to save witness state:', error);
    throw error;
  }
}

/**
 * Delete witness state file
 */
export function deleteWitnessState(): void {
  try {
    if (fs.existsSync(WITNESS_STATE_FILE)) {
      fs.unlinkSync(WITNESS_STATE_FILE);
    }
  } catch (error) {
    console.error('Failed to delete witness state:', error);
    throw error;
  }
}

/**
 * Check if witness state exists
 */
export function witnessStateExists(): boolean {
  return fs.existsSync(WITNESS_STATE_FILE);
}

/**
 * Get witness state file path
 */
export function getWitnessStatePath(): string {
  return WITNESS_STATE_FILE;
}