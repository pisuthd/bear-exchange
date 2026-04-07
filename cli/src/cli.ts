// BearDEX CLI Interface

import { type WalletContext } from './api';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import type { Logger } from 'pino'; 
import type { BearDEXProviders, DeployedBearDEXContract } from './common-types';
import type { Config } from './config';
import * as api from './api';

let logger: Logger;

// ─── Display Helpers ────────────────────────────────────────────────────────

const BANNER = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    BearDEX DEX                              ║
║                    ──────────                                ║
║          Privacy-Preserving Decentralized Exchange          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

const DIVIDER = '──────────────────────────────────────────────────────────────';

// ─── Menu Helpers ──────────────────────────────────────────────────────────

const MAIN_MENU = `
${DIVIDER}
  BearDEX Main Menu
${DIVIDER}
  [1] Deploy BearDEX Contract
  [2] Join Existing Contract
  [3] Exit
${'─'.repeat(62)}
> `;

const CONTRACT_MENU = (dustBalance: string) => `
${DIVIDER}
  Contract Actions${dustBalance ? `                    DUST: ${dustBalance}` : ''}
${DIVIDER}
  [1] Mint Tokens
  [2] Initialize Pool
  [3] Add Liquidity
  [4] Remove Liquidity
  [5] Swap USD → JPY
  [6] Swap JPY → USD
  [7] Update Oracle Price
  [8] View Pool State
  [9] Monitor DUST Balance
  [10] Exit
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

const joinContract = async (providers: BearDEXProviders, rli: Interface): Promise<DeployedBearDEXContract> => {
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
  providers: BearDEXProviders,
  walletCtx: api.WalletContext,
  rli: Interface,
): Promise<DeployedBearDEXContract | null> => {
  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(MAIN_MENU);
    switch (choice.trim()) {
      case '1':
        try {
          console.log(`
${DIVIDER}
  Deploy BearDEX Contract
${DIVIDER}
  Enter the initial oracle price for USD/JPY (scaled by 10000).
  Example: 1500000 means 1 USD = 150.00 JPY
${'─'.repeat(62)}`);
          const oraclePrice = await rli.question('  Oracle price: ');
          const contractInstance = await api.withStatus('Deploying BearDEX contract', () =>
            api.deploy(providers, BigInt(oraclePrice)),
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

const mintTokens = async (contract: DeployedBearDEXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Mint Tokens
${DIVIDER}`);
  const tokenType = await rli.question('  Token type (USD/JPY): ');
  const amount = await rli.question('  Amount to mint: ');
  
  try {
    if (tokenType.toUpperCase() === 'USD') {
      await api.withStatus('Minting USD tokens', () =>
        api.mintUSD(contract, BigInt(amount))
      );
      console.log('  ✓ USD tokens minted successfully\n');
    } else if (tokenType.toUpperCase() === 'JPY') {
      await api.withStatus('Minting JPY tokens', () =>
        api.mintJPY(contract, BigInt(amount))
      );
      console.log('  ✓ JPY tokens minted successfully\n');
    } else {
      console.log('  ✗ Invalid token type. Use USD or JPY.\n');
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Mint failed: ${msg}\n`);
  }
};

const initPool = async (contract: DeployedBearDEXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Initialize Pool
${DIVIDER}`);
  const usdAmount = await rli.question('  USD amount: ');
  const jpyAmount = await rli.question('  JPY amount: ');
  const lpAmount = await rli.question('  LP token amount to mint: ');
  
  try {
    await api.withStatus('Initializing pool', () =>
      api.initPool(contract, BigInt(usdAmount), BigInt(jpyAmount), BigInt(lpAmount))
    );
    console.log('  ✓ Pool initialized successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Pool initialization failed: ${msg}\n`);
  }
};

const addLiquidity = async (contract: DeployedBearDEXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Add Liquidity
${DIVIDER}`);
  const usdAmount = await rli.question('  USD amount: ');
  const jpyAmount = await rli.question('  JPY amount: ');
  const lpAmount = await rli.question('  LP token amount to receive: ');
  
  try {
    await api.withStatus('Adding liquidity', () =>
      api.addLiquidity(contract, BigInt(usdAmount), BigInt(jpyAmount), BigInt(lpAmount))
    );
    console.log('  ✓ Liquidity added successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Failed to add liquidity: ${msg}\n`);
  }
};

const removeLiquidity = async (contract: DeployedBearDEXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Remove Liquidity
${DIVIDER}`);
  const lpAmount = await rli.question('  LP token amount to burn: ');
  const usdOut = await rli.question('  USD amount to receive: ');
  const jpyOut = await rli.question('  JPY amount to receive: ');
  
  try {
    await api.withStatus('Removing liquidity', () =>
      api.removeLiquidity(contract, BigInt(lpAmount), BigInt(usdOut), BigInt(jpyOut))
    );
    console.log('  ✓ Liquidity removed successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Failed to remove liquidity: ${msg}\n`);
  }
};

const swapUSDToJPY = async (contract: DeployedBearDEXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Swap USD → JPY
${DIVIDER}`);
  const usdIn = await rli.question('  USD amount to swap: ');
  const jpyOut = await rli.question('  JPY amount to receive: ');
  
  try {
    await api.withStatus('Swapping USD for JPY', () =>
      api.swapUSDToJPY(contract, BigInt(usdIn), BigInt(jpyOut))
    );
    console.log('  ✓ Swap executed successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Swap failed: ${msg}\n`);
  }
};

const swapJPYToUSD = async (contract: DeployedBearDEXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Swap JPY → USD
${DIVIDER}`);
  const jpyIn = await rli.question('  JPY amount to swap: ');
  const usdOut = await rli.question('  USD amount to receive: ');
  
  try {
    await api.withStatus('Swapping JPY for USD', () =>
      api.swapJPYToUSD(contract, BigInt(jpyIn), BigInt(usdOut))
    );
    console.log('  ✓ Swap executed successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Swap failed: ${msg}\n`);
  }
};

const updateOraclePrice = async (contract: DeployedBearDEXContract, rli: Interface): Promise<void> => {
  console.log(`
${DIVIDER}
  Update Oracle Price
${DIVIDER}`);
  const price = await rli.question('  New USD/JPY price (scaled by 10000): ');
  
  try {
    await api.withStatus('Updating oracle price', () =>
      api.updateOraclePrice(contract, BigInt(price))
    );
    console.log('  ✓ Oracle price updated successfully\n');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Failed to update oracle price: ${msg}\n`);
  }
};

const viewPoolState = async (providers: BearDEXProviders, contract: DeployedBearDEXContract): Promise<void> => {
  try {
    const state = await api.getPoolState(providers, contract);
    const oraclePrice = Number(state.oracleJpyPrice) / 10000;
    
    console.log(`
${DIVIDER}
  Pool State
${DIVIDER}
  Pool Initialized: ${state.poolInitialized ? 'Yes' : 'No'}
${'─'.repeat(62)}
  Reserves
    USD:   ${Number(state.reserveUSD).toLocaleString()}
    JPY:   ${Number(state.reserveJPY).toLocaleString()}
${'─'.repeat(62)}
  Oracle Price (USD/JPY)
    Value: ${oraclePrice.toFixed(2)} JPY per USD
    Raw:   ${state.oracleJpyPrice}
${'─'.repeat(62)}
  LP Tokens
    Total Supply: ${Number(state.lpTotalSupply).toLocaleString()}
${DIVIDER}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ Failed to fetch pool state: ${msg}\n`);
  }
};

// ─── Main Loop ─────────────────────────────────────────────────────────────

const mainLoop = async (providers: BearDEXProviders, walletCtx: api.WalletContext, rli: Interface): Promise<void> => {
  const contract = await deployOrJoin(providers, walletCtx, rli);
  if (contract === null) {
    return;
  }

  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(CONTRACT_MENU(dustLabel));
    switch (choice.trim()) {
      case '1':
        await mintTokens(contract, rli);
        break;
      case '2':
        await initPool(contract, rli);
        break;
      case '3':
        await addLiquidity(contract, rli);
        break;
      case '4':
        await removeLiquidity(contract, rli);
        break;
      case '5':
        await swapUSDToJPY(contract, rli);
        break;
      case '6':
        await swapJPYToUSD(contract, rli);
        break;
      case '7':
        await updateOraclePrice(contract, rli);
        break;
      case '8':
        await viewPoolState(providers, contract);
        break;
      case '9':
        await startDustMonitor(walletCtx.wallet, rli);
        break;
      case '10':
        return;
      default:
        console.log(`  Invalid choice: ${choice}`);
    }
  }
};

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