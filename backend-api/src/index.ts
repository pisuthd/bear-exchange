import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiConfig } from './config.js';
import { walletManager } from './services/wallet-manager.js';
import { contractService } from './services/contract-service.js';
import { db } from './services/database.js';
import walletRoutes from './routes/wallet.routes.js';
import tokensRoutes from './routes/tokens.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import contractRoutes from './routes/contract.routes.js';

const app = express();
const PORT = apiConfig.port || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    walletReady: walletManager.isReady()
  });
});

// API routes
app.use('/api/wallet', walletRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/contract', contractRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Initialize and start server
async function startServer() {
  try {
    console.log('='.repeat(60));
    console.log('Starting InnermostFX Backend API...');
    console.log('='.repeat(60));

    // Database is already initialized in the constructor
    console.log('\n[1/3] Database initialized');

    // Initialize wallet
    console.log('\n[2/3] Initializing wallet (this may take some time)...');
    await walletManager.initialize();
    console.log('✓ Wallet initialized');

    // Wait for wallet to sync
    console.log('\n[3/3] Waiting for wallet to sync with network...');
    await walletManager.waitForSync();
    console.log('✓ Wallet synced');

    // Join contract if address is provided
    if (apiConfig.contract.address) {
      console.log('\n[4/4] Joining contract...');
      await contractService.initialize();
      await contractService.joinContract(apiConfig.contract.address);
      console.log('✓ Contract joined successfully');
    } else {
      console.log('\n[4/4] No contract address provided. Skipping contract join.');
      console.log('  Set CONTRACT_ADDRESS in .env to auto-join a contract.');
    }

    // Start Express server
    console.log('\n' + '='.repeat(60));
    console.log('Starting Express server...');
    console.log('='.repeat(60));

    app.listen(PORT, () => {
      console.log('\n✓ Server started successfully!');
      console.log('\nServer Information:');
      console.log(`  Port: ${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/health`);
      console.log(`  API base URL: http://localhost:${PORT}/api`);
      console.log('\nAvailable Endpoints:');
      console.log(`  - Wallet:   http://localhost:${PORT}/api/wallet/*`);
      console.log(`  - Tokens:   http://localhost:${PORT}/api/tokens/*`);
      console.log(`  - Orders:   http://localhost:${PORT}/api/orders/*`);
      console.log(`  - Contract: http://localhost:${PORT}/api/contract/*`);
      console.log('\n' + '='.repeat(60));
      console.log('Server is ready to accept requests!');
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('\nFailed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
