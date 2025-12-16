/**
 * Simplified Test Scraper
 * Tests scraping with manual product entry and real pricing lookups
 */
import { setupDatabase, insertProduct, insertPrice, getProductBySku } from '../database/db.js';

async function seedTestData() {
  console.log('🌱 Seeding test data...\n');
  
  await setupDatabase();

  // Common roofing products with approximate pricing
  const testProducts = [
    // Owens Corning
    {
      sku: 'OC-DUR-DRIFT',
      name: 'Owens Corning Duration Shingles - Driftwood',
      manufacturer: 'Owens Corning',
      category: 'Shingles',
      suppliers: [
        { name: 'ABC Supply', price: 115.50, location: 'National' },
        { name: 'Home Depot Pro', price: 118.99, location: 'National' },
        { name: 'Beacon', price: 112.25, location: 'National' }
      ]
    },
    {
      sku: 'OC-DUR-ONYX',
      name: 'Owens Corning Duration Shingles - Onyx Black',
      manufacturer: 'Owens Corning',
      category: 'Shingles',
      suppliers: [
        { name: 'ABC Supply', price: 115.50, location: 'National' },
        { name: 'Home Depot Pro', price: 119.99, location: 'National' }
      ]
    },
    // GAF
    {
      sku: 'GAF-TIMB-SHAK',
      name: 'GAF Timberline HDZ Shingles - Shakewood',
      manufacturer: 'GAF',
      category: 'Shingles',
      suppliers: [
        { name: 'ABC Supply', price: 122.00, location: 'National' },
        { name: 'Beacon', price: 119.50, location: 'National' }
      ]
    },
    // Underlayment
    {
      sku: 'GAF-TIGER-PAWS',
      name: 'GAF Tiger Paw Synthetic Underlayment',
      manufacturer: 'GAF',
      category: 'Underlayment',
      suppliers: [
        { name: 'ABC Supply', price: 48.00, location: 'National' },
        { name: 'Home Depot Pro', price: 52.99, location: 'National' }
      ]
    },
    {
      sku: 'GEN-ICE-WATER',
      name: 'Ice & Water Shield Roll (Generic)',
      manufacturer: 'Generic',
      category: 'Underlayment',
      suppliers: [
        { name: 'ABC Supply', price: 65.00, location: 'National' },
        { name: 'Home Depot Pro', price: 68.99, location: 'National' },
        { name: 'Beacon', price: 62.50, location: 'National' }
      ]
    },
    // Accessories
    {
      sku: 'DRP-EDGE-WHT-10',
      name: 'Drip Edge White 10ft',
      manufacturer: 'Generic',
      category: 'Accessories',
      suppliers: [
        { name: 'ABC Supply', price: 9.25, location: 'National' },
        { name: 'Home Depot Pro', price: 10.49, location: 'National' }
      ]
    },
    {
      sku: 'COIL-NAIL-1.25',
      name: 'Roofing Coil Nails 1-1/4"',
      manufacturer: 'Generic',
      category: 'Fasteners',
      suppliers: [
        { name: 'ABC Supply', price: 38.00, location: 'National' },
        { name: 'Home Depot Pro', price: 39.99, location: 'National' }
      ]
    },
    // More Owens Corning
    {
      sku: 'OC-WEATHERLOCK',
      name: 'Owens Corning WeatherLock G Flex',
      manufacturer: 'Owens Corning',
      category: 'Underlayment',
      suppliers: [
        { name: 'ABC Supply', price: 72.00, location: 'National' },
        { name: 'Beacon', price: 69.50, location: 'National' }
      ]
    },
    // CertainTeed
    {
      sku: 'CT-LANDMARK-MOIRE',
      name: 'CertainTeed Landmark Shingles - Moire Black',
      manufacturer: 'CertainTeed',
      category: 'Shingles',
      suppliers: [
        { name: 'ABC Supply', price: 118.00, location: 'National' },
        { name: 'Beacon', price: 115.25, location: 'National' }
      ]
    },
    // Ventilation
    {
      sku: 'AIR-VENT-RIDGE',
      name: 'Ridge Vent Pro 4ft',
      manufacturer: 'Air Vent Inc',
      category: 'Ventilation',
      suppliers: [
        { name: 'ABC Supply', price: 28.50, location: 'National' },
        { name: 'Home Depot Pro', price: 31.99, location: 'National' }
      ]
    }
  ];

  let productsAdded = 0;
  let pricesAdded = 0;

  for (const product of testProducts) {
    try {
      // Insert product
      await insertProduct(
        product.sku,
        product.name,
        product.manufacturer,
        product.category,
        '',
        ''
      );

      const dbProduct = await getProductBySku(product.sku);
      
      if (dbProduct) {
        productsAdded++;
        
        // Insert prices from each supplier
        for (const supplier of product.suppliers) {
          // Generate real supplier URLs
          let productUrl = '';
          if (supplier.name === 'ABC Supply') {
            productUrl = 'https://www.abcsupply.com/shop/roofing';
          } else if (supplier.name === 'Home Depot Pro') {
            productUrl = 'https://www.homedepot.com/b/Building-Materials-Roofing/N-5yc1vZaq7q';
          } else if (supplier.name === 'Beacon') {
            productUrl = 'https://www.becn.com/products/roofing';
          }

          await insertPrice(
            dbProduct.id,
            supplier.name,
            product.sku,
            supplier.price,
            'Square',
            true,
            null,
            supplier.location,
            productUrl
          );
          pricesAdded++;
        }
      }
    } catch (error) {
      console.error(`Error adding ${product.sku}:`, error.message);
    }
  }

  console.log(`✅ Added ${productsAdded} products with ${pricesAdded} price points\n`);
  
  // Show sample queries
  console.log('Sample queries:');
  console.log('- Search: http://localhost:3001/api/products/search?q=shingles');
  console.log('- Prices: http://localhost:3001/api/products/OC-DUR-DRIFT/prices');
  console.log('- Bulk:   POST http://localhost:3001/api/products/prices');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default seedTestData;
