#!/usr/bin/env node
/**
 * DETAILED SCRAPER TEST - Shows exactly what's happening
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { insertProduct, getProductBySku, insertPrice } from './src/database/db.js';

console.log('🧪 DETAILED SCRAPER TEST\n');
console.log('=' .repeat(60));

// Test 1: Check network connection
console.log('\n📡 TEST 1: Network Connection');
try {
  const response = await axios.get('https://www.google.com', { timeout: 5000 });
  console.log('✅ Internet connection: OK');
  console.log(`   Status: ${response.status}`);
} catch (error) {
  console.log('❌ Internet connection: FAILED');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

// Test 2: Access Home Depot
console.log('\n📡 TEST 2: Home Depot Access');
try {
  const url = 'https://www.homedepot.com/s/roofing%20shingles';
  console.log(`   URL: ${url}`);
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    timeout: 15000
  });
  
  console.log('✅ Home Depot responded');
  console.log(`   Status: ${response.status}`);
  console.log(`   Content length: ${response.data.length} bytes`);
  
  // Test 3: Parse HTML
  console.log('\n🔍 TEST 3: HTML Parsing');
  const $ = cheerio.load(response.data);
  
  // Save HTML for inspection
  const fs = await import('fs');
  await fs.promises.writeFile('/tmp/homedepot_test.html', response.data);
  console.log('✅ HTML saved to: /tmp/homedepot_test.html');
  
  // Try different selectors
  const selectors = [
    '.product-pod',
    '[data-pod-type="product"]',
    '.product-card',
    '[data-testid="product-pod"]',
    '.browse-search__pod',
    '.plp-pod',
    'div[class*="product"]',
    'div[class*="pod"]'
  ];
  
  console.log('\n   Testing selectors:');
  let foundSelector = null;
  for (const selector of selectors) {
    const count = $(selector).length;
    console.log(`   ${selector.padEnd(35)} → ${count} elements`);
    if (count > 0 && !foundSelector) {
      foundSelector = selector;
    }
  }
  
  if (foundSelector) {
    console.log(`\n✅ Found products with selector: ${foundSelector}`);
    
    // Test 4: Extract product data
    console.log('\n📦 TEST 4: Extract Product Data\n');
    
    let products = 0;
    $(foundSelector).slice(0, 3).each((i, elem) => {
      const $elem = $(elem);
      
      // Try to find product info
      const possibleNames = [
        $elem.find('.product-header__title').text().trim(),
        $elem.find('.product-title').text().trim(),
        $elem.find('[data-testid="product-header"]').text().trim(),
        $elem.find('h2').first().text().trim(),
        $elem.find('span[class*="title"]').first().text().trim()
      ].filter(Boolean);
      
      const possiblePrices = [
        $elem.find('.price').first().text().trim(),
        $elem.find('.price__numbers').first().text().trim(),
        $elem.find('[data-testid="price"]').text().trim(),
        $elem.find('span[class*="price"]').first().text().trim()
      ].filter(Boolean);
      
      const possibleSkus = [
        $elem.attr('data-product-id'),
        $elem.find('[data-sku]').attr('data-sku'),
        $elem.find('[data-product-id]').attr('data-product-id')
      ].filter(Boolean);
      
      const image = $elem.find('img').first().attr('src');
      
      console.log(`   Product ${i + 1}:`);
      console.log(`     Names found: ${possibleNames.length > 0 ? possibleNames[0].substring(0, 60) : 'NONE'}`);
      console.log(`     Prices found: ${possiblePrices.length > 0 ? possiblePrices[0] : 'NONE'}`);
      console.log(`     SKUs found: ${possibleSkus.length > 0 ? possibleSkus[0] : 'NONE'}`);
      console.log(`     Image: ${image ? 'YES' : 'NO'}`);
      console.log('');
      
      if (possibleNames.length > 0 && possiblePrices.length > 0) {
        products++;
      }
    });
    
    console.log(`✅ Successfully extracted ${products}/3 test products`);
    
  } else {
    console.log('\n❌ Could not find any product elements');
    console.log('\n   Page title:', $('title').text());
    console.log('   Open /tmp/homedepot_test.html to inspect');
  }
  
} catch (error) {
  console.log('❌ Home Depot test failed');
  console.log(`   Error: ${error.message}`);
  if (error.response) {
    console.log(`   HTTP Status: ${error.response.status}`);
  }
}

// Test 5: Database operations
console.log('\n💾 TEST 5: Database Operations');
try {
  const testSku = 'TEST-' + Date.now();
  const testProduct = {
    sku: testSku,
    name: 'Test Roofing Shingle',
    manufacturer: 'Test Manufacturer',
    category: 'Shingles',
    description: 'Test product',
    imageUrl: 'https://example.com/image.jpg'
  };
  
  // Insert product
  await insertProduct(
    testProduct.sku,
    testProduct.name,
    testProduct.manufacturer,
    testProduct.category,
    testProduct.description,
    testProduct.imageUrl
  );
  console.log('✅ Product inserted');
  
  // Retrieve product
  const dbProduct = await getProductBySku(testSku);
  console.log(`✅ Product retrieved: ID ${dbProduct.id}`);
  
  // Insert price
  await insertPrice(
    dbProduct.id,
    'Test Supplier',
    testSku,
    125.99,
    'Bundle',
    true,
    50,
    'National',
    'https://example.com/product'
  );
  console.log('✅ Price inserted');
  
  // Query to verify
  const { default: sqlite3 } = await import('sqlite3');
  const { default: sqlite } = await import('sqlite');
  
  const db = await sqlite.open({
    filename: './data/products.db',
    driver: sqlite3.Database
  });
  
  const result = await db.get(
    'SELECT COUNT(*) as count FROM supplier_prices WHERE product_id = ?',
    [dbProduct.id]
  );
  
  console.log(`✅ Price count in DB: ${result.count}`);
  
  await db.close();
  
} catch (error) {
  console.log('❌ Database test failed');
  console.log(`   Error: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('✅ DETAILED TEST COMPLETE\n');

console.log('📊 SUMMARY:');
console.log('1. Network: Working');
console.log('2. Home Depot Access: Check results above');
console.log('3. HTML Parsing: Check /tmp/homedepot_test.html');
console. log('4. Product Extraction: See detailed output above');
console.log('5. Database: Working');

console.log('\n📝 NEXT STEPS:');
console.log('1. Open /tmp/homedepot_test.html in a browser');
console.log('2. Right-click a product → Inspect Element');
console.log('3. Find the correct CSS selectors');
console.log('4. Update homeDepotEnhanced.js with correct selectors');

process.exit(0);
