// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

import 'dotenv/config';
import path from 'node:path';
import { setNetworkId } from '@midnight-ntwrk/midnight-js/network-id';

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export const contractConfig = {
  privateStateStoreName: 'innermostfx-private-state',
  zkConfigPath: path.resolve(currentDir, '..', '..', 'contract', 'dist', 'managed', 'innermost'),
  witnessStatePath: path.resolve(process.env.HOME || '.', '.innermostfx', 'witnesses.json'),
};

export interface Config {
  readonly logDir: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

export class PreprodConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'preprod', `${new Date().toISOString()}.log`);
  indexer = 'https://indexer.preprod.midnight.network/api/v3/graphql';
  indexerWS = 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws';
  node = 'https://rpc.preprod.midnight.network';
  proofServer = 'http://127.0.0.1:6300';
  networkId = 'preprod';
  constructor() {
    setNetworkId('preprod');
  }
}

export const apiConfig = {
  port: 3000,
  corsOrigins: ['*'],
  databasePath: path.join(process.cwd(), 'database', 'innermostfx.db'),
  // Wallet configuration
  wallet: {
    // Set to true to create a new wallet on startup
    // Set to false to import existing wallet from seed
    createNew: process.env.CREATE_NEW_WALLET !== 'false',
    // Seed for existing wallet (only used if createNew is false)
    seed: process.env.WALLET_SEED || '',
    // Path to store wallet seed
    seedPath: path.join(process.cwd(), 'database', 'wallet-seed.txt'),
  },
  // Contract configuration
  contract: {
    // Contract address to join (if not deploying new contract)
    address: process.env.CONTRACT_ADDRESS || '',
    // Deploy new contract on startup if no contract exists
    deployNew: process.env.DEPLOY_NEW_CONTRACT === 'true',
  },
};

// Initialize config on import
new PreprodConfig();