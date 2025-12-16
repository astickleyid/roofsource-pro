/**
 * Home Depot Pro Scraper
 * Scrapes Home Depot Pro website for contractor pricing
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { insertProduct, insertPrice, getProductBySku } from '../database/db.js';

const HD_BASE_URL = 'https://www.homedepot.com';
const HD_SEARCH_API = 'https://www.homedepot.com/federation-gateway/graphql';

export class HomeDepotScraper {
  constructor() {
    this.productsScraped = 0;
  }

  async searchProducts(query, location = 'National') {
    try {
      // Home Depot has a GraphQL API we can use
      const searchUrl = `${HD_BASE_URL}/s/${encodeURIComponent(query)}?NCNI-5`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      const $ = cheerio.load(response.data);
      const products = [];

      // Parse product grid
      $('.product-pod, [data-product-id]').each((i, el) => {
        const $el = $(el);
        
        const name = $el.find('.product-header__title, .product-pod__title').text().trim();
        const price = $el.find('.price, .price__numbers').first().text().trim();
        const sku = $el.attr('data-product-id') || $el.find('[data-sku]').attr('data-sku');
        const imageUrl = $el.find('img').first().attr('src');
        const productUrl = $el.find('a').first().attr('href');

        if (name && price && sku) {
          products.push({
            name,
            price,
            sku,
            imageUrl,
            url: productUrl ? `${HD_BASE_URL}${productUrl}` : ''
          });
        }
      });

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
              product.url
            );
            
            this.productsScraped++;
          }
        } catch (error) {
          console.error(`Error saving HD product ${product.sku}:`, error.message);
        }
      }

      console.log(`✅ Home Depot - Scraped ${products.length} products for "${query}"`);
      return products.length;

    } catch (error) {
      console.error('❌ Home Depot scraping error:', error.message);
      return 0;
    }
  }

  async scrapeCommonProducts(location = 'National') {
    const searches = [
      'roofing shingles',
      'roof underlayment',
      'ice water shield',
      'drip edge',
      'roofing nails',
      'hip ridge shingles',
      'roof ventilation'
    ];

    for (const search of searches) {
      await this.searchProducts(search, location);
      await this.delay(3000 + Math.random() * 2000);
    }

    return this.productsScraped;
  }

  parsePrice(priceStr) {
    const match = priceStr.match(/[\d,]+\.?\d*/);
    if (!match) return null;
    return parseFloat(match[0].replace(/,/g, ''));
  }

  extractManufacturer(productName) {
    const brands = ['GAF', 'Owens Corning', 'CertainTeed', 'IKO', 'Tamko', 'Atlas'];
    for (const brand of brands) {
      if (productName.includes(brand)) {
        return brand;
      }
    }
    return 'Unknown';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default HomeDepotScraper;
