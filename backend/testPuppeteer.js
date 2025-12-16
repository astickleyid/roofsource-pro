#!/usr/bin/env node
/**
 * Test Puppeteer on Mac
 * 
 * This checks if Puppeteer can launch Chrome on your system.
 */

import puppeteer from 'puppeteer';

console.log('🧪 Testing Puppeteer on macOS\n');
console.log('=' .repeat(60));

try {
  console.log('\n📦 Checking Puppeteer installation...');
  console.log(`   Puppeteer version: ${puppeteer.version || 'unknown'}`);
  
  console.log('\n🌐 Launching browser (headless)...');
  console.log('   This may take 10-30 seconds...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  console.log('✅ Browser launched successfully!');
  
  const page = await browser.newPage();
  console.log('✅ New page created');
  
  console.log('\n📄 Testing navigation...');
  await page.goto('https://example.com', { waitUntil: 'networkidle2' });
  
  const title = await page.title();
  console.log(`✅ Loaded page: "${title}"`);
  
  // Test Home Depot
  console.log('\n📄 Testing Home Depot...');
  await page.goto('https://www.homedepot.com', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  const hdTitle = await page.title();
  console.log(`   Title: ${hdTitle}`);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/homedepot_puppeteer.png' });
  console.log(`   Screenshot saved: /tmp/homedepot_puppeteer.png`);
  
  // Check if we were blocked
  const pageContent = await page.content();
  const isBlocked = pageContent.includes('Error Page') || 
                    pageContent.includes('Access Denied') ||
                    pageContent.includes('CAPTCHA');
  
  if (isBlocked) {
    console.log('   ⚠️  Bot detection triggered (expected without proxy)');
  } else {
    console.log('   ✅ Loaded successfully!');
  }
  
  await browser.close();
  console.log('\n✅ Browser closed');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ PUPPETEER WORKS ON YOUR MAC!\n');
  console.log('💡 NEXT STEPS:');
  console.log('1. View screenshot: open /tmp/homedepot_puppeteer.png');
  console.log('2. Add proxy to avoid bot detection');
  console.log('3. Run: npm run test-scraper\n');
  
} catch (error) {
  console.log('\n❌ PUPPETEER FAILED\n');
  console.log(`Error: ${error.message}\n`);
  
  if (error.message.includes('Failed to launch')) {
    console.log('💡 SOLUTION: Reinstall Puppeteer with Chrome:');
    console.log('   cd /Users/austinstickley/roofsource-pro/backend');
    console.log('   npm uninstall puppeteer');
    console.log('   npm install puppeteer\n');
    console.log('   This will download Chrome (~170 MB)\n');
  } else if (error.message.includes('ECONNREFUSED')) {
    console.log('💡 SOLUTION: Chrome crashed or couldn\'t start');
    console.log('   Try running with headless: false to see what happens\n');
  } else {
    console.log('💡 Unknown error - check logs above\n');
  }
  
  process.exit(1);
}
