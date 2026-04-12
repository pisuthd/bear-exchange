import { Router } from 'express';
import { contractService } from '../services/contract-service.js';
import { db } from '../services/database.js';

const router = Router();

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', async (req, res) => {
  try {
    const { pair, direction, price, amount } = req.body;
    
    if (!pair || !direction || !price || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pair, direction, price, amount',
      });
    }

    if (!['bid', 'ask'].includes(direction)) {
      return res.status(400).json({
        success: false,
        error: 'Direction must be either "bid" or "ask"',
      });
    }

    const result = await contractService.createOrder(
      pair,
      direction,
      BigInt(price),
      BigInt(amount),
    );
    
    if (result.onChainSuccess) {
      res.json({
        success: true,
        message: 'Order created successfully',
        data: { orderId: result.orderId },
      });
    } else {
      // Order saved to DB but on-chain failed
      res.json({
        success: true,
        message: 'Order saved to database but on-chain creation failed',
        data: { orderId: result.orderId },
        onChainSuccess: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order',
    });
  }
});

/**
 * POST /api/orders/batch
 * Create multiple orders in a single batch (2 or 4 orders)
 */
router.post('/batch', async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || (orders.length !== 2 && orders.length !== 4)) {
      return res.status(400).json({
        success: false,
        error: 'orders must be an array of exactly 2 or 4 order objects',
      });
    }

    for (const order of orders) {
      if (!order.pair || !order.direction || !order.price || !order.amount) {
        return res.status(400).json({
          success: false,
          error: 'Each order must have: pair, direction, price, amount',
        });
      }
      if (!['bid', 'ask'].includes(order.direction)) {
        return res.status(400).json({
          success: false,
          error: 'Direction must be either "bid" or "ask"',
        });
      }
    }

    const orderParams = orders.map((o: any) => ({
      pair: o.pair,
      direction: o.direction,
      price: BigInt(o.price),
      amount: BigInt(o.amount),
    }));

    const results = await contractService.createOrderBatch(orderParams);

    const allSuccess = results.every((r) => r.onChainSuccess);

    res.json({
      success: true,
      message: allSuccess
        ? `Batch of ${results.length} orders created successfully`
        : 'Batch saved to database but on-chain creation may have failed',
      data: results.map((r) => ({ orderId: r.orderId })),
      onChainSuccess: allSuccess,
      error: results.find((r) => r.error)?.error,
    });
  } catch (error: any) {
    console.error('Error creating batch orders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create batch orders',
    });
  }
});

/**
 * GET /api/orders
 * Get all orders
 */
router.get('/', (req, res) => {
  try {
    const orders = db.getOrders();
    
    res.json({
      success: true,
      data: orders.map(order => ({
        id: order.id,
        orderId: order.orderId,
        pair: order.pair,
        direction: order.direction,
        price: order.price,
        amount: order.amount,
        status: order.status,
        createdAt: order.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get orders',
    });
  }
});

/**
 * DELETE /api/orders/:orderId
 * Cancel an order
 */
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
      });
    }

    const result = await contractService.cancelOrder(orderId);
    
    if (result.onChainSuccess) {
      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: { orderId },
      });
    } else {
      res.json({
        success: true,
        message: 'Cancel attempt completed but on-chain cancellation may have failed',
        data: { orderId },
        onChainSuccess: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel order',
    });
  }
});

/**
 * POST /api/orders/match
 * Match two orders
 */
router.post('/match', async (req, res) => {
  try {
    const { bidOrderId, askOrderId, matchAmount } = req.body;
    
    if (!bidOrderId || !askOrderId || !matchAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bidOrderId, askOrderId, matchAmount',
      });
    }

    const result = await contractService.matchOrders(
      bidOrderId,
      askOrderId,
      BigInt(matchAmount),
    );
    
    if (result.onChainSuccess) {
      res.json({
        success: true,
        message: 'Orders matched successfully',
        data: {
          bidOrderId,
          askOrderId,
          matchAmount,
        },
      });
    } else {
      res.json({
        success: true,
        message: 'Match attempt completed but on-chain matching may have failed',
        data: {
          bidOrderId,
          askOrderId,
          matchAmount,
        },
        onChainSuccess: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error matching orders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to match orders',
    });
  }
});

export default router;