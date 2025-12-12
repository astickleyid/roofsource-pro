import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const parseQuoteWithAI = async (text) => {
  try {
    const systemPrompt = `You are a specialized parser for roofing material quotes. 
Extract line items from unstructured email or quote text into a JSON array.
Each item should have:
- name: string (material description)
- qty: number (quantity)
- unitPrice: number (price per unit)
- unit: string (e.g., "Sq", "Rolls", "Pcs", "Bdl", "Box")

Return ONLY valid JSON array. If no items found, return empty array [].`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    return {
      success: true,
      items: parsed.items || parsed.lineItems || parsed
    };
  } catch (error) {
    console.error('AI Parsing Error:', error);
    return {
      success: false,
      error: error.message,
      items: []
    };
  }
};

export const parseQuoteWithAIMock = async (text) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lines = text.split('\n').filter(line => line.trim());
  const items = [];
  
  const priceRegex = /\$?\s?([0-9]{1,3}(,[0-9]{3})*(\.[0-9]{2})?)/g;
  const qtyRegex = /(\d+)\s*(sq|square|roll|piece|bundle|box|pcs|bdl)/i;
  
  lines.forEach(line => {
    const qtyMatch = line.match(qtyRegex);
    const prices = [...line.matchAll(priceRegex)];
    
    if (qtyMatch && prices.length > 0) {
      const qty = parseInt(qtyMatch[1]);
      const price = parseFloat(prices[0][1].replace(/,/g, ''));
      
      items.push({
        name: line.split(/\d/)[0].trim() || 'Unknown Material',
        qty: qty || 1,
        unitPrice: price || 0,
        unit: qtyMatch[2] || 'Units'
      });
    }
  });
  
  return {
    success: items.length > 0,
    items,
    error: items.length === 0 ? 'No items could be parsed' : null
  };
};

export const parseQuoteEmail = async (emailText, useAI = false) => {
  if (useAI && process.env.REACT_APP_OPENAI_API_KEY) {
    return await parseQuoteWithAI(emailText);
  }
  return await parseQuoteWithAIMock(emailText);
};
