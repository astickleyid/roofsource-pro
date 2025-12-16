/**
 * Express API Server
 * Serves scraped product data to frontend
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupDatabase, searchProducts, getPricesForProduct, getPricesByLocation } from './database/db.js';
import runAllScrapers from './jobs/runScrapers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Setup database on startup
setupDatabase();

// API Routes

/**
 * Search for products
 * GET /api/products/search?q=shingles
 */
app.get('/api/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 3) {
      return res.status(400).json({ error: 'Query must be at least 3 characters' });
    }

    const results = await searchProducts(q);
    
    res.json({
      success: true,
      count: results.length,
      products: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get prices for a specific product
 * GET /api/products/:sku/prices
 */
app.get('/api/products/:sku/prices', async (req, res) => {
  try {
    const { sku } = req.params;
    const { location } = req.query;
    
    const prices = location 
      ? await getPricesByLocation(location, sku)
      : await getPricesForProduct(sku);
    
    if (prices.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: {
        sku: prices[0].sku,
        name: prices[0].name,
        manufacturer: prices[0].manufacturer
      },
      prices: prices.map(p => ({
        supplier: p.supplier_name,
        price: p.price,
        unit: p.unit,
        inStock: p.in_stock,
        stockQuantity: p.stock_quantity,
        location: p.location,
        url: p.url,
        scrapedAt: p.scraped_at
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Multi-product price lookup
 * POST /api/products/prices
 * Body: { products: [{ sku, quantity }], location }
 */
app.post('/api/products/prices', async (req, res) => {
  try {
    const { products, location } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Products must be an array' });
    }

    const results = await Promise.all(products.map(async (item) => {
      const prices = location
        ? await getPricesByLocation(location, item.sku)
        : await getPricesForProduct(item.sku);
      
      return {
        sku: item.sku,
        quantity: item.quantity || 1,
        found: prices.length > 0,
        bestPrice: prices.length > 0 ? prices[0] : null,
        allPrices: prices
      };
    }));

    res.json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger manual scrape
 * POST /api/scrape/run
 */
app.post('/api/scrape/run', async (req, res) => {
  try {
    // Run scrapers in background
    runAllScrapers().catch(console.error);
    
    res.json({
      success: true,
      message: 'Scraping job started in background'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schedule daily scraping at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('⏰ Running scheduled scrape job...');
  runAllScrapers().catch(console.error);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 RoofSource Pro Backend Server
================================
Port: ${PORT}
Database: data/products.db
Scheduled scraping: Daily at 2 AM

API Endpoints:
- GET  /api/products/search?q=shingles
- GET  /api/products/:sku/prices
- POST /api/products/prices
- POST /api/scrape/run

Ready for requests!
  `);
});
