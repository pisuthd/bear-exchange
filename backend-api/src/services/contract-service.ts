import { createHash } from 'crypto';
import * as api from '../contract/api.js';
import type { InnermostFXProviders, DeployedInnermostFXContract } from '../contract/common-types.js';
import { walletManager } from './wallet-manager.js';
import { db } from './database.js';
import { generateNonce } from '../contract/witnesses.js';
import { apiConfig, PreprodConfig } from '../config.js';

// ─── Utility helpers ────────────────────────────────────────────────────────

function pad32(str: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const strBytes = new TextEncoder().encode(str);
  for (let i = 0; i < Math.min(strBytes.length, 32); i++) {
    bytes[i] = strBytes[i];
  }
  return bytes;
}

function nonceToHex(nonce: Uint8Array): string {
  return Buffer.from(nonce).toString('hex');
}

function toHex(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString('hex');
}

/**
 * Calculate order ID deterministically from counter number.
 * Matches the contract's persistentHash(["orderId:", counter]) logic.
 */
export function calculateOrderId(counter: number): Uint8Array {
  // pad(32, "orderId:") — UTF-8 bytes, right-padded with zeros to 32 bytes
  const prefix = Buffer.alloc(32, 0);
  Buffer.from('orderId:', 'utf8').copy(prefix, 0);

  // counter as Bytes<32>: Uint<64> in big-endian, zero-padded to 32 bytes
  const counterBytes = Buffer.alloc(32, 0);
  const counterView = new DataView(counterBytes.buffer);
  counterView.setBigUint64(24, BigInt(counter), false); // big-endian, last 8 bytes

  // Combine prefix and counter (64 bytes total)
  const combined = Buffer.concat([prefix, counterBytes]);

  // SHA-256 matches Compact's persistentHash for Vector<2, Bytes<32>>
  return new Uint8Array(createHash('sha256').update(combined).digest());
}

// Pair/direction encoding maps
const pairMap: Record<string, Uint8Array> = {
  'USD/EUR': pad32('pair:USD/EUR'),
  'USD/JPY': pad32('pair:USD/JPY'),
  'EUR/JPY': pad32('pair:EUR/JPY'),
};

const dirMap: Record<string, Uint8Array> = {
  'bid': pad32('bid'),
  'ask': pad32('ask'),
};

function encodePair(pair: string): Uint8Array {
  return pairMap[pair] || pad32(`pair:${pair}`);
}

function encodeDirection(direction: string): Uint8Array {
  return dirMap[direction] || pad32(direction);
}

// ─── Contract Service ───────────────────────────────────────────────────────

class ContractService {
  private providers: InnermostFXProviders | null = null;
  private contract: DeployedInnermostFXContract | null = null;

  /**
   * Initialize providers (called during server startup)
   */
  async initialize(): Promise<void> {
    const walletCtx = walletManager.getWalletContext();
    if (!walletCtx) {
      throw new Error('Wallet not initialized');
    }
    const config = new PreprodConfig();
    this.providers = await api.configureProviders(walletCtx, config);
  }

  /**
   * Deploy a new InnermostFX contract
   */
  async deployContract(): Promise<{ contractAddress: string; secretKey: string }> {
    if (!this.providers) {
      throw new Error('Providers not initialized. Call initialize() first.');
    }

    const instance = await api.deploy(this.providers);
    this.contract = instance.contract;

    const contractAddress = instance.contract.deployTxData.public.contractAddress;
    const secretKey = instance.witnessState.secretKey || '';

    if (!secretKey) {
      throw new Error('No secret key returned from contract deployment');
    }

    // Save to database
    db.saveContract({ contractAddress, secretKey });

    return { contractAddress, secretKey };
  }

  /**
   * Join an existing InnermostFX contract
   */
  async joinContract(contractAddress: string): Promise<void> {
    if (!this.providers) {
      throw new Error('Providers not initialized. Call initialize() first.');
    }

    const instance = await api.joinContract(this.providers, contractAddress);
    this.contract = instance.contract;

    // Save to database
    const secretKey = instance.witnessState.secretKey;
    if (!secretKey) {
      throw new Error('No secret key found in witness state');
    }
    db.saveContract({ contractAddress, secretKey });
  }

  /**
   * Ensure contract is available, throw if not
   */
  private ensureContract(): DeployedInnermostFXContract {
    if (!this.contract) {
      throw new Error('No contract joined. Deploy or join a contract first.');
    }
    return this.contract;
  }

  /**
   * Ensure providers are available, throw if not
   */
  private ensureProviders(): InnermostFXProviders {
    if (!this.providers) {
      throw new Error('Providers not initialized.');
    }
    return this.providers;
  }

  // ─── Token Operations ───────────────────────────────────────────────────

  async mintUSD(amount: bigint): Promise<void> {
    const providers = this.ensureProviders();
    const contract = this.ensureContract();
    const walletCtx = walletManager.getWalletContext();
    if (!walletCtx) throw new Error('Wallet not initialized');

    await api.mintUSD(providers, contract, amount, walletCtx.wallet);
  }

  async mintEUR(amount: bigint): Promise<void> {
    const providers = this.ensureProviders();
    const contract = this.ensureContract();
    const walletCtx = walletManager.getWalletContext();
    if (!walletCtx) throw new Error('Wallet not initialized');

    await api.mintEUR(providers, contract, amount, walletCtx.wallet);
  }

  async mintJPY(amount: bigint): Promise<void> {
    const providers = this.ensureProviders();
    const contract = this.ensureContract();
    const walletCtx = walletManager.getWalletContext();
    if (!walletCtx) throw new Error('Wallet not initialized');

    await api.mintJPY(providers, contract, amount, walletCtx.wallet);
  }

  // ─── Order Operations ───────────────────────────────────────────────────

  /**
   * Create a new order on-chain AND in the database.
   * Even if the on-chain call fails, the order is saved to the database
   * with status 'failed'.
   */
  async createOrder(
    pair: string,
    direction: string,
    price: bigint,
    amount: bigint,
  ): Promise<{ orderId: string; onChainSuccess: boolean; error?: string }> {
    const providers = this.ensureProviders();
    const contract = this.ensureContract();

    // Generate deterministic orderId from current counter + encode pair/direction
    const counter = this.getNextOrderCounter();
    const orderId = toHex(calculateOrderId(counter));
    const nonce = generateNonce();
    const nonceHex = nonceToHex(nonce);

    // Always save to database first (optimistic)
    db.saveOrder({
      orderId,
      orderCounter: counter,
      nonce: nonceHex,
      pair,
      direction,
      price: price.toString(),
      amount: amount.toString(),
      status: 'pending',
    });

    // Attempt on-chain creation
    let onChainSuccess = false;
    let errorMessage: string | undefined;

    try {
      await api.createOrder(
        providers,
        contract,
        encodePair(pair),
        encodeDirection(direction),
        price,
        amount,
        nonce,
      );
      onChainSuccess = true;

      // Update status to active on success
      db.updateOrderStatus(orderId, 'active');
    } catch (error: any) {
      errorMessage = error?.message || String(error);
      console.error('On-chain createOrder failed:', errorMessage);

      // Update status to failed but keep the DB record
      db.updateOrderStatus(orderId, 'failed');
    }

    return { orderId, onChainSuccess, error: errorMessage };
  }

  /**
   * Cancel an order by orderId
   */
  async cancelOrder(orderId: string): Promise<{ onChainSuccess: boolean; error?: string }> {
    const providers = this.ensureProviders();
    const contract = this.ensureContract();

    // Look up order from database to get original details
    const orders = db.getOrders();
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.status === 'cancelled') {
      throw new Error('Order is already cancelled');
    }

    // Generate nonces for cancellation
    const nonce = generateNonce();
    const refundNonce = generateNonce();

    let onChainSuccess = false;
    let errorMessage: string | undefined;

    try {
      await api.cancelOrder(
        providers,
        contract,
        Buffer.from(orderId, 'hex'),
        encodePair(order.pair),
        encodeDirection(order.direction),
        BigInt(order.price),
        BigInt(order.amount),
        nonce,
        refundNonce,
      );
      onChainSuccess = true;

      // Update status
      db.updateOrderStatus(orderId, 'cancelled');
    } catch (error: any) {
      errorMessage = error?.message || String(error);
      console.error('On-chain cancelOrder failed:', errorMessage);
    }

    return { onChainSuccess, error: errorMessage };
  }

  /**
   * Match a bid order with an ask order
   */
  async matchOrders(
    bidOrderId: string,
    askOrderId: string,
    matchAmount: bigint,
  ): Promise<{ onChainSuccess: boolean; error?: string }> {
    const providers = this.ensureProviders();
    const contract = this.ensureContract();

    // Look up both orders from database
    const orders = db.getOrders();
    const bidOrder = orders.find(o => o.orderId === bidOrderId);
    const askOrder = orders.find(o => o.orderId === askOrderId);

    if (!bidOrder) {
      throw new Error(`Bid order not found: ${bidOrderId}`);
    }
    if (!askOrder) {
      throw new Error(`Ask order not found: ${askOrderId}`);
    }

    // Generate all required nonces for matchOrders
    const bidNonce = generateNonce();
    const askNonce = generateNonce();
    const bidRemainderNonce = generateNonce();
    const askRemainderNonce = generateNonce();
    const settlementNonce = generateNonce();

    let onChainSuccess = false;
    let errorMessage: string | undefined;

    try {
      await api.matchOrders(
        providers,
        contract,
        Buffer.from(bidOrderId, 'hex'),
        Buffer.from(askOrderId, 'hex'),
        matchAmount,
        encodePair(bidOrder.pair),
        BigInt(bidOrder.price),
        BigInt(bidOrder.amount),
        bidNonce,
        encodePair(askOrder.pair),
        BigInt(askOrder.price),
        BigInt(askOrder.amount),
        askNonce,
        bidRemainderNonce,
        askRemainderNonce,
        settlementNonce,
      );
      onChainSuccess = true;

      // Update both orders to matched
      db.updateOrderStatus(bidOrderId, 'matched');
      db.updateOrderStatus(askOrderId, 'matched');
    } catch (error: any) {
      errorMessage = error?.message || String(error);
      console.error('On-chain matchOrders failed:', errorMessage);
    }

    return { onChainSuccess, error: errorMessage };
  }

  // ─── Query Operations ───────────────────────────────────────────────────

  /**
   * Get contract state from the chain
   */
  async getContractState(): Promise<any> {
    const providers = this.ensureProviders();
    const contract = this.ensureContract();
    return await api.getContractState(providers, contract);
  }

  /**
   * Get shielded token balances
   */
  async getTokenBalances(): Promise<{ USD: string; EUR: string; JPY: string }> {
    const walletCtx = walletManager.getWalletContext();
    if (!walletCtx) throw new Error('Wallet not initialized');

    const balances = await api.getShieldedTokenBalances(walletCtx.wallet);
    return {
      USD: balances.USD.toString(),
      EUR: balances.EUR.toString(),
      JPY: balances.JPY.toString(),
    };
  }

  /**
   * Get current contract address
   */
  getContractAddress(): string | null {
    if (!this.contract) return null;
    return this.contract.deployTxData?.public?.contractAddress || null;
  }

  /**
   * Check if contract is joined
   */
  isContractReady(): boolean {
    return this.contract !== null;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Get the next order counter from the database.
   * Looks at existing orders to determine the next sequential counter.
   */
  private getNextOrderCounter(): number {
    const orders = db.getOrders();
    if (orders.length === 0) return 1;

    // Find the max orderCounter among all orders
    let maxCounter = 0;
    for (const order of orders as any[]) {
      if (order.orderCounter && order.orderCounter > maxCounter) {
        maxCounter = order.orderCounter;
      }
    }
    return maxCounter + 1;
  }
}

export const contractService = new ContractService();