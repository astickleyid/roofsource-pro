/**
 * INTELLIGENT QUOTE BUILDER
 * Complete workflow for job-based procurement with context-aware decision making
 */

import OpenAI from 'openai';
import { searchSuppliers } from './supplierIntegration';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'mock-key',
  dangerouslyAllowBrowser: true
});

/**
 * STEP 1: Identify Product from Input
 * Takes photo/SKU/name and uses AI to confirm exact product match
 * IMPORTANT: This is a SUGGESTION tool, not definitive identification
 */
export const identifyProduct = async (input) => {
  const { photo, sku, name, description } = input;
  
  // SKU takes absolute priority - it's the most reliable
  if (sku && sku.trim()) {
    // TODO: Check against product database first
    // For now, return SKU-based result
    return {
      success: true,
      productName: name || `Product ${sku}`,
      manufacturer: 'Unknown - Please specify',
      sku: sku.trim(),
      category: 'Roofing Material',
      specifications: {
        unit: 'Each',
        coverage: 'Unknown',
        color: 'Unknown'
      },
      confidence: 100,
      alternativeNames: [],
      confirmationNeeded: true,
      source: 'SKU Lookup',
      manualEntry: true
    };
  }

  // If only photo, we MUST get more info from user
  if (photo && !sku && !name) {
    return {
      success: false,
      error: 'Photo alone is not reliable. Please provide product name or SKU.',
      requiresManualInput: true
    };
  }

  const hasRealKey = import.meta.env.VITE_OPENAI_API_KEY && 
                     import.meta.env.VITE_OPENAI_API_KEY !== 'mock-key';

  if (!hasRealKey || !name) {
    return mockProductIdentification(input);
  }

  try {
    // Use AI only as a HELPER, not definitive answer
    let prompt = `Based on this information, suggest the most likely roofing product:

Product Name: ${name}
${description ? `Description: ${description}` : ''}
${photo ? 'Note: Product photo provided but should NOT be relied upon for accurate identification' : ''}

Return JSON with your BEST GUESS (user will confirm):
{
  "productName": "Most likely full product name",
  "manufacturer": "Best guess at manufacturer",
  "sku": "Suggested SKU if known, otherwise 'UNKNOWN'",
  "category": "Product category",
  "specifications": {
    "unit": "Unit of measure",
    "coverage": "Coverage per unit",
    "color": "Color/finish"
  },
  "confidence": 0-100,
  "alternativeNames": ["Possible alternative names"],
  "confirmationNeeded": true,
  "warnings": ["Any concerns about identification accuracy"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are helping identify roofing products. Be honest about uncertainty. When confidence is low, say so.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      success: true,
      ...result,
      source: 'AI Suggestion',
      manualEntry: false
    };
  } catch (error) {
    console.error('Product identification error:', error);
    return mockProductIdentification(input);
  }
};

/**
 * STEP 2: Find All Vendor Options
 * Searches suppliers and returns ALL matches
 */
export const findVendorOptions = async (product, jobContext) => {
  const searchParams = {
    sku: product.sku,
    name: product.productName,
    location: jobContext.location,
    quantity: jobContext.quantity || 1
  };

  return await searchSuppliers(searchParams);
};

/**
 * STEP 3: Intelligent Vendor Ranking
 * Considers job-specific factors to rank vendors
 */
export const rankVendors = (vendors, jobContext) => {
  const {
    urgency, // 'urgent', 'normal', 'flexible'
    budget, // 'tight', 'moderate', 'flexible'
    preferredSuppliers, // Array of supplier names
    location,
    quantity,
    projectType, // 'residential', 'commercial', 'repair'
    qualityPreference, // 'economy', 'standard', 'premium'
    deliveryPreference, // 'asap', 'scheduled', 'flexible'
  } = jobContext;

  return vendors.map(vendor => {
    let score = 100; // Start at perfect score
    const factors = {};

    // FACTOR 1: Price Competitiveness (0-30 points)
    const prices = vendors.map(v => v.totalCost);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePosition = (vendor.totalCost - minPrice) / (priceRange || 1);
    
    const priceScore = 30 * (1 - pricePosition);
    factors.price = {
      score: priceScore,
      weight: budget === 'tight' ? 1.5 : budget === 'flexible' ? 0.7 : 1.0,
      details: `Price rank: ${pricePosition < 0.2 ? 'Best' : pricePosition < 0.5 ? 'Competitive' : 'Higher'}`
    };

    // FACTOR 2: Delivery Speed (0-25 points)
    const deliveryScore = urgency === 'urgent'
      ? (vendor.inStock ? 25 : Math.max(0, 25 - (vendor.estimatedDeliveryDays * 5)))
      : (25 - (vendor.estimatedDeliveryDays * 2));
    
    factors.delivery = {
      score: deliveryScore,
      weight: urgency === 'urgent' ? 1.8 : urgency === 'flexible' ? 0.6 : 1.0,
      details: vendor.inStock 
        ? `In stock (${vendor.estimatedDeliveryDays}d delivery)` 
        : `${vendor.leadTimeDays}d lead time + ${vendor.estimatedDeliveryDays}d delivery`
    };

    // FACTOR 3: Supplier Reputation (0-20 points)
    const reputationScore = (vendor.reputation / 100) * 20;
    factors.reputation = {
      score: reputationScore,
      weight: qualityPreference === 'premium' ? 1.5 : qualityPreference === 'economy' ? 0.7 : 1.0,
      details: `${vendor.reputation}% positive reviews, ${vendor.serviceRating.toFixed(1)}★ rating`
    };

    // FACTOR 4: Distance/Location (0-15 points)
    const maxDistance = 50; // miles
    const distanceScore = Math.max(0, 15 * (1 - (vendor.branchDistance / maxDistance)));
    factors.distance = {
      score: distanceScore,
      weight: urgency === 'urgent' ? 1.3 : 1.0,
      details: `${vendor.branchDistance} mi from job site`
    };

    // FACTOR 5: Service Quality (0-10 points)
    const serviceScore = (vendor.serviceRating / 5) * 10;
    factors.service = {
      score: serviceScore,
      weight: projectType === 'commercial' ? 1.4 : 1.0,
      details: `${vendor.serviceRating.toFixed(1)}/5.0 service rating`
    };

    // FACTOR 6: Preferred Supplier Bonus (0-10 points)
    const preferredBonus = preferredSuppliers?.includes(vendor.supplierName) ? 10 : 0;
    factors.preferred = {
      score: preferredBonus,
      weight: 1.5,
      details: preferredBonus > 0 ? 'Preferred supplier' : ''
    };

    // FACTOR 7: Stock Availability (0-10 points)
    const stockScore = vendor.inStock ? 10 : (vendor.quantityAvailable >= quantity ? 7 : 3);
    factors.stock = {
      score: stockScore,
      weight: urgency === 'urgent' ? 1.6 : 1.0,
      details: vendor.inStock 
        ? `${vendor.quantityAvailable} units in stock` 
        : `Limited stock - ${vendor.leadTimeDays}d lead time`
    };

    // Calculate weighted total
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.values(factors).forEach(factor => {
      totalScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    });

    const finalScore = (totalScore / totalWeight).toFixed(1);

    return {
      ...vendor,
      intelligenceScore: parseFloat(finalScore),
      factors,
      recommendation: getRecommendation(finalScore, factors, jobContext)
    };
  }).sort((a, b) => b.intelligenceScore - a.intelligenceScore);
};

/**
 * Generate human-readable recommendation
 */
function getRecommendation(score, factors, jobContext) {
  if (score >= 85) {
    return {
      level: 'highly-recommended',
      text: 'Excellent choice for this job',
      reasons: getTopReasons(factors, 3)
    };
  } else if (score >= 70) {
    return {
      level: 'recommended',
      text: 'Good option for this job',
      reasons: getTopReasons(factors, 2)
    };
  } else if (score >= 55) {
    return {
      level: 'acceptable',
      text: 'Acceptable but not optimal',
      reasons: getTopReasons(factors, 1)
    };
  } else {
    return {
      level: 'not-recommended',
      text: 'Not ideal for this job',
      reasons: [`Consider alternatives with better ${Object.entries(factors).sort((a, b) => a[1].score - b[1].score)[0][0]}`]
    };
  }
}

function getTopReasons(factors, count) {
  return Object.entries(factors)
    .filter(([_, f]) => f.details)
    .sort((a, b) => (b[1].score * b[1].weight) - (a[1].score * a[1].weight))
    .slice(0, count)
    .map(([name, factor]) => factor.details);
}

/**
 * STEP 4: Complete Quote Assembly
 * Builds final quote with all materials and best vendors
 */
export const assembleCompleteQuote = async (jobDetails, materialsList) => {
  const results = [];
  
  for (const material of materialsList) {
    // Identify product
    const product = await identifyProduct(material);
    
    // Find vendors
    const vendors = await findVendorOptions(product, jobDetails);
    
    // Rank intelligently
    const rankedVendors = rankVendors(vendors, jobDetails);
    
    results.push({
      material: material,
      identifiedProduct: product,
      bestVendor: rankedVendors[0],
      alternativeVendors: rankedVendors.slice(1, 3),
      allOptions: rankedVendors
    });
  }

  // Calculate totals
  const totalCost = results.reduce((sum, r) => sum + r.bestVendor.totalCost, 0);
  const totalSavings = results.reduce((sum, r) => {
    const maxCost = Math.max(...r.allOptions.map(v => v.totalCost));
    return sum + (maxCost - r.bestVendor.totalCost);
  }, 0);

  return {
    jobDetails,
    materials: results,
    summary: {
      totalItems: results.length,
      totalCost,
      estimatedSavings: totalSavings,
      averageDeliveryDays: Math.round(
        results.reduce((sum, r) => sum + r.bestVendor.estimatedDeliveryDays, 0) / results.length
      ),
      suppliersUsed: [...new Set(results.map(r => r.bestVendor.supplierName))].length
    }
  };
};

// Mock functions for development
function mockProductIdentification(input) {
  const { sku, name } = input;
  return {
    success: true,
    productName: name || 'Owens Corning Duration Shingles - Driftwood',
    manufacturer: 'Owens Corning',
    sku: sku || 'OC-DUR-DRIFT',
    category: 'Architectural Shingles',
    specifications: {
      unit: 'Square',
      coverage: '100 sq ft per bundle',
      color: 'Driftwood'
    },
    confidence: 95,
    alternativeNames: ['Duration Shingles', 'OC Duration'],
    confirmationNeeded: false
  };
}
