// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, pureCircuits } from '../../contract/dist/managed/innermost/contract/index.js';
import * as ledgerLib from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js/contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { type FinalizedTxData, type MidnightProvider, type WalletProvider } from '@midnight-ntwrk/midnight-js/types';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
  type UnshieldedKeystore,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { type Logger } from 'pino';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';
import {
  type InnermostFXCircuits,
  type InnermostFXContract,
  InnermostFXPrivateStateId,
  type InnermostFXProviders,
  type DeployedInnermostFXContract,
  type InnermostFXPrivateState,
} from './common-types.js';
import { type Config, contractConfig } from './config.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js/utils';
import { getNetworkId } from '@midnight-ntwrk/midnight-js/network-id';
import { Buffer } from 'buffer';
import {
  MidnightBech32m,
  ShieldedAddress,
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import { witnesses, generateSecretKey, generateNonce } from './witnesses.js';
import type { WitnessState } from './witness-state.js';
import { saveWitnessState, loadWitnessState } from './witness-state.js';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

let logger: Logger;

// Required for GraphQL subscriptions (wallet sync) to work in Node.js
// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

// Pre-compile the InnermostFX contract with ZK circuit assets and witnesses
const innermostfxCompiledContract = CompiledContract.make('innermost', Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(contractConfig.zkConfigPath),
);

export interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ledgerLib.ZswapSecretKeys;
  dustSecretKey: ledgerLib.DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
}

export interface InnermostFXContractInstance {
  contract: DeployedInnermostFXContract;
  witnessState: WitnessState;
}

/**
 * Get InnermostFX ledger state
 */
export const getInnermostFXLedgerState = async (
  providers: InnermostFXProviders,
  contractAddress: ContractAddress,
): Promise<any> => {
  assertIsContractAddress(contractAddress);
  logger.info('Checking contract ledger state...');
  const state = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? ledger(contractState.data) : null));
  logger.info(`Ledger state: ${JSON.stringify(state, null, 2)}`);
  return state;
};

/**
 * Join an existing InnermostFX contract
 */
export const joinContract = async (
  providers: InnermostFXProviders,
  contractAddress: string,
): Promise<InnermostFXContractInstance> => {
  logger.info('Joining existing InnermostFX contract...');

  // Load witness state to get the secret key
  const witnessState = loadWitnessState();
  if (!witnessState || !witnessState.secretKey) {
    throw new Error('Witness state or secret key not found. Please deploy a new contract.');
  }

  // Create private state from stored secret key
  const privateState: InnermostFXPrivateState = {
    secretKey: Buffer.from(witnessState.secretKey, 'hex'),
  };

  const innermostfxContract = await findDeployedContract(providers, {
    contractAddress,
    compiledContract: innermostfxCompiledContract,
    privateStateId: InnermostFXPrivateStateId,
    initialPrivateState: privateState,
  });
  logger.info(`Joined contract at address: ${innermostfxContract.deployTxData.public.contractAddress}`);

  return { contract: innermostfxContract, witnessState };
};

/**
 * Deploy a new InnermostFX contract
 */
export const deploy = async (
  providers: InnermostFXProviders,
): Promise<InnermostFXContractInstance> => {
  logger.info('Deploying InnermostFX contract...');

  // Generate a random secret key for the dapp
  const secretKey = generateSecretKey();
  const privateState: InnermostFXPrivateState = {
    secretKey,
  };

  const innermostfxContract = await deployContract(providers, {
    privateStateId: InnermostFXPrivateStateId,
    compiledContract: innermostfxCompiledContract,
    initialPrivateState: privateState,
  });

  const contractAddress = innermostfxContract.deployTxData.public.contractAddress;
  logger.info(`Deployed contract at address: ${contractAddress}`);

  // Store witness state with secret key for reconnection
  const witnessState: WitnessState = {
    contractAddress,
    secretKey: toHex(secretKey),
  };
  saveWitnessState(witnessState);

  return { contract: innermostfxContract, witnessState };
};

/**
 * Sign all unshielded offers in a transaction's intents
 */
const signTransactionIntents = (
  tx: { intents?: Map<number, any> },
  signFn: (payload: Uint8Array) => ledgerLib.Signature,
  proofMarker: 'proof' | 'pre-proof',
): void => {
  if (!tx.intents || tx.intents.size === 0) return;

  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;

    const cloned = ledgerLib.Intent.deserialize<ledgerLib.SignatureEnabled, ledgerLib.Proofish, ledgerLib.PreBinding>(
      'signature',
      proofMarker,
      'pre-binding',
      intent.serialize(),
    );

    const sigData = cloned.signatureData(segment);
    const signature = signFn(sigData);

    if (cloned.fallibleUnshieldedOffer) {
      const sigs = cloned.fallibleUnshieldedOffer.inputs.map(
        (_: ledgerLib.UtxoSpend, i: number) => cloned.fallibleUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(sigs);
    }

    if (cloned.guaranteedUnshieldedOffer) {
      const sigs = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_: ledgerLib.UtxoSpend, i: number) => cloned.guaranteedUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(sigs);
    }

    tx.intents.set(segment, cloned);
  }
};

/**
 * Create the unified WalletProvider & MidnightProvider for midnight-js
 */
export const createWalletAndMidnightProvider = async (
  ctx: WalletContext,
): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(ctx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  return {
    getCoinPublicKey() {
      return state.shielded.coinPublicKey.toHexString();
    },
    getEncryptionPublicKey() {
      return state.shielded.encryptionPublicKey.toHexString();
    },
    async balanceTx(tx, ttl?) {
      const recipe = await ctx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );

      const signFn = (payload: Uint8Array) => ctx.unshieldedKeystore.signData(payload);
      signTransactionIntents(recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction) {
        signTransactionIntents(recipe.balancingTransaction, signFn, 'pre-proof');
      }

      return ctx.wallet.finalizeRecipe(recipe);
    },
    submitTx(tx) {
      return ctx.wallet.submitTransaction(tx) as any;
    },
  };
};

/** Wait until the wallet has fully synced with the network */
export const waitForSync = (wallet: WalletFacade) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((state) => state.isSynced),
    ),
  );

/** Wait until the wallet has a non-zero unshielded balance */
export const waitForFunds = (wallet: WalletFacade): Promise<bigint> =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.filter((state) => state.isSynced),
      Rx.map((s) => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
      Rx.filter((balance) => balance > 0n),
    ),
  );

const buildShieldedConfig = ({ indexer, indexerWS, node, proofServer }: Config) => ({
  networkId: getNetworkId(),
  indexerClientConnection: {
    indexerHttpUrl: indexer,
    indexerWsUrl: indexerWS,
  },
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(node.replace(/^http/, 'ws')),
});

const buildUnshieldedConfig = ({ indexer, indexerWS }: Config) => ({
  networkId: getNetworkId(),
  indexerClientConnection: {
    indexerHttpUrl: indexer,
    indexerWsUrl: indexerWS,
  },
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
});

const buildDustConfig = ({ indexer, indexerWS, node, proofServer }: Config) => ({
  networkId: getNetworkId(),
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
  indexerClientConnection: {
    indexerHttpUrl: indexer,
    indexerWsUrl: indexerWS,
  },
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(node.replace(/^http/, 'ws')),
});

/**
 * Derive HD wallet keys for all three roles from a hex-encoded seed
 */
const deriveKeysFromSeed = (seed: string) => {
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
 * Formats a token balance for display
 */
const formatBalance = (balance: bigint): string => balance.toLocaleString();

/**
 * Runs an async operation with an animated spinner on the console
 */
export const withStatus = async <T>(message: string, fn: () => Promise<T>): Promise<T> => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r  ${frames[i++ % frames.length]} ${message}`);
  }, 80);
  try {
    const result = await fn();
    clearInterval(interval);
    process.stdout.write(`\r  ✓ ${message}\n`);
    return result;
  } catch (e) {
    clearInterval(interval);
    process.stdout.write(`\r  ✗ ${message}\n`);
    throw e;
  }
};

/**
 * Register unshielded NIGHT UTXOs for dust generation
 */
const registerForDustGeneration = async (
  wallet: WalletFacade,
  unshieldedKeystore: UnshieldedKeystore,
): Promise<void> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));

  if (state.dust.availableCoins.length > 0) {
    const dustBal = state.dust.balance(new Date());
    console.log(`  ✓ Dust tokens already available (${formatBalance(dustBal)} DUST)`);
    return;
  }

  const nightUtxos = state.unshielded.availableCoins.filter(
    (coin: any) => coin.meta?.registeredForDustGeneration !== true,
  );
  if (nightUtxos.length === 0) {
    await withStatus('Waiting for dust tokens to generate', () =>
      Rx.firstValueFrom(
        wallet.state().pipe(
          Rx.throttleTime(5_000),
          Rx.filter((s) => s.isSynced),
          Rx.filter((s) => s.dust.balance(new Date()) > 0n),
        ),
      ),
    );
    return;
  }

  await withStatus(`Registering ${nightUtxos.length} NIGHT UTXO(s) for dust generation`, async () => {
    const recipe = await wallet.registerNightUtxosForDustGeneration(
      nightUtxos,
      unshieldedKeystore.getPublicKey(),
      (payload) => unshieldedKeystore.signData(payload),
    );
    const finalized = await wallet.finalizeRecipe(recipe);
    await wallet.submitTransaction(finalized);
  });

  await withStatus('Waiting for dust tokens to generate', () =>
    Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(5_000),
        Rx.filter((s) => s.isSynced),
        Rx.filter((s) => s.dust.balance(new Date()) > 0n),
      ),
    ),
  );
};

/**
 * Prints a formatted wallet summary to the console
 */
const printWalletSummary = (state: any, unshieldedKeystore: UnshieldedKeystore) => {
  const networkId = getNetworkId();
  const unshieldedBalance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;

  const coinPubKey = ShieldedCoinPublicKey.fromHexString(state.shielded.coinPublicKey.toHexString());
  const encPubKey = ShieldedEncryptionPublicKey.fromHexString(state.shielded.encryptionPublicKey.toHexString());
  const shieldedAddress = MidnightBech32m.encode(networkId, new ShieldedAddress(coinPubKey, encPubKey)).toString();

  const DIV = '──────────────────────────────────────────────────────────────';

  console.log(`
${DIV}
  Wallet Overview                            Network: ${networkId}
${DIV}

  Shielded (ZSwap)
  └─ Address: ${shieldedAddress}

  Unshielded
  ├─ Address: ${unshieldedKeystore.getBech32Address()}
  └─ Balance: ${formatBalance(unshieldedBalance)} tNight

  Dust
  └─ Address: ${MidnightBech32m.encode(networkId, state.dust.address).toString()}

${DIV}`);
};

/**
 * Build (or restore) a wallet from a hex seed
 */
export const buildWalletAndWaitForFunds = async (config: Config, seed: string): Promise<WalletContext> => {
  console.log('');

  const { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore } = await withStatus(
    'Building wallet',
    async () => {
      const keys = deriveKeysFromSeed(seed);
      const shieldedSecretKeys = ledgerLib.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
      const dustSecretKey = ledgerLib.DustSecretKey.fromSeed(keys[Roles.Dust]);
      const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

      const walletConfig = {
        ...buildShieldedConfig(config),
        ...buildUnshieldedConfig(config),
        ...buildDustConfig(config),
      };
      const wallet = await WalletFacade.init({
        configuration: walletConfig,
        shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
        unshielded: (cfg) => UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
        dust: (cfg) =>
          DustWallet(cfg).startWithSecretKey(dustSecretKey, ledgerLib.LedgerParameters.initialParameters().dust),
      });
      await wallet.start(shieldedSecretKeys, dustSecretKey);

      return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
    },
  );

  const networkId = getNetworkId();
  const DIV = '──────────────────────────────────────────────────────────────';
  console.log(`
${DIV}
  Wallet Overview                            Network: ${networkId}
${DIV}
  Unshielded Address (send tNight here):
  ${unshieldedKeystore.getBech32Address()}

  Fund your wallet with tNight from the Preprod faucet:
  https://faucet.preprod.midnight.network/
${DIV}
  `);

  const syncedState = await withStatus('Syncing with network', () => waitForSync(wallet));

  printWalletSummary(syncedState, unshieldedKeystore);

  const balance = syncedState.unshielded.balances[unshieldedToken().raw] ?? 0n;
  if (balance === 0n) {
    const fundedBalance = await withStatus('Waiting for incoming tokens', () => waitForFunds(wallet));
    console.log(`    Balance: ${formatBalance(fundedBalance)} tNight\n`);
  }

  await registerForDustGeneration(wallet, unshieldedKeystore);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
};

/**
 * Create a fresh wallet with a randomly generated seed
 */
export const buildFreshWallet = async (config: Config): Promise<WalletContext> => {
  const seed = toHex(Buffer.from(generateRandomSeed()));
  const DIV = '──────────────────────────────────────────────────────────────';
  console.log(`
${DIV}
  New Wallet Seed — save this before continuing
${DIV}
  ${seed}
${DIV}
  `);
  return await buildWalletAndWaitForFunds(config, seed);
};

/**
 * Configure all midnight-js providers needed for contract deployment and interaction
 */
export const configureProviders = async (ctx: WalletContext, config: Config) => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(ctx);
  const zkConfigProvider = new NodeZkConfigProvider<InnermostFXCircuits>(contractConfig.zkConfigPath);
  const accountId = walletAndMidnightProvider.getCoinPublicKey();
  const storagePassword = `${Buffer.from(accountId, 'hex').toString('base64')}!`;
  return {
    privateStateProvider: levelPrivateStateProvider<typeof InnermostFXPrivateStateId>({
      privateStateStoreName: contractConfig.privateStateStoreName,
      accountId,
      privateStoragePasswordProvider: () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};

/**
 * Get the current DUST balance from the wallet state
 */
export const getDustBalance = async (
  wallet: WalletFacade,
): Promise<{ available: bigint; pending: bigint; availableCoins: number; pendingCoins: number }> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  const available = state.dust.balance(new Date());
  const availableCoins = state.dust.availableCoins.length;
  const pendingCoins = state.dust.pendingCoins.length;
  const pending = state.dust.pendingCoins.reduce((sum, c) => sum + c.initialValue, 0n);
  return { available, pending, availableCoins, pendingCoins };
};

/**
 * Monitor DUST balance with a live-updating display
 */
export const monitorDustBalance = async (wallet: WalletFacade, stopSignal: Promise<void>): Promise<void> => {
  let stopped = false;
  void stopSignal.then(() => {
    stopped = true;
  });

  const sub = wallet
    .state()
    .pipe(
      Rx.throttleTime(5_000),
      Rx.filter((s) => s.isSynced),
    )
    .subscribe((state) => {
      if (stopped) return;

      const now = new Date();
      const available = state.dust.balance(now);
      const availableCoins = state.dust.availableCoins.length;
      const pendingCoins = state.dust.pendingCoins.length;

      const registeredNight = state.unshielded.availableCoins.filter(
        (coin: any) => coin.meta?.registeredForDustGeneration === true,
      ).length;
      const totalNight = state.unshielded.availableCoins.length;

      let status = '';
      if (pendingCoins > 0 && availableCoins === 0) {
        status = '⚠ locked by pending tx';
      } else if (available > 0n) {
        status = '✓ ready to deploy';
      } else if (availableCoins > 0) {
        status = 'accruing...';
      } else if (registeredNight > 0) {
        status = 'waiting for generation...';
      } else {
        status = 'no NIGHT registered';
      }

      const time = now.toLocaleTimeString();
      console.log(
        `  [${time}] DUST: ${formatBalance(available)} (${availableCoins} coins, ${pendingCoins} pending) | NIGHT: ${totalNight} UTXOs, ${registeredNight} registered | ${status}`,
      );
    });

  await stopSignal;
  sub.unsubscribe();
};

/**
 * Set the logger instance
 */
export function setLogger(_logger: Logger): void {
  logger = _logger;
}

/**
 * Get contract state from InnermostFX contract
 */
export const getContractState = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
): Promise<any> => {
  const state = await getInnermostFXLedgerState(providers, contract.deployTxData.public.contractAddress);
  return state;
};

/**
 * Helper to get shielded coin public key from wallet
 */
const getShieldedPublicKey = async (wallet: WalletFacade): Promise<string> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  return state.shielded.coinPublicKey.toHexString();
};

/**
 * Mint USD tokens to shielded address
 */
export const mintUSD = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  amount: bigint,
  nonce?: Uint8Array,
): Promise<void> => {
  const actualNonce = nonce || generateNonce();
  const recipient = providers.walletProvider.getCoinPublicKey();
  
  await withStatus('Minting USD tokens', () =>
    (contract as any).circuits.mintUSD(
      amount,
      { left: { bytes: Buffer.from(recipient, 'hex') } },
      actualNonce,
    ),
  );
  logger.info(`Minted ${amount.toLocaleString()} USD tokens`);
};

/**
 * Mint EUR tokens to shielded address
 */
export const mintEUR = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  amount: bigint,
  nonce?: Uint8Array,
): Promise<void> => {
  const actualNonce = nonce || generateNonce();
  const recipient = providers.walletProvider.getCoinPublicKey();
  
  await withStatus('Minting EUR tokens', () =>
    (contract as any).circuits.mintEUR(
      amount,
      { left: { bytes: Buffer.from(recipient, 'hex') } },
      actualNonce,
    ),
  );
  logger.info(`Minted ${amount.toLocaleString()} EUR tokens`);
};

/**
 * Mint JPY tokens to shielded address
 */
export const mintJPY = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  amount: bigint,
  nonce?: Uint8Array,
): Promise<void> => {
  const actualNonce = nonce || generateNonce();
  const recipient = providers.walletProvider.getCoinPublicKey();
  
  await withStatus('Minting JPY tokens', () =>
    (contract as any).circuits.mintJPY(
      amount,
      { left: { bytes: Buffer.from(recipient, 'hex') } },
      actualNonce,
    ),
  );
  logger.info(`Minted ${amount.toLocaleString()} JPY tokens`);
};

/**
 * Create a single order
 */
export const createOrder = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  pair: Uint8Array,
  direction: Uint8Array,
  price: bigint,
  amount: bigint,
  nonce?: Uint8Array,
): Promise<void> => {
  const actualNonce = nonce || generateNonce();
  
  await withStatus('Creating order', () =>
    (contract as any).circuits.createOrder(pair, direction, price, amount, actualNonce),
  );
  logger.info(`Order created: pair=${toHex(pair)}, direction=${toHex(direction)}, price=${price}, amount=${amount}`);
};

/**
 * Create 2 orders in batch
 */
export const createOrderBatch2 = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  orders: Array<{
    pair: Uint8Array;
    direction: Uint8Array;
    price: bigint;
    amount: bigint;
    nonce: Uint8Array;
  }>,
): Promise<void> => {
  await withStatus('Creating batch of 2 orders', () =>
    (contract as any).circuits.batchCreateOrders2(
      orders[0].pair, orders[0].direction, orders[0].price, orders[0].amount, orders[0].nonce,
      orders[1].pair, orders[1].direction, orders[1].price, orders[1].amount, orders[1].nonce,
    ),
  );
  logger.info(`Batch of 2 orders created`);
};

/**
 * Create 4 orders in batch
 */
export const createOrderBatch4 = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  orders: Array<{
    pair: Uint8Array;
    direction: Uint8Array;
    price: bigint;
    amount: bigint;
    nonce: Uint8Array;
  }>,
): Promise<void> => {
  await withStatus('Creating batch of 4 orders', () =>
    (contract as any).circuits.batchCreateOrders4(
      orders[0].pair, orders[0].direction, orders[0].price, orders[0].amount, orders[0].nonce,
      orders[1].pair, orders[1].direction, orders[1].price, orders[1].amount, orders[1].nonce,
      orders[2].pair, orders[2].direction, orders[2].price, orders[2].amount, orders[2].nonce,
      orders[3].pair, orders[3].direction, orders[3].price, orders[3].amount, orders[3].nonce,
    ),
  );
  logger.info(`Batch of 4 orders created`);
};

/**
 * Cancel an order with refund
 */
export const cancelOrder = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  orderId: Uint8Array,
  pair: Uint8Array,
  direction: Uint8Array,
  price: bigint,
  amount: bigint,
  nonce: Uint8Array,
  refundNonce: Uint8Array,
): Promise<void> => {
  await withStatus('Cancelling order', () =>
    (contract as any).circuits.cancelOrder(orderId, pair, direction, price, amount, nonce, refundNonce),
  );
  logger.info(`Order cancelled: ${toHex(orderId)}`);
};

/**
 * Match two orders
 */
export const matchOrders = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  bidOrderId: Uint8Array,
  askOrderId: Uint8Array,
  matchAmount: bigint,
  bidPair: Uint8Array,
  bidPrice: bigint,
  bidAmount: bigint,
  bidNonce: Uint8Array,
  askPair: Uint8Array,
  askPrice: bigint,
  askAmount: bigint,
  askNonce: Uint8Array,
  bidRemainderNonce: Uint8Array,
  askRemainderNonce: Uint8Array,
  settlementNonce: Uint8Array,
): Promise<void> => {
  await withStatus('Matching orders', () =>
    (contract as any).circuits.matchOrders(
      bidOrderId, askOrderId, matchAmount,
      bidPair, bidPrice, bidAmount, bidNonce,
      askPair, askPrice, askAmount, askNonce,
      bidRemainderNonce, askRemainderNonce, settlementNonce,
    ),
  );
  logger.info(`Orders matched: bid=${toHex(bidOrderId)}, ask=${toHex(askOrderId)}, amount=${matchAmount}`);
};

