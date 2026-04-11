// This file is part of bear-exchange.
// SPDX-License-Identifier: Apache-2.0

import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, pureCircuits } from '../../../contract/dist/managed/innermost/contract/index.js';
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
import { type Config, contractConfig } from '../config.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js/utils';
import { getNetworkId } from '@midnight-ntwrk/midnight-js/network-id';
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

// Required for GraphQL subscriptions (wallet sync) to work in Node.js
globalThis.WebSocket = WebSocket as any;

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
 * Join an existing InnermostFX contract
 */
export const joinContract = async (
  providers: InnermostFXProviders,
  contractAddress: string,
): Promise<InnermostFXContractInstance> => {
  const witnessState = loadWitnessState();
  if (!witnessState || !witnessState.secretKey) {
    throw new Error('Witness state or secret key not found. Please deploy a new contract.');
  }

  const privateState: InnermostFXPrivateState = {
    secretKey: Buffer.from(witnessState.secretKey, 'hex'),
  };

  const innermostfxContract = await findDeployedContract(providers, {
    contractAddress,
    compiledContract: innermostfxCompiledContract,
    privateStateId: InnermostFXPrivateStateId,
    initialPrivateState: privateState,
  });

  return { contract: innermostfxContract, witnessState };
};

/**
 * Deploy a new InnermostFX contract
 */
export const deploy = async (
  providers: InnermostFXProviders,
): Promise<InnermostFXContractInstance> => {
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

  const witnessState: WitnessState = {
    contractAddress,
    secretKey: toHex(secretKey),
  };
  saveWitnessState(witnessState);

  return { contract: innermostfxContract, witnessState };
};

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

export const waitForSync = (wallet: WalletFacade) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((state) => state.isSynced),
    ),
  );

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

export const registerForDustGeneration = async (
  wallet: WalletFacade,
  unshieldedKeystore: UnshieldedKeystore,
): Promise<void> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));

  if (state.dust.availableCoins.length > 0) {
    return;
  }

  const nightUtxos = state.unshielded.availableCoins.filter(
    (coin: any) => coin.meta?.registeredForDustGeneration !== true,
  );
  if (nightUtxos.length === 0) {
    await Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(5_000),
        Rx.filter((s) => s.isSynced),
        Rx.filter((s) => s.dust.balance(new Date()) > 0n),
      ),
    );
    return;
  }

  const recipe = await wallet.registerNightUtxosForDustGeneration(
    nightUtxos,
    unshieldedKeystore.getPublicKey(),
    (payload) => unshieldedKeystore.signData(payload),
  );
  const finalized = await wallet.finalizeRecipe(recipe);
  await wallet.submitTransaction(finalized);

  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((s) => s.isSynced),
      Rx.filter((s) => s.dust.balance(new Date()) > 0n),
    ),
  );
};

export const buildWalletAndWaitForFunds = async (config: Config, seed: string): Promise<WalletContext> => {
  const { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore } = await (async () => {
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
  })();

  await waitForSync(wallet);

  const balance = (await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)))).unshielded.balances[unshieldedToken().raw] ?? 0n;
  if (balance === 0n) {
    await waitForFunds(wallet);
  }

  await registerForDustGeneration(wallet, unshieldedKeystore);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
};

export const buildFreshWallet = async (config: Config): Promise<WalletContext> => {
  const seed = toHex(Buffer.from(generateRandomSeed()));
  return await buildWalletAndWaitForFunds(config, seed);
};

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

function pad32(str: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const strBytes = new TextEncoder().encode(str);
  for (let i = 0; i < Math.min(strBytes.length, 32); i++) {
    bytes[i] = strBytes[i];
  }
  return bytes;
}

const TOKEN_COLORS = {
  USD: '50438fab45db36f4dd0e622c65212fd3dc02e868d1cd429eac61c4dfa77c32e1',
  EUR: '83363546497e9db339b499268eabed92521a4558a27a5337bcf0fee689013780',
  JPY: 'a136e50f63889250cd276e0f9767ecac7b0f9a18ec06d44f23621cf7b57870d9'
} as const;

export const getShieldedTokenBalances = async (
  wallet: WalletFacade,
): Promise<{ USD: bigint; EUR: bigint; JPY: bigint }> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  const balances: any = state.shielded.balances;
  
  const balanceUSD = (balances[TOKEN_COLORS.USD] as bigint) ?? 0n;
  const balanceEUR = (balances[TOKEN_COLORS.EUR] as bigint) ?? 0n;
  const balanceJPY = (balances[TOKEN_COLORS.JPY] as bigint) ?? 0n;
  
  return {
    USD: balanceUSD,
    EUR: balanceEUR,
    JPY: balanceJPY,
  };
};

export const mintUSD = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  amount: bigint,
  wallet: WalletFacade,
  nonce?: Uint8Array,
): Promise<void> => {
  const actualNonce = nonce || generateNonce();
  const recipient = providers.walletProvider.getCoinPublicKey();
  
  await contract.callTx.mintUSD(
    amount,
    {
      is_left: true,
      left: { bytes: Buffer.from(recipient, 'hex') },
      right: { bytes: new Uint8Array(32) },
    },
    actualNonce,
  );
};

export const mintEUR = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  amount: bigint,
  wallet: WalletFacade,
  nonce?: Uint8Array,
): Promise<void> => {
  const actualNonce = nonce || generateNonce();
  const recipient = providers.walletProvider.getCoinPublicKey();
  
  await contract.callTx.mintEUR(
    amount,
    {
      is_left: true,
      left: { bytes: Buffer.from(recipient, 'hex') },
      right: { bytes: new Uint8Array(32) },
    },
    actualNonce,
  );
};

export const mintJPY = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
  amount: bigint,
  wallet: WalletFacade,
  nonce?: Uint8Array,
): Promise<void> => {
  const actualNonce = nonce || generateNonce();
  const recipient = providers.walletProvider.getCoinPublicKey();
  
  await contract.callTx.mintJPY(
    amount,
    {
      is_left: true,
      left: { bytes: Buffer.from(recipient, 'hex') },
      right: { bytes: new Uint8Array(32) },
    },
    actualNonce,
  );
};

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
  
  await contract.callTx.createOrder(pair, direction, price, amount, actualNonce);
};

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
  await contract.callTx.cancelOrder(orderId, pair, direction, price, amount, nonce, refundNonce);
};

export const getInnermostFXLedgerState = async (
  providers: InnermostFXProviders,
  contractAddress: ContractAddress,
): Promise<any> => {
  assertIsContractAddress(contractAddress);
  const state = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? ledger(contractState.data) : null));
  return state;
};

export const getContractState = async (
  providers: InnermostFXProviders,
  contract: DeployedInnermostFXContract,
): Promise<any> => {
  const state = await getInnermostFXLedgerState(providers, contract.deployTxData.public.contractAddress);
  return state;
};

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
  await contract.callTx.matchOrders(
    bidOrderId, askOrderId, matchAmount,
    bidPair, bidPrice, bidAmount, bidNonce,
    askPair, askPrice, askAmount, askNonce,
    bidRemainderNonce, askRemainderNonce, settlementNonce,
  );
};