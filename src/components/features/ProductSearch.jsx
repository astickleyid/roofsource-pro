import React, { useState } from 'react';
import { Search, Package, MapPin, TrendingUp, Clock, Star, Truck, DollarSign, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { searchSuppliers } from '../../services/supplierIntegration';

export const ProductSearch = ({ projectInfo, onSelectOffer }) => {
  const [searching, setSearching] = useState(false);
  const [searchParams, setSearchParams] = useState({
    sku: '',
    name: '',
    image: null,
    location: projectInfo?.loc || '',
    quantity: 1
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [sortBy, setSortBy] = useState('best-value'); // best-value, price, delivery, rating

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSearchParams({ ...searchParams, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!searchParams.sku && !searchParams.name && !searchParams.image) return;
    
    setSearching(true);
    setResults(null);
    
    try {
      const offers = await searchSuppliers(searchParams);
      setResults(offers);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching suppliers. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const getSortedResults = () => {
    if (!results) return [];
    
    const sorted = [...results];
    switch (sortBy) {
      case 'price':
        return sorted.sort((a, b) => a.totalCost - b.totalCost);
      case 'delivery':
        return sorted.sort((a, b) => a.estimatedDeliveryDays - b.estimatedDeliveryDays);
      case 'rating':
        return sorted.sort((a, b) => b.score - a.score);
      default: // best-value
        return sorted;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Search Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="text-blue-600" />
          Find Exact Product & Pricing
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU / Model Number
            </label>
            <input
              type="text"
              value={searchParams.sku}
              onChange={(e) => setSearchParams({ ...searchParams, sku: e.target.value })}
              placeholder="e.g., OC-DUR-DRIFT, 12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={searchParams.name}
              onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
              placeholder="e.g., Owens Corning Duration Shingles"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Location
            </label>
            <input
              type="text"
              value={searchParams.location}
              onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
              placeholder="e.g., Toledo, OH or 43604"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Needed
            </label>
            <input
              type="number"
              min="1"
              value={searchParams.quantity}
              onChange={(e) => setSearchParams({ ...searchParams, quantity: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Photo (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Product" className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300" />
            </div>
          )}
        </div>

        <Button
          onClick={handleSearch}
          disabled={searching || (!searchParams.sku && !searchParams.name && !searchParams.image)}
          icon={Search}
          size="lg"
          className="w-full md:w-auto"
        >
          {searching ? 'Searching All Suppliers...' : 'Search Suppliers'}
        </Button>
      </div>

      {/* Results */}
      {results && results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Found {results.length} Offers from {new Set(results.map(r => r.supplierName)).size} Suppliers
            </h3>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="best-value">Best Value</option>
              <option value="price">Lowest Price</option>
              <option value="delivery">Fastest Delivery</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          <div className="space-y-4">
            {getSortedResults().map((offer, idx) => (
              <div
                key={idx}
                className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                  idx === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                {idx === 0 && (
                  <div className="mb-3">
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                      ⭐ Best Value
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Supplier Info */}
                  <div className="lg:col-span-3">
                    <div className="font-bold text-lg text-gray-900 mb-1">{offer.supplierName}</div>
                    <div className="text-sm text-gray-600 mb-2">{offer.branchLocation}</div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="text-yellow-500 fill-yellow-500" size={14} />
                      <span className="font-medium">{offer.serviceRating.toFixed(1)}</span>
                      <span className="text-gray-500">({offer.reputation}% positive)</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="lg:col-span-4">
                    <div className="font-medium text-gray-900 mb-1">{offer.productName}</div>
                    <div className="text-sm text-gray-600 mb-2">SKU: {offer.sku}</div>
                    {offer.inStock ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <Award size={14} />
                        <span>In Stock ({offer.quantityAvailable} available)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                        <Clock size={14} />
                        <span>{offer.leadTimeDays} days lead time</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="lg:col-span-3">
                    <div className="text-sm text-gray-600 mb-1">Unit Price</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      ${offer.unitPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>Subtotal: ${(offer.unitPrice * searchParams.quantity).toFixed(2)}</div>
                      <div>Shipping: ${offer.shippingCost.toFixed(2)}</div>
                      <div>Tax & Fees: ${((offer.unitPrice * searchParams.quantity * offer.taxRate) + offer.handlingFee).toFixed(2)}</div>
                      <div className="font-bold text-gray-900 text-sm pt-1 border-t border-gray-300">
                        Total: ${offer.totalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Action */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Truck size={14} />
                      <span>{offer.estimatedDeliveryDays} days</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <MapPin size={14} />
                      <span>{offer.branchDistance} mi</span>
                    </div>
                    {onSelectOffer && (
                      <Button
                        size="sm"
                        onClick={() => onSelectOffer(offer)}
                        className="w-full"
                      >
                        Select Offer
                      </Button>
                    )}
                  </div>
                </div>

                {offer.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-blue-600">
                    💡 {offer.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Package className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">Try different search terms or check the SKU/product name</p>
        </div>
      )}
    </div>
  );
};
