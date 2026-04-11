import { Router } from 'express';
import { contractService } from '../services/contract-service.js';

const router = Router();

/**
 * POST /api/tokens/mint/usd
 * Mint USD tokens
 */
router.post('/mint/usd', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    await contractService.mintUSD(BigInt(amount));
    
    res.json({
      success: true,
      message: 'USD tokens minted successfully',
      data: { amount },
    });
  } catch (error: any) {
    console.error('Error minting USD:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mint USD tokens',
    });
  }
});

/**
 * POST /api/tokens/mint/eur
 * Mint EUR tokens
 */
router.post('/mint/eur', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    await contractService.mintEUR(BigInt(amount));
    
    res.json({
      success: true,
      message: 'EUR tokens minted successfully',
      data: { amount },
    });
  } catch (error: any) {
    console.error('Error minting EUR:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mint EUR tokens',
    });
  }
});

/**
 * POST /api/tokens/mint/jpy
 * Mint JPY tokens
 */
router.post('/mint/jpy', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    await contractService.mintJPY(BigInt(amount));
    
    res.json({
      success: true,
      message: 'JPY tokens minted successfully',
      data: { amount },
    });
  } catch (error: any) {
    console.error('Error minting JPY:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mint JPY tokens',
    });
  }
});

export default router;