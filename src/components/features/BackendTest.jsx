import React, { useState } from 'react';
import { Button } from '../ui/Button';

export const BackendTest = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [priceResults, setPriceResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:3001/api';

  const testSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/products/search?q=shingles`);
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/products/OC-DUR-DRIFT/prices`);
      const data = await response.json();
      setPriceResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Backend API Test</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Backend URL:</strong> {API_URL}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <Button onClick={testSearch} disabled={loading}>
          Test Product Search (shingles)
        </Button>
        
        <Button onClick={testPrices} disabled={loading} variant="secondary">
          Test Price Lookup (OC-DUR-DRIFT)
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-900 font-semibold">Error:</p>
          <p className="text-red-700">{error}</p>
          <p className="text-sm text-red-600 mt-2">
            Make sure backend is running: <code>cd backend && node src/server.js</code>
          </p>
        </div>
      )}

      {searchResults && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <p className="text-sm text-gray-600 mb-4">
            Found {searchResults.count} products
          </p>
          <div className="space-y-3">
            {searchResults.products?.map((product) => (
              <div key={product.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <p className="text-sm text-gray-600">Manufacturer: {product.manufacturer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {priceResults && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Price Comparison</h2>
          <p className="font-semibold mb-2">{priceResults.product?.name}</p>
          <p className="text-sm text-gray-600 mb-4">
            {priceResults.product?.manufacturer} - SKU: {priceResults.product?.sku}
          </p>
          
          <div className="space-y-3">
            {priceResults.prices?.map((price, idx) => (
              <div 
                key={idx} 
                className={`border rounded-lg p-4 ${idx === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">{price.supplier}</p>
                    {idx === 0 && <span className="text-xs text-green-700 font-semibold">BEST PRICE</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">${price.price}</p>
                    <p className="text-sm text-gray-600">per {price.unit}</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className={price.inStock ? 'text-green-600' : 'text-red-600'}>
                    {price.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                  </span>
                  <a 
                    href={price.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Product →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to Use in Your App:</h3>
        <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`// Search for products
const searchResponse = await fetch(
  \`\${import.meta.env.VITE_BACKEND_API}/products/search?q=shingles\`
);
const { products } = await searchResponse.json();

// Get prices for a specific SKU
const priceResponse = await fetch(
  \`\${import.meta.env.VITE_BACKEND_API}/products/OC-DUR-DRIFT/prices\`
);
const { prices } = await priceResponse.json();

// prices[0] is always the cheapest!`}
        </pre>
      </div>
    </div>
  );
};
