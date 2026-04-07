// InnermostFX CLI Interface

import { type WalletContext } from './api';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import type { Logger } from 'pino'; 
import type { InnermostFXProviders, DeployedInnermostFXContract } from './common-types';
import type { Config } from './config';
import * as api from './api';
import { generateNonce } from './witnesses';

let logger: Logger;

// ─── Display Helpers ────────────────────────────────────────────────────────

const BANNER = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                   InnermostFX                                ║
║                   ──────────                                 ║
║          Privacy-Preserving Order Book Exchange              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

const DIVIDER = '──────────────────────────────────────────────────────────────';

// ─── Menu Helpers ──────────────────────────────────────────────────────────

const MAIN_MENU = `
${DIVIDER}
  InnermostFX Main Menu
${DIVIDER}
  [1] Deploy InnermostFX Contract
  [2] Join Existing Contract
  [3] Exit
${'─'.repeat(62)}
> `;

const CONTRACT_MENU = (dustBalance: string) => `
${DIVIDER}
  Contract Actions${dustBalance ? `                    DUST: ${dustBalance}` : ''}
${DIVIDER}
  [1] Mint Tokens
  [2] Create Single Order
  [3] Create Batch Orders (2)
  [4] Create Batch Orders (4)
  [5] Cancel Order
  [6] Match Orders
  [7] View Contract State
  [8] Monitor DUST Balance
  [9] Exit
${'─'.repeat(62)}
> `;

// ─── Wallet Setup ───────────────────────────────────────────────────────────

const buildWalletFromSeed = async (config: Config, rli: Interface): Promise<WalletContext> => {
  const seed = await rli.question('Enter your wallet seed: ');
  return await api.buildWalletAndWaitForFunds(config, seed);
};

const buildWallet = async (config: Config, rli: Interface): Promise<WalletContext | null> => {
  while (true) {
    console.log(`
${DIVIDER}
  Wallet Setup
${DIVIDER}
  [1] Create a new wallet
  [2] Restore wallet from seed
  [3] Exit
${'─'.repeat(62)}
> `);
    const choice = await rli.question('');
    switch (choice.trim()) {
      case '1':
        return await api.buildFreshWallet(config);
      case '2':
        return await buildWalletFromSeed(config, rli);
      case '3':
        return null;
      default:
        // logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ─── Contract Interaction ───────────────────────────────────────────────────

const getDustLabel = async (wallet: api.WalletContext['wallet']): Promise<string> => {
  try {
    const dust = await api.getDustBalance(wallet);
    return dust.available.toLocaleString();
  } catch {
    return '';
  }
};

const joinContract = async (providers: InnermostFXProviders, rli: Interface): Promise<DeployedInnermostFXContract> => {
  const contractAddress = await rli.question('Enter the contract address (hex): ');
  const contractInstance = await api.joinContract(providers, contractAddress);
  return contractInstance.contract;
};

const startDustMonitor = async (wallet: api.WalletContext['wallet'], rli: Interface): Promise<void> => {
  console.log('');
  const stopPromise = rli.question('  Press Enter to return to menu...\n').then(() => {});
  await api.monitorDustBalance(wallet, stopPromise);
  console.log('');
};

// ─── Contract Actions ──────────────────────────────────────────────────────

const deployOrJoin = async (
  providers: InnermostFXProviders,
  walletCtx: api.WalletContext,
  rli: Interface,
): Promise<DeployedInnermostFXContract | null> => {
  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(MAIN_MENU);
    switch (choice.trim()) {
      case '1':
        try {
          console.log(`
${DIVIDER}
  Deploy InnermostFX Contract
${DIVIDER}
  The InnermostFX order book exchange will be deployed.
${'─'.repeat(62)}`);
          const contractInstance = await api.withStatus('Deploying InnermostFX contract', () =>
            api.deploy(providers),
          );
          console.log(`  Contract deployed at: ${contractInstance.contract.deployTxData.public.contractAddress}\n`);
          return contractInstance.contract;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`\n  ✗ Deploy failed: ${msg}`);
          console.log('');
        }
        break;
      case '2':
        try {
          return await joinContract(providers, rli);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`  ✗ Failed to join contract: ${msg}\n`);
        }
        break;
      case '3':
        return null;
      default:
        console.log(`  Invalid choice: ${choice}`);
    }
  }
};

const mintTokens = async (providers: InnermostFXProviders, contract: DeployedInnermostFXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Mint Tokens
${DIVIDER}`);
  const tokenType = await rli.question('  Token type (USD/EUR/JPY): ');
  const amount = await rli.question('  Amount to mint: ');
  
  try {
    if (tokenType.toUpperCase() === 'USD') {
      await api.mintUSD(providers, contract, BigInt(amount));
      console.log('  ✓ USD tokens minted successfully\n');
    } else if (tokenType.toUpperCase() === 'EUR') {
      await api.mintEUR(providers, contract, BigInt(amount));
      console.log('  ✓ EUR tokens minted successfully\n');
    } else if (tokenType.toUpperCase() === 'JPY') {
      await api.mintJPY(providers, contract, BigInt(amount));
      console.log('  ✓ JPY tokens minted successfully\n');
    } else {
      console.log('  ✗ Invalid token type. Use USD, EUR, or JPY.\n');
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Mint failed: ${msg}\n`);
  }
};

const createSingleOrder = async (providers: InnermostFXProviders, contract: DeployedInnermostFXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Create Single Order
${DIVIDER}
  Available pairs: USD/EUR, USD/JPY, EUR/JPY
  Directions: bid (buy base), ask (sell base)
${'─'.repeat(62)}`);
  
  try {
    const pairStr = await rli.question('  Currency pair (e.g., USD/EUR): ');
    const directionStr = await rli.question('  Direction (bid/ask): ');
    const price = await rli.question('  Price (scaled by 1000000): ');
    const amount = await rli.question('  Amount: ');
    
    const pairMap: Record<string, Uint8Array> = {
      'USD/EUR': Buffer.from(pad32('pair:USD/EUR'), 'hex'),
      'USD/JPY': Buffer.from(pad32('pair:USD/JPY'), 'hex'),
      'EUR/JPY': Buffer.from(pad32('pair:EUR/JPY'), 'hex'),
    };
    
    const dirMap: Record<string, Uint8Array> = {
      'bid': Buffer.from(pad32('bid'), 'hex'),
      'ask': Buffer.from(pad32('ask'), 'hex'),
    };
    
    const pair = pairMap[pairStr] || pairMap['USD/EUR'];
    const direction = dirMap[directionStr] || dirMap['bid'];
    
    await api.createOrder(providers, contract, pair, direction, BigInt(price), BigInt(amount));
    console.log('  ✓ Order created successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Order creation failed: ${msg}\n`);
  }
};

const createBatchOrders2 = async (providers: InnermostFXProviders, contract: DeployedInnermostFXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Create Batch Orders (2)
${DIVIDER}
  You will be asked to create 2 orders.
${'─'.repeat(62)}`);
  
  try {
    const orders = [];
    for (let i = 0; i < 2; i++) {
      console.log(`\n  Order ${i + 1}:`);
      const pairStr = await rli.question('    Currency pair (e.g., USD/EUR): ');
      const directionStr = await rli.question('    Direction (bid/ask): ');
      const price = await rli.question('    Price (scaled by 1000000): ');
      const amount = await rli.question('    Amount: ');
      
      const pairMap: Record<string, Uint8Array> = {
        'USD/EUR': Buffer.from(pad32('pair:USD/EUR'), 'hex'),
        'USD/JPY': Buffer.from(pad32('pair:USD/JPY'), 'hex'),
        'EUR/JPY': Buffer.from(pad32('pair:EUR/JPY'), 'hex'),
      };
      
      const dirMap: Record<string, Uint8Array> = {
        'bid': Buffer.from(pad32('bid'), 'hex'),
        'ask': Buffer.from(pad32('ask'), 'hex'),
      };
      
      orders.push({
        pair: pairMap[pairStr] || pairMap['USD/EUR'],
        direction: dirMap[directionStr] || dirMap['bid'],
        price: BigInt(price),
        amount: BigInt(amount),
        nonce: generateNonce(),
      });
    }
    
    await api.createOrderBatch2(providers, contract, orders);
    console.log('  ✓ Batch of 2 orders created successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Batch order creation failed: ${msg}\n`);
  }
};

const createBatchOrders4 = async (providers: InnermostFXProviders, contract: DeployedInnermostFXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Create Batch Orders (4)
${DIVIDER}
  You will be asked to create 4 orders.
${'─'.repeat(62)}`);
  
  try {
    const orders = [];
    for (let i = 0; i < 4; i++) {
      console.log(`\n  Order ${i + 1}:`);
      const pairStr = await rli.question('    Currency pair (e.g., USD/EUR): ');
      const directionStr = await rli.question('    Direction (bid/ask): ');
      const price = await rli.question('    Price (scaled by 1000000): ');
      const amount = await rli.question('    Amount: ');
      
      const pairMap: Record<string, Uint8Array> = {
        'USD/EUR': Buffer.from(pad32('pair:USD/EUR'), 'hex'),
        'USD/JPY': Buffer.from(pad32('pair:USD/JPY'), 'hex'),
        'EUR/JPY': Buffer.from(pad32('pair:EUR/JPY'), 'hex'),
      };
      
      const dirMap: Record<string, Uint8Array> = {
        'bid': Buffer.from(pad32('bid'), 'hex'),
        'ask': Buffer.from(pad32('ask'), 'hex'),
      };
      
      orders.push({
        pair: pairMap[pairStr] || pairMap['USD/EUR'],
        direction: dirMap[directionStr] || dirMap['bid'],
        price: BigInt(price),
        amount: BigInt(amount),
        nonce: generateNonce(),
      });
    }
    
    await api.createOrderBatch4(providers, contract, orders);
    console.log('  ✓ Batch of 4 orders created successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Batch order creation failed: ${msg}\n`);
  }
};

const cancelOrder = async (providers: InnermostFXProviders, contract: DeployedInnermostFXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Cancel Order
${DIVIDER}`);
  
  try {
    const orderId = await rli.question('  Order ID (hex): ');
    const pairStr = await rli.question('  Currency pair (e.g., USD/EUR): ');
    const directionStr = await rli.question('  Direction (bid/ask): ');
    const price = await rli.question('  Price (scaled by 1000000): ');
    const amount = await rli.question('  Amount: ');
    
    const pairMap: Record<string, Uint8Array> = {
      'USD/EUR': Buffer.from(pad32('pair:USD/EUR'), 'hex'),
      'USD/JPY': Buffer.from(pad32('pair:USD/JPY'), 'hex'),
      'EUR/JPY': Buffer.from(pad32('pair:EUR/JPY'), 'hex'),
    };
    
    const dirMap: Record<string, Uint8Array> = {
      'bid': Buffer.from(pad32('bid'), 'hex'),
      'ask': Buffer.from(pad32('ask'), 'hex'),
    };
    
    const pair = pairMap[pairStr] || pairMap['USD/EUR'];
    const direction = dirMap[directionStr] || dirMap['bid'];
    const nonce = generateNonce();
    const refundNonce = generateNonce();
    
    await api.cancelOrder(
      providers, contract,
      Buffer.from(orderId, 'hex'),
      pair, direction, BigInt(price), BigInt(amount),
      nonce, refundNonce
    );
    console.log('  ✓ Order cancelled successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Order cancellation failed: ${msg}\n`);
  }
};

const matchOrders = async (providers: InnermostFXProviders, contract: DeployedInnermostFXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Match Orders
${DIVIDER}
  This will match a bid order with an ask order.
${'─'.repeat(62)}`);
  
  try {
    console.log('\n  Bid Order:');
    const bidOrderId = await rli.question('    Order ID (hex): ');
    const bidPairStr = await rli.question('    Currency pair (e.g., USD/EUR): ');
    const bidPrice = await rli.question('    Price (scaled by 1000000): ');
    const bidAmount = await rli.question('    Amount: ');
    
    console.log('\n  Ask Order:');
    const askOrderId = await rli.question('    Order ID (hex): ');
    const askPairStr = await rli.question('    Currency pair (e.g., USD/EUR): ');
    const askPrice = await rli.question('    Price (scaled by 1000000): ');
    const askAmount = await rli.question('    Amount: ');
    
    console.log('\n  Match Details:');
    const matchAmount = await rli.question('    Match amount: ');
    
    const pairMap: Record<string, Uint8Array> = {
      'USD/EUR': Buffer.from(pad32('pair:USD/EUR'), 'hex'),
      'USD/JPY': Buffer.from(pad32('pair:USD/JPY'), 'hex'),
      'EUR/JPY': Buffer.from(pad32('pair:EUR/JPY'), 'hex'),
    };
    
    await api.matchOrders(
      providers, contract,
      Buffer.from(bidOrderId, 'hex'),
      Buffer.from(askOrderId, 'hex'),
      BigInt(matchAmount),
      pairMap[bidPairStr] || pairMap['USD/EUR'],
      BigInt(bidPrice), BigInt(bidAmount), generateNonce(),
      pairMap[askPairStr] || pairMap['USD/EUR'],
      BigInt(askPrice), BigInt(askAmount), generateNonce(),
      generateNonce(), generateNonce(), generateNonce()
    );
    console.log('  ✓ Orders matched successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Order matching failed: ${msg}\n`);
  }
};

const viewContractState = async (providers: InnermostFXProviders, contract: DeployedInnermostFXContract): Promise<void> => {
  try {
    const state = await api.getContractState(providers, contract);
    
    console.log(`
${DIVIDER}
  Contract State
${DIVIDER}
  Next Order ID:     ${state.nextOrderId}
  Next Trade ID:     ${state.nextTradeId}
  Order Commitments: ${state.orderCommitment ? `${Object.keys(state.orderCommitment).length} orders` : '0 orders'}
  Nullifier Set:     ${state.nullifierSet ? `${Object.keys(state.nullifierSet).length} nullified orders` : '0 nullified orders'}
${DIVIDER}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Failed to fetch contract state: ${msg}\n`);
  }
};

// ─── Main Loop ─────────────────────────────────────────────────────────────

const mainLoop = async (providers: InnermostFXProviders, walletCtx: api.WalletContext, rli: Interface): Promise<void> => {
  const contract = await deployOrJoin(providers, walletCtx, rli);
  if (contract === null) {
    return;
  }

  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(CONTRACT_MENU(dustLabel));
    switch (choice.trim()) {
      case '1':
        await mintTokens(providers, contract, rli);
        break;
      case '2':
        await createSingleOrder(providers, contract, rli);
        break;
      case '3':
        await createBatchOrders2(providers, contract, rli);
        break;
      case '4':
        await createBatchOrders4(providers, contract, rli);
        break;
      case '5':
        await cancelOrder(providers, contract, rli);
        break;
      case '6':
        await matchOrders(providers, contract, rli);
        break;
      case '7':
        await viewContractState(providers, contract);
        break;
      case '8':
        await startDustMonitor(walletCtx.wallet, rli);
        break;
      case '9':
        return;
      default:
        console.log(`  Invalid choice: ${choice}`);
    }
  }
};

// Helper function to pad strings to 32 bytes
function pad32(str: string): string {
  return str.padEnd(32, '\0').substring(0, 32);
}

// ─── Entry Point ────────────────────────────────────────────────────────────

export const run = async (config: any, _logger: any): Promise<void> => {
  logger = _logger;
  api.setLogger(_logger);

  console.log(BANNER);

  const rli = createInterface({ input, output, terminal: true });

  try {
    // Build wallet
    const walletCtx = await buildWallet(config, rli);
    if (walletCtx === null) {
      return;
    }

    try {
      // Configure providers
      const providers = await api.withStatus('Configuring providers', () => 
        api.configureProviders(walletCtx, config)
      );
      console.log('');

      // Enter main loop
      await mainLoop(providers, walletCtx, rli);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Error: ${e.message}`);
        logger.debug(`${e.stack}`);
      } else {
        throw e;
      }
    } finally {
      // Stop wallet
      try {
        await walletCtx.wallet.stop();
      } catch (e) {
        logger.error(`Error stopping wallet: ${e}`);
      }
    }
  } finally {
    rli.close();
    rli.removeAllListeners();
    logger.info('Goodbye.');
  }
};