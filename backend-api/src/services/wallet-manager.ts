// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

import * as ledgerLib from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  PublicKey,
  UnshieldedWallet,
  type UnshieldedKeystore,
  InMemoryTransactionHistoryStorage,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { getNetworkId } from '@midnight-ntwrk/midnight-js/network-id';
import { PreprodConfig, apiConfig } from '../config.js';
import { registerForDustGeneration, waitForFunds } from '../contract/api.js';
import { db } from './database.js';
import fs from 'node:fs';
import path from 'node:path';
import * as Rx from 'rxjs';

export interface WalletInfo {
  id: number;
  seed: string;
  shieldedAddress: string;
  unshieldedAddress: string;
  dustAddress: string;
  created_at: string;
}

export interface Balances {
  shielded: { USD: bigint; EUR: bigint; JPY: bigint };
  unshielded: bigint;
  dust: bigint;
}

export interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ledgerLib.ZswapSecretKeys;
  dustSecretKey: ledgerLib.DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
}

class WalletManager {
  private ctx: WalletContext | null = null;
  private isInitialized = false;

  /**
   * Derive HD wallet keys for all three roles from a hex-encoded seed
   */
  private deriveKeysFromSeed = (seed: string) => {
    const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
    if (hdWallet.type !== 'seedOk') {
      throw new Error('Failed to initialize HDWallet from seed');
    }

    const derivationResult = hdWallet.hdWallet
      .selectAccount(0)
      .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
      .deriveKeysAt(0);

    if (derivationResult.type !== 'keysDerived') {
      throw new Error('Failed to derive keys');
    }

    hdWallet.hdWallet.clear();
    return derivationResult.keys;
  };

  /**
   * Initialize wallet on server startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Wallet already initialized');
      return;
    }

    console.log('Initializing wallet...');

    const config = new PreprodConfig();
    
    // Check if we should create new wallet or import existing
    let seed: string;
    
    if (apiConfig.wallet.createNew) {
      // Create new wallet
      console.log('Creating new wallet...');
      const randomSeed = generateRandomSeed();
      seed = Buffer.from(randomSeed).toString('hex');
      
      // Save seed to file for persistence
      fs.mkdirSync(path.dirname(apiConfig.wallet.seedPath), { recursive: true });
      fs.writeFileSync(apiConfig.wallet.seedPath, seed, 'utf-8');
      console.log(`New wallet seed saved to: ${apiConfig.wallet.seedPath}`);
    } else {
      // Import existing wallet
      if (apiConfig.wallet.seed) {
        console.log('Importing wallet from environment variable...');
        seed = apiConfig.wallet.seed;
      } else if (fs.existsSync(apiConfig.wallet.seedPath)) {
        console.log(`Importing wallet from file: ${apiConfig.wallet.seedPath}`);
        seed = fs.readFileSync(apiConfig.wallet.seedPath, 'utf-8');
      } else {
        throw new Error('No wallet seed provided. Set WALLET_SEED environment variable or ensure seed file exists.');
      }
    }

    // Derive keys from seed
    console.log('Deriving wallet keys...');
    const keys = this.deriveKeysFromSeed(seed);
    const shieldedSecretKeys = ledgerLib.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
    const dustSecretKey = ledgerLib.DustSecretKey.fromSeed(keys[Roles.Dust]);
    const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

    // Build wallet configuration
    console.log('Building wallet configuration...');
    const walletConfig = {
      networkId: getNetworkId(),
      indexerClientConnection: {
        indexerHttpUrl: config.indexer,
        indexerWsUrl: config.indexerWS,
      },
      provingServerUrl: new URL(config.proofServer),
      relayURL: new URL(config.node.replace(/^http/, 'ws')),
      costParameters: {
        additionalFeeOverhead: 300_000_000_000_000n,
        feeBlocksMargin: 5,
      },
      txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    };

    // Initialize wallet
    console.log('Initializing wallet...');
    const wallet = await WalletFacade.init({
      configuration: walletConfig,
      shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
      unshielded: (cfg) => UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
      dust: (cfg) =>
        DustWallet(cfg).startWithSecretKey(dustSecretKey, ledgerLib.LedgerParameters.initialParameters().dust),
    });
    await wallet.start(shieldedSecretKeys, dustSecretKey);

    // Get wallet addresses
    const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
    const shieldedAddress = state.shielded.coinPublicKey.toHexString();
    const unshieldedAddress = unshieldedKeystore.getBech32Address().toString();
    const dustAddress = state.dust.address.toString() as string;

    console.log(`Wallet initialized:`);
    console.log(`  Shielded Address: ${shieldedAddress}`);
    console.log(`  Unshielded Address: ${unshieldedAddress}`);
    console.log(`  Dust Address: ${dustAddress}`);

    // Save wallet to database only if it doesn't exist
    const existingWallet = db.getLatestWallet();
    if (!existingWallet || existingWallet.seed !== seed) {
      db.saveWallet({
        seed,
        shieldedAddress,
        unshieldedAddress,
        dustAddress,
      });
      console.log('Wallet saved to database');
    } else {
      console.log('Wallet already exists in database, skipping save');
    }

    this.ctx = {
      wallet,
      shieldedSecretKeys,
      dustSecretKey,
      unshieldedKeystore,
    };

    // Check for funds (matching CLI flow)
    const syncedState = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
    const unshieldedBalance = syncedState.unshielded.balances[unshieldedToken().raw] ?? 0n;
    if (unshieldedBalance === 0n) {
      console.log('No unshielded funds detected, waiting for funds...');
      await waitForFunds(wallet);
      console.log('Funds received');
    } else {
      console.log(`Unshielded balance: ${unshieldedBalance}`);
    }

    // Register UTXOs for dust generation (critical for paying transaction fees)
    console.log('Registering for dust generation...');
    await registerForDustGeneration(wallet, unshieldedKeystore);
    console.log('Dust generation registered');

    this.isInitialized = true;
    console.log('Wallet initialization complete');
  }

  /**
   * Wait for wallet to sync with network
   */
  async waitForSync(): Promise<void> {
    if (!this.ctx) {
      throw new Error('Wallet not initialized');
    }

    console.log('Waiting for wallet to sync...');
    await Rx.firstValueFrom(
      this.ctx.wallet.state().pipe(
        Rx.throttleTime(2_000),
        Rx.filter((state: any) => state.isSynced),
      ),
    );
    console.log('Wallet synced');
  }

  /**
   * Get wallet context
   */
  getWalletContext(): WalletContext {
    if (!this.ctx) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }
    return this.ctx;
  }

  /**
   * Check if wallet is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.ctx !== null;
  }

  /**
   * Get shielded token balances for USD, EUR, JPY
   */
  async getBalances(): Promise<Balances> {
    if (!this.ctx) {
      throw new Error('Wallet not initialized');
    }

    const state = await Rx.firstValueFrom(this.ctx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
    
    // Token colors from CLI
    const TOKEN_COLORS = {
      USD: '50438fab45db36f4dd0e622c65212fd3dc02e868d1cd429eac61c4dfa77c32e1',
      EUR: '83363546497e9db339b499268eabed92521a4558a27a5337bcf0fee689013780',
      JPY: 'a136e50f63889250cd276e0f9767ecac7b0f9a18ec06d44f23621cf7b57870d9'
    } as const;
    
    const balances: any = state.shielded.balances;
    const balanceUSD = (balances[TOKEN_COLORS.USD] as bigint) ?? 0n;
    const balanceEUR = (balances[TOKEN_COLORS.EUR] as bigint) ?? 0n;
    const balanceJPY = (balances[TOKEN_COLORS.JPY] as bigint) ?? 0n;
    
    const unshieldedBalance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    const dustBalance = state.dust.balance(new Date());
    
    return {
      shielded: {
        USD: balanceUSD,
        EUR: balanceEUR,
        JPY: balanceJPY,
      },
      unshielded: unshieldedBalance,
      dust: dustBalance,
    };
  }

  /**
   * Get wallet info
   */
  getWalletInfo(): WalletInfo {
    const wallet = db.getLatestWallet();
    if (!wallet) {
      throw new Error('No wallet found in database');
    }
    return wallet;
  }
}

// Singleton instance
export const walletManager = new WalletManager();