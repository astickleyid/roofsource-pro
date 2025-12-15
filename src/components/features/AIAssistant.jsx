import React, { useState } from 'react';
import { Sparkles, Search, MapPin, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { findMaterialPrices, findVendorsNearLocation, buildSmartQuote } from '../../services/aiPriceDiscovery';

export const AIAssistant = ({ projectInfo, onAddMaterials, onAddVendors }) => {
  const [activeTab, setActiveTab] = useState('price-finder');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Price Finder State
  const [materialSearch, setMaterialSearch] = useState('');
  const [priceResults, setPriceResults] = useState(null);

  // Vendor Finder State
  const [vendorLocation, setVendorLocation] = useState(projectInfo?.loc || '');
  const [vendorResults, setVendorResults] = useState(null);

  // Smart Quote Builder State
  const [projectDescription, setProjectDescription] = useState('');
  const [quoteResults, setQuoteResults] = useState(null);

  const handlePriceSearch = async () => {
    if (!materialSearch.trim()) return;
    
    setLoading(true);
    setPriceResults(null);
    
    try {
      const result = await findMaterialPrices(
        materialSearch,
        projectInfo?.loc || 'US',
        1
      );
      setPriceResults(result);
    } catch (error) {
      console.error('Price search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSearch = async () => {
    if (!vendorLocation.trim()) return;
    
    setLoading(true);
    setVendorResults(null);
    
    try {
      const result = await findVendorsNearLocation(vendorLocation, []);
      setVendorResults(result);
    } catch (error) {
      console.error('Vendor search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartQuote = async () => {
    if (!projectDescription.trim()) return;
    
    setLoading(true);
    setQuoteResults(null);
    
    try {
      const result = await buildSmartQuote(
        projectDescription,
        projectInfo?.loc || 'US'
      );
      setQuoteResults(result);
    } catch (error) {
      console.error('Smart quote error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMaterialsToScope = () => {
    if (quoteResults?.materials && onAddMaterials) {
      onAddMaterials(quoteResults.materials);
      alert(`Added ${quoteResults.materials.length} materials to scope!`);
    }
  };

  const addVendorsToProject = () => {
    if (vendorResults?.vendors && onAddVendors) {
      onAddVendors(vendorResults.vendors);
      alert(`Added ${vendorResults.vendors.length} vendors to project!`);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={32} className="text-yellow-300" />
          <h2 className="text-2xl font-bold">AI Assistant</h2>
        </div>
        <p className="text-purple-100">
          Get AI-powered pricing, discover vendors, and build smart quotes automatically
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('price-finder')}
          className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'price-finder'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search size={16} className="inline mr-2" />
          Price Finder
        </button>
        <button
          onClick={() => setActiveTab('vendor-finder')}
          className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'vendor-finder'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin size={16} className="inline mr-2" />
          Vendor Finder
        </button>
        <button
          onClick={() => setActiveTab('smart-quote')}
          className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'smart-quote'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart size={16} className="inline mr-2" />
          Smart Quote Builder
        </button>
      </div>

      {/* Price Finder Tab */}
      {activeTab === 'price-finder' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">Search Material Prices</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Name
                </label>
                <input
                  type="text"
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePriceSearch()}
                  placeholder="e.g., Owens Corning Duration Shingles"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <Button
                onClick={handlePriceSearch}
                disabled={loading || !materialSearch.trim()}
                icon={loading ? Loader2 : Search}
                className={loading ? 'animate-spin' : ''}
              >
                {loading ? 'Searching...' : 'Find Prices'}
              </Button>
            </div>

            {priceResults && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-3">Price Discovery Results</h4>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-3 rounded">
                    <div className="text-xs text-gray-500 mb-1">Low</div>
                    <div className="text-lg font-bold text-green-600">
                      ${priceResults.priceRange?.low?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-xs text-gray-500 mb-1">Average</div>
                    <div className="text-lg font-bold text-blue-600">
                      ${priceResults.priceRange?.average?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-xs text-gray-500 mb-1">High</div>
                    <div className="text-lg font-bold text-red-600">
                      ${priceResults.priceRange?.high?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>

                {priceResults.vendors && priceResults.vendors.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-bold text-gray-700 mb-2">Typical Vendors:</div>
                    <div className="flex flex-wrap gap-2">
                      {priceResults.vendors.map((vendor, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-300">
                          {vendor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {priceResults.marketConditions && (
                  <div className="text-sm text-gray-700">
                    <strong>Market Conditions:</strong> {priceResults.marketConditions}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vendor Finder Tab */}
      {activeTab === 'vendor-finder' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">Find Vendors Near You</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (City, State)
                </label>
                <input
                  type="text"
                  value={vendorLocation}
                  onChange={(e) => setVendorLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVendorSearch()}
                  placeholder="e.g., Toledo, OH"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <Button
                onClick={handleVendorSearch}
                disabled={loading || !vendorLocation.trim()}
                icon={loading ? Loader2 : MapPin}
                className={loading ? 'animate-spin' : ''}
              >
                {loading ? 'Searching...' : 'Find Vendors'}
              </Button>
            </div>

            {vendorResults?.vendors && vendorResults.vendors.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-900">
                    Found {vendorResults.vendors.length} Vendors
                  </h4>
                  {onAddVendors && (
                    <Button size="sm" onClick={addVendorsToProject}>
                      Add All to Project
                    </Button>
                  )}
                </div>

                {vendorResults.vendors.map((vendor, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-bold text-gray-900">{vendor.name}</h5>
                        <span className="text-xs text-gray-500">{vendor.type}</span>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {vendor.distance} mi
                      </span>
                    </div>
                    {vendor.specialties && (
                      <div className="text-sm text-gray-600">
                        <strong>Specialties:</strong> {Array.isArray(vendor.specialties) ? vendor.specialties.join(', ') : vendor.specialties}
                      </div>
                    )}
                    {vendor.delivery && (
                      <div className="text-sm text-gray-600">
                        <strong>Delivery:</strong> {vendor.delivery}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Quote Builder Tab */}
      {activeTab === 'smart-quote' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">AI-Powered Quote Builder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your roofing project... e.g., '3,000 sq ft residential re-roof, asphalt shingles, includes tear-off'"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <Button
                onClick={handleSmartQuote}
                disabled={loading || !projectDescription.trim()}
                icon={loading ? Loader2 : TrendingUp}
                className={loading ? 'animate-spin' : ''}
              >
                {loading ? 'Building Quote...' : 'Generate Smart Quote'}
              </Button>
            </div>

            {quoteResults?.materials && quoteResults.materials.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-900">
                    Generated {quoteResults.materials.length} Materials
                  </h4>
                  {onAddMaterials && (
                    <Button size="sm" onClick={addMaterialsToScope}>
                      Add to Scope
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Material</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Qty</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">Est. Price</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {quoteResults.materials.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.notes && <div className="text-xs text-gray-500">{item.notes}</div>}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            ${item.estimatedPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            ${(item.quantity * item.estimatedPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">
                          Total Estimate:
                        </td>
                        <td className="px-4 py-3 text-right text-xl font-bold text-blue-600">
                          ${quoteResults.totalEstimate?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {quoteResults.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <strong>Note:</strong> {quoteResults.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
