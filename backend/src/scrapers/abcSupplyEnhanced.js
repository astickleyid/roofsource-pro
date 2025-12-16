/**
 * Enhanced ABC Supply Scraper with Proxy & CAPTCHA Support
 */
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import { insertProduct, getProductBySku, insertPrice } from '../database/db.js';
import proxyManager from '../utils/proxyManager.js';
import dotenv from 'dotenv';

dotenv.config();

// Add stealth plugin to evade bot detection
puppeteer.use(StealthPlugin());

// Add reCAPTCHA plugin
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.CAPTCHA_API_KEY || 'APIKEY'
    },
    visualFeedback: true
  })
);

export default class ABCSupplyScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.productsScraped = 0;
    this.baseUrl = 'https://www.abcsupply.com';
  }

  async init() {
    console.log('🌐 Initializing browser with anti-detection...');
    
    const launchOptions = {
      headless: process.env.HEADLESS !== 'false',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        ...proxyManager.getPuppeteerArgs()
      ]
    };

    // Add proxy authentication if available
    const proxy = proxyManager.getProxy();
    if (proxy && proxy.username) {
      console.log(`📡 Using proxy: ${proxy.host}:${proxy.port}`);
    } else {
      console.log('⚠️  No proxy configured - may get rate limited');
    }

    this.browser = await puppeteer.launch(launchOptions);
    this.page = await this.browser.newPage();

    // Authenticate proxy if needed
    if (proxy && proxy.username) {
      await this.page.authenticate({
        username: proxy.username,
        password: proxy.password
      });
    }

    // Set realistic viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Set custom user agent
    await this.page.setUserAgent(
      process.env.USER_AGENT || 
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Remove webdriver flag
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // Add random delays to mimic human behavior
    this.randomDelay = () => new Promise(resolve => 
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );
  }

  async solveCaptcha() {
    console.log('🤖 CAPTCHA detected - attempting to solve...');
    
    try {
      // The plugin will automatically detect and solve reCAPTCHA
      await this.page.solveRecaptchas();
      await this.randomDelay();
      console.log('✅ CAPTCHA solved!');
      return true;
    } catch (error) {
      console.error('❌ Failed to solve CAPTCHA:', error.message);
      return false;
    }
  }

  async navigateWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`📄 Navigating to: ${url} (attempt ${i + 1}/${maxRetries})`);
        
        await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Check for CAPTCHA
        const hasCaptcha = await this.page.$('.g-recaptcha, #recaptcha, [data-sitekey]');
        if (hasCaptcha) {
          const solved = await this.solveCaptcha();
          if (!solved && i < maxRetries - 1) {
            console.log('⏳ Retrying with different proxy...');
            await this.randomDelay();
            continue;
          }
        }

        await this.randomDelay();
        return true;

      } catch (error) {
        console.error(`❌ Navigation failed (attempt ${i + 1}):`, error.message);
        
        if (i < maxRetries - 1) {
          console.log('⏳ Waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
        }
      }
    }
    
    return false;
  }

  async scrapeCategory(categoryUrl, location = 'National') {
    const success = await this.navigateWithRetry(categoryUrl);
    if (!success) {
      console.error(`❌ Failed to access: ${categoryUrl}`);
      return 0;
    }

    try {
      // Wait for products to load with timeout
      await this.page.waitForSelector('.product-card, .product-item, [data-product]', { 
        timeout: 10000 
      }).catch(() => {
        console.log('⚠️  No products found with standard selectors');
      });

      // Extract products - adapt selectors based on actual site structure
      const products = await this.page.evaluate(() => {
        const items = [];
        const productCards = document.querySelectorAll('.product-card, .product-item, [data-product]');
        
        productCards.forEach(card => {
          try {
            const name = card.querySelector('.product-name, .title, h3, h4')?.textContent?.trim();
            const price = card.querySelector('.price, .product-price, [data-price]')?.textContent?.trim();
            const sku = card.querySelector('.sku, [data-sku]')?.textContent?.trim() || 
                       card.getAttribute('data-product-id');
            const imageUrl = card.querySelector('img')?.src;
            const url = card.querySelector('a')?.href;

            if (name && price) {
              items.push({ name, price, sku, imageUrl, url });
            }
          } catch (e) {
            console.error('Error parsing product:', e);
          }
        });

        return items;
      });

      console.log(`✅ Found ${products.length} products`);

      // Save to database
      for (const product of products) {
        try {
          const price = this.parsePrice(product.price);
          if (!price || !product.sku) continue;

          await insertProduct(
            product.sku,
            product.name,
            'Unknown',
            'Roofing',
            '',
            product.imageUrl
          );

          const dbProduct = await getProductBySku(product.sku);
          
          if (dbProduct) {
            await insertPrice(
              dbProduct.id,
              'ABC Supply',
              product.sku,
              price,
              'Each',
              true,
              null,
              location,
              product.url || this.baseUrl + '/shop/roofing'
            );
            
            this.productsScraped++;
          }
        } catch (error) {
          console.error(`Error saving product ${product.sku}:`, error.message);
        }
      }

      return products.length;

    } catch (error) {
      console.error('Error scraping category:', error.message);
      return 0;
    }
  }

  async scrapeAllCategories() {
    const categories = [
      '/shop/roofing/shingles',
      '/shop/roofing/underlayment',
      '/shop/roofing/accessories'
    ];

    let total = 0;
    for (const category of categories) {
      const count = await this.scrapeCategory(this.baseUrl + category);
      total += count;
      
      // Random delay between categories to avoid detection
      await new Promise(resolve => 
        setTimeout(resolve, 3000 + Math.random() * 5000)
      );
    }

    return total;
  }

  parsePrice(priceStr) {
    if (!priceStr) return null;
    const match = priceStr.replace(/[$,]/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    return this.productsScraped;
  }
}
