/**
 * Database Setup & Schema
 */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '../../data');
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'products.db');

let db;

export const getDb = async () => {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }
  return db;
};

export const setupDatabase = async () => {
  const db = await getDb();
  
  // Products table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      manufacturer TEXT,
      category TEXT,
      description TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Supplier prices table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      supplier_name TEXT NOT NULL,
      supplier_sku TEXT,
      price REAL NOT NULL,
      unit TEXT,
      in_stock BOOLEAN DEFAULT 1,
      stock_quantity INTEGER,
      location TEXT,
      url TEXT,
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(product_id, supplier_name, location)
    )
  `);

  // Supplier locations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL,
      address TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT,
      phone TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(supplier_name, city, state)
    )
  `);

  // Scraping jobs log
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL,
      status TEXT NOT NULL,
      products_found INTEGER DEFAULT 0,
      errors TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  // Create indexes
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_supplier_prices_product ON supplier_prices(product_id);
    CREATE INDEX IF NOT EXISTS idx_supplier_prices_supplier ON supplier_prices(supplier_name);
    CREATE INDEX IF NOT EXISTS idx_supplier_prices_location ON supplier_prices(location);
  `);

  console.log('✅ Database setup complete');
  return db;
};

// Product operations
export const insertProduct = async (sku, name, manufacturer, category, description, imageUrl) => {
  const db = await getDb();
  return await db.run(
    `INSERT OR IGNORE INTO products (sku, name, manufacturer, category, description, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
    [sku, name, manufacturer, category, description, imageUrl]
  );
};

export const getProductBySku = async (sku) => {
  const db = await getDb();
  return await db.get(`SELECT * FROM products WHERE sku = ?`, [sku]);
};

export const searchProducts = async (searchTerm) => {
  const db = await getDb();
  const term = `%${searchTerm}%`;
  return await db.all(
    `SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? OR manufacturer LIKE ? LIMIT 50`,
    [term, term, term]
  );
};

// Price operations
export const insertPrice = async (productId, supplierName, supplierSku, price, unit, inStock, stockQty, location, url) => {
  const db = await getDb();
  return await db.run(
    `INSERT OR REPLACE INTO supplier_prices (product_id, supplier_name, supplier_sku, price, unit, in_stock, stock_quantity, location, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [productId, supplierName, supplierSku, price, unit, inStock, stockQty, location, url]
  );
};

export const getPricesForProduct = async (sku) => {
  const db = await getDb();
  return await db.all(
    `SELECT sp.*, p.name, p.manufacturer, p.sku FROM supplier_prices sp JOIN products p ON sp.product_id = p.id WHERE p.sku = ? ORDER BY sp.price ASC`,
    [sku]
  );
};

export const getPricesByLocation = async (location, sku) => {
  const db = await getDb();
  return await db.all(
    `SELECT sp.*, p.name, p.manufacturer, p.sku FROM supplier_prices sp JOIN products p ON sp.product_id = p.id WHERE (sp.location = ? OR sp.location IS NULL) AND p.sku = ? ORDER BY sp.price ASC`,
    [location, sku]
  );
};

// Scrape job operations
export const insertScrapeJob = async (supplierName, status) => {
  const db = await getDb();
  const result = await db.run(
    `INSERT INTO scrape_jobs (supplier_name, status) VALUES (?, ?)`,
    [supplierName, status]
  );
  return result.lastID;
};

export const updateScrapeJob = async (status, productsFound, errors, jobId) => {
  const db = await getDb();
  return await db.run(
    `UPDATE scrape_jobs SET status = ?, products_found = ?, errors = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, productsFound, errors, jobId]
  );
};

export default getDb;
