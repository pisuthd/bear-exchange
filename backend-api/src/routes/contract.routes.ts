import { Router } from 'express';
import { contractService } from '../services/contract-service.js';
import { db } from '../services/database.js';

const router = Router();

/**
 * POST /api/contract/deploy
 * Deploy a new InnermostFX contract
 */
router.post('/deploy', async (req, res) => {
  try {
    const result = await contractService.deployContract();
    res.json({
      success: true,
      message: 'Contract deployed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error deploying contract:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deploy contract',
    });
  }
});

/**
 * POST /api/contract/join
 * Join an existing contract
 */
router.post('/join', async (req, res) => {
  try {
    const { contractAddress } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: contractAddress',
      });
    }

    await contractService.joinContract(contractAddress);
    res.json({
      success: true,
      message: 'Joined contract successfully',
      data: { contractAddress },
    });
  } catch (error: any) {
    console.error('Error joining contract:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to join contract',
    });
  }
});

/**
 * GET /api/contract/status
 * Get contract status (joined, address, state)
 */
router.get('/status', async (req, res) => {
  try {
    const isReady = contractService.isContractReady();
    const address = contractService.getContractAddress();

    res.json({
      success: true,
      data: {
        contractReady: isReady,
        contractAddress: address,
      },
    });
  } catch (error: any) {
    console.error('Error getting contract status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get contract status',
    });
  }
});

/**
 * GET /api/contract/state
 * Get on-chain contract state (ledger state)
 */
router.get('/state', async (req, res) => {
  try {
    const state = await contractService.getContractState();

    // Convert BigInt values for JSON serialization
    const serialized = JSON.stringify(state, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    );

    res.json({
      success: true,
      data: JSON.parse(serialized),
    });
  } catch (error: any) {
    console.error('Error getting contract state:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get contract state',
    });
  }
});

/**
 * GET /api/contract/balances
 * Get shielded token balances
 */
router.get('/balances', async (req, res) => {
  try {
    const balances = await contractService.getTokenBalances();
    res.json({
      success: true,
      data: balances,
    });
  } catch (error: any) {
    console.error('Error getting token balances:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get token balances',
    });
  }
});

/**
 * GET /api/contract/list
 * List all contracts stored in database
 */
router.get('/list', (req, res) => {
  try {
    const contract = db.getLatestContract();
    res.json({
      success: true,
      data: contract || null,
    });
  } catch (error: any) {
    console.error('Error listing contracts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list contracts',
    });
  }
});

export default router;