/**
 * Enhanced Home Depot Scraper with Proxy Rotation
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { insertProduct, getProductBySku, insertPrice } from '../database/db.js';
import proxyManager from '../utils/proxyManager.js';
import dotenv from 'dotenv';

dotenv.config();

export default class HomeDepotScraperEnhanced {
  constructor() {
    this.productsScraped = 0;
    this.baseUrl = 'https://www.homedepot.com';
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async makeRequest(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const proxyConfig = proxyManager.getAxiosConfig();
        
        const config = {
          ...proxyConfig,
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
          },
          timeout: 15000,
          maxRedirects: 5
        };

        console.log(`📡 Request attempt ${i + 1}/${retries}: ${url}`);
        if (proxyConfig.proxy) {
          console.log(`   Via proxy: ${proxyConfig.proxy.host}:${proxyConfig.proxy.port}`);
        }

        const response = await axios.get(url, config);
        
        // Random delay to mimic human browsing
        await new Promise(resolve => 
          setTimeout(resolve, 1000 + Math.random() * 2000)
        );

        return response;

      } catch (error) {
        console.error(`❌ Request failed (attempt ${i + 1}):`, error.message);
        
        if (error.response?.status === 403) {
          console.log('⚠️  Blocked (403) - rotating proxy...');
        } else if (error.response?.status === 429) {
          console.log('⚠️  Rate limited (429) - waiting longer...');
          await new Promise(resolve => setTimeout(resolve, 10000 * (i + 1)));
        }
        
        if (i < retries - 1) {
          // Exponential backoff
          const delay = 2000 * Math.pow(2, i);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  async scrapeSearchResults(searchTerm, location = 'National') {
    try {
      // Home Depot search URL
      const searchUrl = `${this.baseUrl}/s/${encodeURIComponent(searchTerm)}`;
      
      const response = await this.makeRequest(searchUrl);
      const $ = cheerio.load(response.data);

      const products = [];

      // Parse product cards - adapt selectors to actual HTML structure
      $('.product-pod, [data-pod-type="product"]').each((i, elem) => {
        try {
          const $elem = $(elem);
          
          const name = $elem.find('.product-header__title, .product-title').text().trim();
          const price = $elem.find('.price, .price__numbers').first().text().trim();
          const sku = $elem.attr('data-product-id') || 
                     $elem.find('[data-sku]').attr('data-sku');
          const imageUrl = $elem.find('img').first().attr('src');
          const url = $elem.find('a').first().attr('href');

          if (name && price && sku) {
            products.push({
              name,
              price,
              sku,
              imageUrl,
              url: url ? this.baseUrl + url : null
            });
          }
        } catch (e) {
          console.error('Error parsing product:', e.message);
        }
      });

      console.log(`✅ Home Depot - Scraped ${products.length} products for "${searchTerm}"`);

      // Save to database
      for (const product of products) {
        try {
          const price = this.parsePrice(product.price);
          if (!price) continue;

          await insertProduct(
            product.sku,
            product.name,
            this.extractManufacturer(product.name),
            'Roofing',
            '',
            product.imageUrl
          );

          const dbProduct = await getProductBySku(product.sku);
          
          if (dbProduct) {
            await insertPrice(
              dbProduct.id,
              'Home Depot Pro',
              product.sku,
              price,
              'Each',
              true,
              null,
              location,
              product.url || 'https://www.homedepot.com/b/Building-Materials-Roofing/N-5yc1vZaq7q'
            );
            
            this.productsScraped++;
          }
        } catch (error) {
          console.error(`Error saving HD product ${product.sku}:`, error.message);
        }
      }

      return products.length;

    } catch (error) {
      console.error(`Error scraping Home Depot for "${searchTerm}":`, error.message);
      return 0;
    }
  }

  async scrapeCommonProducts() {
    const searchTerms = [
      'roofing shingles',
      'roof underlayment',
      'ice water shield',
      'drip edge',
      'roofing nails',
      'hip ridge shingles',
      'roof ventilation'
    ];

    let total = 0;
    for (const term of searchTerms) {
      const count = await this.scrapeSearchResults(term);
      total += count;
      
      // Random delay between searches
      await new Promise(resolve => 
        setTimeout(resolve, 3000 + Math.random() * 4000)
      );
    }

    return total;
  }

  parsePrice(priceStr) {
    if (!priceStr) return null;
    const match = priceStr.replace(/[$,]/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  extractManufacturer(productName) {
    const manufacturers = ['GAF', 'Owens Corning', 'CertainTeed', 'IKO', 'Tamko', 'Atlas'];
    for (const mfr of manufacturers) {
      if (productName.includes(mfr)) {
        return mfr;
      }
    }
    return 'Generic';
  }
}
