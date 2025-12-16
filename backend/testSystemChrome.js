#!/usr/bin/env node
/**
 * Test Puppeteer with system Chrome
 */

import puppeteer from 'puppeteer';

console.log('🧪 Testing Puppeteer with System Chrome\n');

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ]
});

console.log('✅ Browser launched!');

const page = await browser.newPage();
await page.goto('https://www.homedepot.com/b/Building-Materials-Roofing-Roofing-Shingles/N-5yc1vZaqm5', {
  waitUntil: 'networkidle2',
  timeout: 30000
});

const title = await page.title();
console.log(`Page title: ${title}`);

await page.screenshot({ path: '/tmp/hd_test.png' });
console.log('Screenshot: /tmp/hd_test.png');

// Count products
const productCount = await page.evaluate(() => {
  return document.querySelectorAll('[data-testid="product-pod"], .product-pod, [class*="product"]').length;
});

console.log(`Products found: ${productCount}`);

await browser.close();

console.log('\n✅ SUCCESS! Puppeteer works with system Chrome');
console.log('\n💡 To use in scrapers, add to abcSupplyEnhanced.js:');
console.log('   executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"');
