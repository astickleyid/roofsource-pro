import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'mock-key',
  dangerouslyAllowBrowser: true
});

/**
 * AI-powered material price discovery
 * Searches for current market prices for roofing materials
 */
export const findMaterialPrices = async (materialName, location, quantity = 1) => {
  const hasRealKey = import.meta.env.VITE_OPENAI_API_KEY && 
                     import.meta.env.VITE_OPENAI_API_KEY !== 'mock-key';
  
  if (!hasRealKey) {
    return mockPriceDiscovery(materialName, location, quantity);
  }

  try {
    const prompt = `You are a roofing materials pricing expert. Provide realistic current market pricing for the following material:

Material: ${materialName}
Location: ${location}
Quantity: ${quantity}

Provide:
1. Estimated price range (low, average, high) per unit
2. Typical vendors/suppliers that carry this material
3. Current market conditions affecting price
4. Alternative/equivalent materials if applicable

Return as JSON with structure:
{
  "priceRange": {"low": number, "average": number, "high": number},
  "unit": "string",
  "vendors": ["vendor1", "vendor2", "vendor3"],
  "marketConditions": "brief description",
  "alternatives": [{"name": "string", "price": number}]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert in roofing materials pricing and procurement.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('AI Price Discovery Error:', error);
    return mockPriceDiscovery(materialName, location, quantity);
  }
};

/**
 * Find vendors in a specific location that carry materials
 */
export const findVendorsNearLocation = async (location, materials = []) => {
  const hasRealKey = import.meta.env.VITE_OPENAI_API_KEY && 
                     import.meta.env.VITE_OPENAI_API_KEY !== 'mock-key';
  
  if (!hasRealKey) {
    return mockVendorDiscovery(location, materials);
  }

  try {
    const prompt = `Find roofing material suppliers near ${location}.
${materials.length > 0 ? `Looking for these materials: ${materials.join(', ')}` : ''}

Provide a list of potential vendors with:
- Vendor name
- Estimated distance from ${location}
- Type (Big Box, Specialty Distributor, Local Supplier)
- Typical delivery options
- Known for carrying (if applicable)

Return as JSON array of vendor objects.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert in roofing supply chain and vendor networks.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      success: true,
      vendors: result.vendors || []
    };
  } catch (error) {
    console.error('AI Vendor Discovery Error:', error);
    return mockVendorDiscovery(location, materials);
  }
};

/**
 * Smart quote builder - helps create optimized material lists
 */
export const buildSmartQuote = async (projectDescription, location) => {
  const hasRealKey = import.meta.env.VITE_OPENAI_API_KEY && 
                     import.meta.env.VITE_OPENAI_API_KEY !== 'mock-key';
  
  if (!hasRealKey) {
    return mockSmartQuote(projectDescription);
  }

  try {
    const prompt = `Based on this roofing project description, create a detailed material takeoff:

Project: ${projectDescription}
Location: ${location}

Provide:
1. Complete bill of materials (BOM) with quantities
2. Estimated pricing per item (current market rates)
3. Recommended brands/products
4. Labor considerations
5. Waste factor recommendations

Return as JSON with materials array containing: {name, quantity, unit, estimatedPrice, category, notes}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional roofing estimator with expertise in material takeoffs.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      success: true,
      materials: result.materials || [],
      notes: result.notes || '',
      totalEstimate: result.totalEstimate || 0
    };
  } catch (error) {
    console.error('AI Smart Quote Error:', error);
    return mockSmartQuote(projectDescription);
  }
};

// Mock functions for when no API key is available
function mockPriceDiscovery(materialName, location, quantity) {
  const basePrices = {
    'shingles': 115,
    'underlayment': 45,
    'drip edge': 8.5,
    'nails': 35,
    'ice & water': 65
  };

  const key = Object.keys(basePrices).find(k => 
    materialName.toLowerCase().includes(k)
  );
  const basePrice = basePrices[key] || 50;

  return {
    success: true,
    priceRange: {
      low: basePrice * 0.85,
      average: basePrice,
      high: basePrice * 1.25
    },
    unit: 'Each',
    vendors: ['ABC Supply', 'Beacon Building Products', 'SRS Distribution'],
    marketConditions: 'Prices stable in current market. Local availability good.',
    alternatives: []
  };
}

function mockVendorDiscovery(location) {
  return {
    success: true,
    vendors: [
      {
        name: 'ABC Supply',
        distance: 5,
        type: 'National Distributor',
        delivery: 'Available',
        specialties: ['Owens Corning', 'GAF', 'CertainTeed']
      },
      {
        name: 'Beacon Building Products',
        distance: 12,
        type: 'Specialty Distributor',
        delivery: 'Available',
        specialties: ['Premium materials', 'Commercial roofing']
      },
      {
        name: `${location.split(',')[0]} Roofing Supply`,
        distance: 8,
        type: 'Local Supplier',
        delivery: 'Limited',
        specialties: ['Same-day pickup', 'Local inventory']
      }
    ]
  };
}

function mockSmartQuote(description) {
  return {
    success: true,
    materials: [
      { name: 'Architectural Shingles', quantity: 40, unit: 'Sq', estimatedPrice: 115, category: 'Primary', notes: 'Premium grade recommended' },
      { name: 'Ice & Water Shield', quantity: 4, unit: 'Rolls', estimatedPrice: 65, category: 'Underlayment', notes: 'Valleys and eaves' },
      { name: 'Synthetic Felt', quantity: 6, unit: 'Rolls', estimatedPrice: 45, category: 'Underlayment', notes: 'Main roof deck' },
      { name: 'Drip Edge', quantity: 200, unit: 'LF', estimatedPrice: 0.85, category: 'Trim', notes: 'Eaves and rakes' },
      { name: 'Hip & Ridge Cap', quantity: 8, unit: 'Bdl', estimatedPrice: 55, category: 'Primary', notes: 'Match shingle color' },
      { name: 'Roofing Nails', quantity: 3, unit: 'Box', estimatedPrice: 35, category: 'Fasteners', notes: '1-1/4" coil nails' }
    ],
    notes: 'Estimates based on typical residential re-roof. Adjust for actual measurements.',
    totalEstimate: 6850
  };
}
