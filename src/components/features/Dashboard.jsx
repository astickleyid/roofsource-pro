import React from 'react';
import { Edit2, Mail, Box, Eye, AlertCircle, AlertTriangle, Download, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { downloadPurchaseOrder } from '../../services/pdfService';

export const Dashboard = ({ quotes, vendors, scope, projectInfo, onEditScope, onInspectVendor, onSelectVendor }) => {
  
  const handleExportPO = (vendor) => {
    const quote = quotes.find(q => q.id === vendor.id);
    downloadPurchaseOrder(vendor, scope, projectInfo, quote);
  };

  const handleSendPO = (vendor) => {
    const subject = `Purchase Order - ${projectInfo.name}`;
    const body = `Please find attached the purchase order for ${projectInfo.name}.\n\nVendor: ${vendor.name}\nProject: ${projectInfo.name}\nLocation: ${projectInfo.loc}`;
    window.location.href = `mailto:vendor@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <div className="w-full space-y-6 md:space-y-8">
      
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 md:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-1">Market Analysis</h2>
          <p className="text-slate-400 text-xs md:text-sm">Comparing {vendors.length} vendors against {scope.length} scope items.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onEditScope} icon={Edit2} className="w-full sm:w-auto">
          Edit Scope
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {quotes.sort((a,b) => a.total - b.total).map((vendor, index) => {
          const isWinner = index === 0 && vendor.completeness === 100;
          return (
            <div key={vendor.id} className={`bg-white rounded-xl border shadow-sm transition-all hover:shadow-lg flex flex-col ${isWinner ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'}`}>
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {isWinner && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">Best Price</span>}
                    <h3 className="font-bold text-xl text-gray-900">{vendor.name}</h3>
                    <div className="text-xs text-gray-500 mt-1">{vendor.type} • {vendor.distance} mi</div>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vendor.isManual ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    {vendor.isManual ? <Mail size={20}/> : <Box size={20}/>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Total Cost</span>
                    <span className="font-bold text-2xl text-gray-900">${vendor.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Item Coverage</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${vendor.completeness === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                        {vendor.completeness}%
                      </span>
                      {vendor.completeness < 100 && <AlertCircle size={14} className="text-orange-500"/>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Lead Time</span>
                    <span className="text-sm font-medium">{vendor.driveTime + 20} mins est.</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2 rounded-b-xl">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    fullWidth 
                    onClick={() => onInspectVendor(vendor.id)}
                    icon={Eye}
                  >
                    Verify
                  </Button>
                  <Button 
                    variant={vendor.completeness < 100 ? 'secondary' : 'primary'}
                    disabled={vendor.completeness < 100}
                    size="sm" 
                    fullWidth
                    onClick={() => onSelectVendor(vendor.id)}
                  >
                    Select
                  </Button>
                </div>
                {vendor.completeness === 100 && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      fullWidth 
                      onClick={() => handleExportPO(vendor)}
                      icon={Download}
                    >
                      Export PO
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      fullWidth 
                      onClick={() => handleSendPO(vendor)}
                      icon={Send}
                    >
                      Send PO
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {quotes.some(q => q.completeness < 100) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3 items-start">
          <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-orange-800">
            <strong>Incomplete Pricing:</strong> Some vendors are missing prices for items in your scope. 
            Click "Verify" on a vendor card to manually input missing line-item costs.
          </div>
        </div>
      )}

    </div>
  );
};
