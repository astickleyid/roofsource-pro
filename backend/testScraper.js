#!/usr/bin/env node
/**
 * Test Enhanced Scraper
 * Run: node testScraper.js
 */

import ABCSupplyEnhanced from './src/scrapers/abcSupplyEnhanced.js';
import HomeDepotEnhanced from './src/scrapers/homeDepotEnhanced.js';
import { setupDatabase } from './src/database/db.js';

async function testScrapers() {
  console.log('🧪 Testing Enhanced Scrapers\n');
  
  // Setup DB
  await setupDatabase();

  // Test Home Depot (easier, HTTP-based)
  console.log('\n📦 Testing Home Depot Enhanced Scraper...');
  try {
    const hdScraper = new HomeDepotEnhanced();
    const hdCount = await hdScraper.scrapeSearchResults('roofing shingles', 'National');
    console.log(`✅ Home Depot: ${hdCount} products`);
  } catch (error) {
    console.error('❌ Home Depot failed:', error.message);
  }

  // Test ABC Supply (harder, needs browser)
  console.log('\n📦 Testing ABC Supply Enhanced Scraper...');
  console.log('⚠️  This will launch a browser window...\n');
  
  try {
    const abcScraper = new ABCSupplyEnhanced();
    await abcScraper.init();
    
    // Test single category
    const abcCount = await abcScraper.scrapeCategory(
      'https://www.abcsupply.com/shop/roofing',
      'National'
    );
    
    console.log(`✅ ABC Supply: ${abcCount} products`);
    await abcScraper.close();
  } catch (error) {
    console.error('❌ ABC Supply failed:', error.message);
    console.log('\n💡 This is expected without proxy setup.');
    console.log('   See PROXY_CAPTCHA_SETUP.md for configuration.\n');
  }

  console.log('\n✅ Test complete!');
  console.log('\nNext steps:');
  console.log('1. Check backend/PROXY_CAPTCHA_SETUP.md');
  console.log('2. Add proxy credentials to .env');
  console.log('3. Run: npm run scrape');
}

testScrapers().catch(console.error);
