import React from 'react';
import { Plus, Trash2, Mail, Box, Eye } from 'lucide-react';
import { Button } from '../ui/Button';

export const VendorManager = ({ vendors, onAddVendor, onDeleteVendor, onInspectVendor }) => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-gray-500">Configure connected APIs and manual suppliers.</p>
        </div>
        <Button onClick={onAddVendor} icon={Plus}>Add Custom Vendor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map(vendor => (
          <div key={vendor.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${vendor.isManual ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {vendor.isManual ? <Mail size={20}/> : <Box size={20}/>}
              </div>
              <button onClick={() => onDeleteVendor(vendor.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 size={16}/>
              </button>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">{vendor.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{vendor.type} • {vendor.distance} mi</p>
            
            <div className="pt-4 border-t border-gray-100 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                fullWidth 
                onClick={() => onInspectVendor(vendor.id)}
                icon={Eye}
              >
                Inspect Pricing
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
