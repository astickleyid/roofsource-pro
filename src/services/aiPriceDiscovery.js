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
    throw new Error('OpenAI API key required. Add VITE_OPENAI_API_KEY to .env.local');
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
    throw new Error(`Failed to get pricing data: ${error.message}`);
  }
};

/**
 * Find vendors in a specific location that carry materials
 */
export const findVendorsNearLocation = async (location, materials = []) => {
  const hasRealKey = import.meta.env.VITE_OPENAI_API_KEY && 
                     import.meta.env.VITE_OPENAI_API_KEY !== 'mock-key';
  
  if (!hasRealKey) {
    throw new Error('OpenAI API key required. Add VITE_OPENAI_API_KEY to .env.local');
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
    throw new Error(`Failed to find vendors: ${error.message}`);
  }
};

/**
 * Smart quote builder - helps create optimized material lists
 */
export const buildSmartQuote = async (projectDescription, location) => {
  const hasRealKey = import.meta.env.VITE_OPENAI_API_KEY && 
                     import.meta.env.VITE_OPENAI_API_KEY !== 'mock-key';
  
  if (!hasRealKey) {
    throw new Error('OpenAI API key required. Add VITE_OPENAI_API_KEY to .env.local');
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
    throw new Error(`Failed to generate quote: ${error.message}`);
  }
};

// Remove all mock functions - they're gone
