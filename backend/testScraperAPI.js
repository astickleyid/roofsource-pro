#!/usr/bin/env node
/**
 * Test ScraperAPI - Easiest Solution
 * 
 * 1. Sign up: https://www.scraperapi.com/signup
 * 2. Get your free API key (1,000 requests free)
 * 3. Add to .env: SCRAPER_API_KEY=your_key_here
 * 4. Run: node testScraperAPI.js
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SCRAPER_API_KEY;

if (!API_KEY || API_KEY === 'your_scraper_api_key_here') {
  console.log('❌ ERROR: No ScraperAPI key found!\n');
  console.log('📋 TO GET STARTED:');
  console.log('1. Go to: https://www.scraperapi.com/signup');
  console.log('2. Sign up (FREE - 1,000 requests)');
  console.log('3. Copy your API key');
  console.log('4. Add to backend/.env:');
  console.log('   SCRAPER_API_KEY=your_api_key_here\n');
  process.exit(1);
}

console.log('🧪 Testing ScraperAPI\n');
console.log('=' .repeat(60));

// Test Home Depot
const targetUrl = 'https://www.homedepot.com/b/Building-Materials-Roofing-Roofing-Shingles/N-5yc1vZaqm5';
const scraperUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;

console.log('\n📡 TEST: Home Depot Product Listing');
console.log(`   Target: ${targetUrl}`);
console.log(`   Via: ScraperAPI`);

try {
  console.log('\n⏳ Making request (may take 10-30 seconds)...');
  
  const startTime = Date.now();
  const response = await axios.get(scraperUrl, { timeout: 60000 });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`✅ Response received in ${duration}s`);
  console.log(`   Status: ${response.status}`);
  console.log(`   HTML size: ${(response.data.length / 1024).toFixed(1)} KB`);
  
  // Parse HTML
  const $ = cheerio.load(response.data);
  const title = $('title').text();
  
  console.log(`   Page title: ${title}`);
  
  // Save for inspection
  const fs = await import('fs');
  await fs.promises.writeFile('/tmp/scraperapi_homedepot.html', response.data);
  console.log(`   Saved to: /tmp/scraperapi_homedepot.html`);
  
  // Try to find products
  const productSelectors = [
    '.product-pod',
    '[data-testid="product-pod"]',
    '.plp-pod',
    'div[class*="product"]'
  ];
  
  let productsFound = 0;
  let workingSelector = null;
  
  for (const selector of productSelectors) {
    const count = $(selector).length;
    if (count > 0) {
      productsFound = count;
      workingSelector = selector;
      break;
    }
  }
  
  if (productsFound > 0) {
    console.log(`\n✅ SUCCESS! Found ${productsFound} products`);
    console.log(`   Using selector: ${workingSelector}`);
    
    // Extract first 3 products
    console.log('\n📦 Sample Products:\n');
    
    $(workingSelector).slice(0, 3).each((i, elem) => {
      const $elem = $(elem);
      const name = $elem.find('h2, .product-title, [class*="title"]').first().text().trim();
      const price = $elem.find('[class*="price"]').first().text().trim();
      const sku = $elem.attr('data-product-id') || $elem.find('[data-sku]').attr('data-sku');
      
      console.log(`   ${i + 1}. ${name.substring(0, 60)}`);
      console.log(`      Price: ${price || 'N/A'}`);
      console.log(`      SKU: ${sku || 'N/A'}`);
      console.log('');
    });
    
    console.log('=' .repeat(60));
    console.log('✅ SCRAPERAPI WORKS!\n');
    console.log('💡 NEXT STEPS:');
    console.log('1. Update homeDepotEnhanced.js to use ScraperAPI');
    console.log('2. Run full scraper test');
    console.log('3. Deploy to production\n');
    
  } else {
    console.log('\n⚠️  No products found with standard selectors');
    console.log('   This might be a different page layout');
    console.log('   Open /tmp/scraperapi_homedepot.html to inspect\n');
  }
  
} catch (error) {
  console.log('\n❌ ScraperAPI test failed');
  console.log(`   Error: ${error.message}`);
  
  if (error.response) {
    console.log(`   HTTP Status: ${error.response.status}`);
    console.log(`   Response: ${error.response.data.substring(0, 200)}`);
  }
  
  console.log('\n💡 TROUBLESHOOTING:');
  console.log('1. Check your API key is correct');
  console.log('2. Verify you have credits remaining');
  console.log('3. Try the ScraperAPI playground: https://www.scraperapi.com/playground');
}

process.exit(0);
