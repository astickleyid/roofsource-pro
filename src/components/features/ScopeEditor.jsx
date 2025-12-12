import React, { useState } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { Button } from '../ui/Button';

const MATERIAL_CATALOG = [
  { id: 'OC-DUR-DRIFT', name: "Owens Corning Duration - Driftwood", unit: "Sq", defaultPrice: 115.00 },
  { id: 'OC-DUR-ONYX', name: "Owens Corning Duration - Onyx Black", unit: "Sq", defaultPrice: 115.00 },
  { id: 'IWS-ROLL', name: "Ice & Water Shield (Generic)", unit: "Rolls", defaultPrice: 65.00 },
  { id: 'SYN-FELT', name: "Synthetic Underlayment", unit: "Rolls", defaultPrice: 45.00 },
  { id: 'DRIP-EDGE', name: "Drip Edge (White) 10'", unit: "Pcs", defaultPrice: 8.50 },
  { id: 'HIP-RIDGE', name: "Hip & Ridge Shingles", unit: "Bdl", defaultPrice: 55.00 },
  { id: 'COIL-NAILS', name: "Coil Nails 1-1/4\"", unit: "Box", defaultPrice: 35.00 },
];

export const ScopeEditor = ({ scope, onUpdateQty, onRemoveItem, onAddItem }) => {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const handleAddItem = (catalogId) => {
    onAddItem(catalogId);
    setIsCatalogOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bill of Materials</h2>
          <p className="text-gray-500">Manage the required materials for this project.</p>
        </div>
        <Button onClick={() => setIsCatalogOpen(true)} icon={Plus}>Add Material</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Material Name</th>
              <th className="px-6 py-4 font-semibold text-gray-700">SKU / ID</th>
              <th className="px-6 py-4 font-semibold text-gray-700 w-32">Quantity</th>
              <th className="px-6 py-4 font-semibold text-gray-700 w-24">Unit</th>
              <th className="px-6 py-4 font-semibold text-gray-700 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {scope.map((item) => {
              const catItem = MATERIAL_CATALOG.find(c => c.id === item.id);
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{catItem?.name || "Unknown Item"}</td>
                  <td className="px-6 py-4 font-mono text-gray-500 text-xs">{item.id}</td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => onUpdateQty(item.id, e.target.value)}
                      className="w-20 px-2 py-1 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 text-gray-500">{catItem?.unit}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onRemoveItem(item.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {scope.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                  No items in scope. Click "Add Material" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Add to Scope</h3>
              <button onClick={() => setIsCatalogOpen(false)}><X size={20}/></button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {MATERIAL_CATALOG.map(item => {
                const isAdded = scope.find(s => s.id === item.id);
                return (
                  <button 
                    key={item.id}
                    disabled={isAdded}
                    onClick={() => handleAddItem(item.id)}
                    className="w-full text-left p-3 hover:bg-blue-50 rounded-lg flex justify-between items-center group transition-colors disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">Unit: {item.unit} • Est: ${item.defaultPrice}</div>
                    </div>
                    {isAdded ? <Check size={18} className="text-green-600"/> : <Plus size={18} className="text-blue-600 opacity-0 group-hover:opacity-100"/>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
