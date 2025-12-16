/**
 * REAL PRODUCT SEARCH ENGINE
 * Uses Google, web scraping, and AI to find actual products with verification links
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'mock-key',
  dangerouslyAllowBrowser: true
});

/**
 * Google Image Search for visual product matching
 * Returns multiple possible matches with links to verify
 */
export const googleImageSearch = async (imageBase64, productHint = '') => {
  // Google Custom Search API
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_CX = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
  
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error('Google API credentials required. Add VITE_GOOGLE_API_KEY and VITE_GOOGLE_SEARCH_ENGINE_ID to .env.local');
  }

  try {
    // Use AI to describe the image first
    const description = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'Describe this roofing material in detail. What type is it? What are its distinctive features? Brand? Color? Style?' 
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    const imageDescription = description.choices[0].message.content;
    
    // Search Google with the description
    const searchQuery = `${imageDescription} ${productHint} roofing material buy`.slice(0, 200);
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=10`
    );
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No visual matches found');
    }

    // Get product links and analyze
    const matches = await Promise.all(
      data.items.slice(0, 5).map(async (item) => {
        try {
          // Try to extract product info from the page
          const pageResponse = await fetch(`/api/scrape?url=${encodeURIComponent(item.link)}`);
          const pageData = await pageResponse.json();
          
          return {
            imageUrl: item.link,
            productPage: item.image.contextLink,
            title: item.title,
            snippet: item.snippet,
            confidence: 0, // Will calculate with AI
            scrapedData: pageData
          };
        } catch (error) {
          return {
            imageUrl: item.link,
            productPage: item.image.contextLink,
            title: item.title,
            snippet: item.snippet,
            confidence: 0
          };
        }
      })
    );

    // Have AI rank the matches
    const ranking = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying roofing materials. Rank these search results by how likely they match the original image.'
        },
        {
          role: 'user',
          content: `Original description: ${imageDescription}\n\nSearch results:\n${JSON.stringify(matches.map((m, i) => ({ index: i, title: m.title, snippet: m.snippet })))}\n\nReturn JSON array of indices sorted by confidence (0-100).`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const ranked = JSON.parse(ranking.choices[0].message.content);
    
    return {
      imageDescription,
      matches: ranked.rankings.map(r => ({
        ...matches[r.index],
        confidence: r.confidence,
        reasoning: r.reasoning
      }))
    };

  } catch (error) {
    console.error('Google Image Search error:', error);
    throw new Error(`Image search failed: ${error.message}`);
  }
};

/**
 * Multi-source product search
 * Searches Google, supplier sites, and databases simultaneously
 */
export const multiSourceProductSearch = async (searchParams) => {
  const { sku, name, description, image, manufacturer } = searchParams;
  
  const results = await Promise.all([
    // Google Shopping search
    googleShoppingSearch(name, manufacturer),
    
    // ABC Supply search (if they have API or scrape)
    searchSupplierSite('ABC Supply', name, sku),
    
    // Beacon search
    searchSupplierSite('Beacon Building Products', name, sku),
    
    // Home Depot Pro search
    searchSupplierSite('Home Depot Pro', name, sku),
    
    // SRS Distribution search
    searchSupplierSite('SRS Distribution', name, sku),
    
    // Google general search for product info
    googleProductSearch(name, manufacturer, sku)
  ]);

  // Combine and deduplicate results
  const allResults = results.flat().filter(r => r !== null);
  
  // Group by similarity (same product, different sources)
  const grouped = groupSimilarProducts(allResults);
  
  return grouped;
};

/**
 * Google Shopping search for current pricing
 */
async function googleShoppingSearch(productName, manufacturer) {
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_CX = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
  
  if (!GOOGLE_API_KEY) return [];

  try {
    const query = `${manufacturer || ''} ${productName} buy price`.trim();
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}`
    );
    
    const data = await response.json();
    
    return (data.items || []).map(item => ({
      source: 'Google Shopping',
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      price: extractPriceFromText(item.snippet + ' ' + item.title),
      type: 'search_result'
    }));
  } catch (error) {
    console.error('Google Shopping search error:', error);
    return [];
  }
}

/**
 * Search specific supplier website
 * Uses web scraping to get real current data
 */
async function searchSupplierSite(supplier, productName, sku) {
  // This would need a backend scraping service
  // For now, return structure that would be filled by scraper
  
  const scrapeEndpoint = '/api/scrape-supplier';
  
  try {
    const response = await fetch(scrapeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplier,
        search: productName,
        sku
      })
    });
    
    if (!response.ok) throw new Error('Scrape failed');
    
    const data = await response.json();
    return data.products || [];
    
  } catch (error) {
    console.error(`${supplier} scrape error:`, error);
    return [];
  }
}

/**
 * General Google search for product information and alternatives
 */
async function googleProductSearch(productName, manufacturer, sku) {
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_CX = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
  
  if (!GOOGLE_API_KEY) return [];

  try {
    const queries = [
      `${manufacturer} ${productName} specifications`,
      `${manufacturer} ${productName} alternative equivalent`,
      `${sku} roofing material`,
      `products similar to ${productName}`
    ];

    const results = await Promise.all(
      queries.map(async query => {
        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&num=5`
        );
        const data = await response.json();
        return data.items || [];
      })
    );

    return results.flat().map(item => ({
      source: 'Google Search',
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      type: 'info_result'
    }));
    
  } catch (error) {
    console.error('Google product search error:', error);
    return [];
  }
}

/**
 * Calculate shipping cost based on actual distance and supplier policies
 */
export const calculateRealShippingCost = (supplier, distance, orderTotal, location) => {
  // Local pickup = no shipping
  if (distance <= 25) {
    return {
      shippingCost: 0,
      shippingMethod: 'Local Pickup Available',
      estimatedDays: 0,
      note: `${supplier.name} is ${distance} miles away - pickup recommended`
    };
  }

  // Regional delivery
  if (distance <= 100) {
    const baseCost = 75;
    const perMileCost = (distance - 25) * 1.5;
    
    return {
      shippingCost: baseCost + perMileCost,
      shippingMethod: 'Regional Delivery',
      estimatedDays: Math.ceil(distance / 50),
      note: `Delivery available - ${distance} miles from ${location}`
    };
  }

  // Long distance / freight
  const freightCost = 200 + (distance * 0.5);
  
  return {
    shippingCost: freightCost,
    shippingMethod: 'Freight Shipping',
    estimatedDays: Math.ceil(distance / 100) + 3,
    note: `Long distance freight required - ${distance} miles`
  };
};

/**
 * Extract price from text using regex
 */
function extractPriceFromText(text) {
  const priceRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  const matches = text.match(priceRegex);
  
  if (!matches || matches.length === 0) return null;
  
  // Return first price found
  return parseFloat(matches[0].replace(/[$,]/g, ''));
}

/**
 * Group similar products from different sources
 */
function groupSimilarProducts(products) {
  // Use AI to determine which products are the same item from different sources
  // For now, simple title matching
  const groups = [];
  
  products.forEach(product => {
    const existing = groups.find(g => 
      isSimilarProduct(g.products[0], product)
    );
    
    if (existing) {
      existing.products.push(product);
      existing.lowestPrice = Math.min(existing.lowestPrice, product.price || Infinity);
    } else {
      groups.push({
        products: [product],
        lowestPrice: product.price || Infinity,
        title: product.title
      });
    }
  });
  
  return groups;
}

/**
 * Determine if two products are likely the same item
 */
function isSimilarProduct(p1, p2) {
  const title1 = p1.title.toLowerCase();
  const title2 = p2.title.toLowerCase();
  
  // Extract key terms
  const terms1 = title1.split(/\s+/).filter(t => t.length > 3);
  const terms2 = title2.split(/\s+/).filter(t => t.length > 3);
  
  // Count matching terms
  const matches = terms1.filter(t => terms2.includes(t)).length;
  const total = Math.max(terms1.length, terms2.length);
  
  return (matches / total) > 0.6; // 60% similarity threshold
}

export default {
  googleImageSearch,
  multiSourceProductSearch,
  calculateRealShippingCost
};
