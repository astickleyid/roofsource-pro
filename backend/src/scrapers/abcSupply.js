/**
 * ABC Supply Scraper
 * Scrapes product catalog and pricing from ABC Supply website
 */
import puppeteer from 'puppeteer';
import { insertProduct, insertPrice, getProductBySku } from '../database/db.js';

const ABC_SUPPLY_URL = 'https://www.abcsupply.com';

export class ABCSupplyScraper {
  constructor() {
    this.browser = null;
    this.productsScraped = 0;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeCategory(categoryUrl, location = 'National') {
    const page = await this.browser.newPage();
    
    try {
      // Set realistic headers
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      
      await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for products to load
      await page.waitForSelector('.product-tile, .product-card, [data-product]', { timeout: 10000 });

      // Extract product data
      const products = await page.evaluate(() => {
        const items = [];
        
        // Try multiple selectors (ABC Supply changes their HTML)
        const productElements = document.querySelectorAll('.product-tile, .product-card, [data-product]');
        
        productElements.forEach(el => {
          try {
            // Extract product info (adjust selectors based on actual site)
            const nameEl = el.querySelector('.product-name, .product-title, h3, h4');
            const priceEl = el.querySelector('.price, .product-price, [data-price]');
            const skuEl = el.querySelector('.sku, .product-sku, [data-sku]');
            const imageEl = el.querySelector('img');
            const linkEl = el.querySelector('a');

            if (nameEl && priceEl) {
              items.push({
                name: nameEl.textContent.trim(),
                price: priceEl.textContent.trim(),
                sku: skuEl?.textContent.trim() || '',
                imageUrl: imageEl?.src || '',
                url: linkEl?.href || ''
              });
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });
        
        return items;
      });

      // Save to database
      for (const product of products) {
        try {
          const price = this.parsePrice(product.price);
          if (!price || !product.sku) continue;

          // Insert product
          insertProduct.run(
            product.sku,
            product.name,
            'Unknown', // manufacturer - would need to parse
            'Roofing', // category
            '',
            product.imageUrl
          );

          // Get product ID
          const dbProduct = getProductBySku.get(product.sku);
          
          if (dbProduct) {
            // Insert price
            insertPrice.run(
              dbProduct.id,
              'ABC Supply',
              product.sku,
              price,
              'Each',
              true,
              null,
              location,
              product.url
            );
            
            this.productsScraped++;
          }
        } catch (error) {
          console.error(`Error saving product ${product.sku}:`, error.message);
        }
      }

      console.log(`✅ ABC Supply - Scraped ${products.length} products from ${categoryUrl}`);
      
    } catch (error) {
      console.error(`❌ ABC Supply scraping error:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  async scrapeAllCategories(location = 'National') {
    const categories = [
      '/roofing/shingles',
      '/roofing/underlayment',
      '/roofing/accessories',
      '/roofing/ventilation',
      '/roofing/ice-water-shield'
    ];

    for (const category of categories) {
      try {
        await this.scrapeCategory(`${ABC_SUPPLY_URL}${category}`, location);
        // Random delay to avoid rate limiting
        await this.delay(2000 + Math.random() * 3000);
      } catch (error) {
        console.error(`Failed to scrape category ${category}:`, error.message);
      }
    }

    return this.productsScraped;
  }

  parsePrice(priceStr) {
    // Extract numeric price from string like "$115.50" or "115.50"
    const match = priceStr.match(/[\d,]+\.?\d*/);
    if (!match) return null;
    return parseFloat(match[0].replace(/,/g, ''));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ABCSupplyScraper;
