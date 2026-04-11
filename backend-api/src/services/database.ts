import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { apiConfig } from '../config.js';

export interface WalletRecord {
  id: number;
  seed: string;
  shieldedAddress: string;
  unshieldedAddress: string;
  dustAddress: string;
  created_at: string;
}

export interface ContractRecord {
  id: number;
  contractAddress: string;
  secretKey: string;
  deployed_at: string;
}

export interface OrderRecord {
  id: number;
  orderId: string;
  pair: string;
  direction: string;
  price: string;
  amount: string;
  status: string;
  created_at: string;
}

class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.dirname(apiConfig.databasePath);
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    this.db = new Database(apiConfig.databasePath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  private initializeTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seed TEXT NOT NULL UNIQUE,
        shieldedAddress TEXT NOT NULL,
        unshieldedAddress TEXT NOT NULL,
        dustAddress TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contractAddress TEXT NOT NULL UNIQUE,
        secretKey TEXT NOT NULL,
        deployed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId TEXT UNIQUE NOT NULL,
        orderCounter INTEGER,
        nonce TEXT,
        pair TEXT NOT NULL,
        direction TEXT NOT NULL,
        price TEXT NOT NULL,
        amount TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  saveWallet(data: Omit<WalletRecord, 'id' | 'created_at'>): WalletRecord {
    const stmt = this.db.prepare(`
      INSERT INTO wallets (seed, shieldedAddress, unshieldedAddress, dustAddress)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(data.seed, data.shieldedAddress, data.unshieldedAddress, data.dustAddress);
    
    const wallet = this.getWalletById(result.lastInsertRowid as number);
    if (!wallet) throw new Error('Failed to save wallet');
    return wallet;
  }

  getWalletById(id: number): WalletRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM wallets WHERE id = ?');
    return stmt.get(id) as WalletRecord | undefined;
  }

  getLatestWallet(): WalletRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM wallets ORDER BY id DESC LIMIT 1');
    return stmt.get() as WalletRecord | undefined;
  }

  saveContract(data: Omit<ContractRecord, 'id' | 'deployed_at'>): ContractRecord {
    const stmt = this.db.prepare(`
      INSERT INTO contracts (contractAddress, secretKey)
      VALUES (?, ?)
      ON CONFLICT(contractAddress) DO UPDATE SET secretKey = excluded.secretKey
    `);
    stmt.run(data.contractAddress, data.secretKey);
    
    // Fetch by contractAddress since lastInsertRowid may not be reliable with ON CONFLICT
    const contract = this.getContractByAddress(data.contractAddress);
    if (!contract) throw new Error('Failed to save contract');
    return contract;
  }

  getContractById(id: number): ContractRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM contracts WHERE id = ?');
    return stmt.get(id) as ContractRecord | undefined;
  }

  getContractByAddress(contractAddress: string): ContractRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM contracts WHERE contractAddress = ?');
    return stmt.get(contractAddress) as ContractRecord | undefined;
  }

  getLatestContract(): ContractRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM contracts ORDER BY id DESC LIMIT 1');
    return stmt.get() as ContractRecord | undefined;
  }

  saveOrder(data: { orderId: string; orderCounter?: number; nonce?: string; pair: string; direction: string; price: string; amount: string; status: string }): OrderRecord {
    const stmt = this.db.prepare(`
      INSERT INTO orders (orderId, orderCounter, nonce, pair, direction, price, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(data.orderId, data.orderCounter ?? null, data.nonce ?? null, data.pair, data.direction, data.price, data.amount, data.status);
    
    const order = this.getOrderById(result.lastInsertRowid as number);
    if (!order) throw new Error('Failed to save order');
    return order;
  }

  getOrderById(id: number): OrderRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM orders WHERE id = ?');
    return stmt.get(id) as OrderRecord | undefined;
  }

  getOrders(): OrderRecord[] {
    const stmt = this.db.prepare('SELECT * FROM orders ORDER BY created_at DESC');
    return stmt.all() as OrderRecord[];
  }

  updateOrderStatus(orderId: string, status: string): void {
    const stmt = this.db.prepare('UPDATE orders SET status = ? WHERE orderId = ?');
    stmt.run(status, orderId);
  }

  close(): void {
    this.db.close();
  }
}

export const db = new DatabaseService();