import { Router } from 'express';
import { walletManager } from '../services/wallet-manager.js';
import { db } from '../services/database.js';

const router = Router();

/**
 * GET /api/wallet/balances
 * Get wallet balances
 * Wallet is initialized during server startup, no need to create/init via API
 */
router.get('/balances', async (req, res) => {
  try {
    const balances = await walletManager.getBalances();
    res.json({
      success: true,
      data: {
        shielded: {
          USD: balances.shielded.USD.toString(),
          EUR: balances.shielded.EUR.toString(),
          JPY: balances.shielded.JPY.toString(),
        },
        unshielded: balances.unshielded.toString(),
        dust: balances.dust.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error getting balances:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get balances',
    });
  }
});

/**
 * GET /api/wallet/info
 * Get wallet info
 */
router.get('/info', async (req, res) => {
  try {
    const wallet = db.getLatestWallet();
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'No wallet found',
      });
    }

    res.json({
      success: true,
      data: {
        id: wallet.id,
        shieldedAddress: wallet.shieldedAddress,
        unshieldedAddress: wallet.unshieldedAddress,
        dustAddress: wallet.dustAddress,
        createdAt: wallet.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error getting wallet info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet info',
    });
  }
});

export default router;