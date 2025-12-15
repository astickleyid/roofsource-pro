import React, { useState } from 'react';
import { 
  PackageSearch, MapPin, Menu, X, BarChart3, Box, Users, BrainCircuit, Check, LogOut, Grid3x3
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import { Button } from './components/ui/Button';
import { ScopeEditor } from './components/features/ScopeEditor';
import { VendorManager } from './components/features/VendorManager';
import { Dashboard } from './components/features/Dashboard';
import { PricingWorkbench } from './components/features/PricingWorkbench';
import { parseQuoteEmail } from './services/openaiService';

const MATERIAL_CATALOG = [
  { id: 'OC-DUR-DRIFT', name: "Owens Corning Duration - Driftwood", unit: "Sq", defaultPrice: 115.00 },
  { id: 'OC-DUR-ONYX', name: "Owens Corning Duration - Onyx Black", unit: "Sq", defaultPrice: 115.00 },
  { id: 'IWS-ROLL', name: "Ice & Water Shield (Generic)", unit: "Rolls", defaultPrice: 65.00 },
  { id: 'SYN-FELT', name: "Synthetic Underlayment", unit: "Rolls", defaultPrice: 45.00 },
  { id: 'DRIP-EDGE', name: "Drip Edge (White) 10'", unit: "Pcs", defaultPrice: 8.50 },
  { id: 'HIP-RIDGE', name: "Hip & Ridge Shingles", unit: "Bdl", defaultPrice: 55.00 },
  { id: 'COIL-NAILS', name: "Coil Nails 1-1/4\"", unit: "Box", defaultPrice: 35.00 },
];

function RoofSourceProContent() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  // Mock user for development
  const user = { email: 'demo@example.com' };
  const logout = () => navigate('/');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [inspectingVendorId, setInspectingVendorId] = useState(null);
  const [parserText, setParserText] = useState("");
  const [parsing, setParsing] = useState(false);

  const {
    scope,
    vendors,
    projectInfo,
    quotes,
    updateScopeQty,
    removeScopeItem,
    addScopeItem,
    addVendor,
    deleteVendor,
    updateVendorPrice
  } = useProject();

  const parseBulkText = async (vendorId) => {
    setParsing(true);
    const result = await parseQuoteEmail(parserText, false);
    setParsing(false);
    
    if (result.success && result.items.length > 0) {
      result.items.forEach(item => {
        if (item.unitPrice && item.unitPrice > 0) {
          const materialId = scope.find(s => 
            s.name?.toLowerCase().includes(item.name.toLowerCase())
          )?.id;
          
          if (materialId) {
            updateVendorPrice(vendorId, materialId, item.unitPrice);
          }
        }
      });
      alert(`Successfully parsed ${result.items.length} items!`);
    } else {
      alert(result.error || "No items could be parsed from the text.");
    }
    setParserText("");
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderSidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-white w-64 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl">
          <PackageSearch className="text-blue-400" />
          <span>RoofSource<span className="text-blue-400">Pro</span></span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X size={20}/></button>
      </div>

      <div className="p-4 border-b border-slate-800 bg-slate-800/50">
        <div className="text-xs text-slate-400 uppercase font-bold mb-1">Active Project</div>
        <div className="font-bold truncate">{projectInfo.name}</div>
        <div className="text-sm text-slate-400 flex items-center gap-1"><MapPin size={12}/> {projectInfo.loc}</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: 'dashboard', icon: BarChart3, label: 'Market Dashboard' },
          { id: 'scope', icon: Box, label: 'Scope & BOM' },
          { id: 'vendors', icon: Users, label: 'Vendor Manager' },
          { id: 'pricing', icon: Grid3x3, label: 'Pricing Workbench' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveView(item.id); setSelectedVendorId(null); setInspectingVendorId(null); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeView === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <Button 
          variant="ghost" 
          size="sm" 
          fullWidth 
          onClick={handleLogout}
          icon={LogOut}
          className="text-slate-400 hover:text-white"
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );

  const renderInspectionModal = () => {
    if (!inspectingVendorId) return null;
    const vendorQuote = quotes.find(q => q.id === inspectingVendorId);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{vendorQuote.name}</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide whitespace-nowrap ${vendorQuote.isManual ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                  {vendorQuote.type}
                </span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm">Reviewing line-item pricing for current scope.</p>
            </div>
            <button onClick={() => setInspectingVendorId(null)} className="p-2 hover:bg-gray-200 rounded-full shrink-0 self-start"><X size={24}/></button>
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            
            {vendorQuote.isManual && (
              <div className="mb-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2"><BrainCircuit size={16}/> Quick Parse Tool</h4>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 text-sm border-blue-200 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Paste email text here to check for totals..."
                    value={parserText}
                    onChange={(e) => setParserText(e.target.value)}
                  />
                  <Button size="sm" onClick={() => parseBulkText(vendorQuote.id)} variant="primary" disabled={parsing}>
                    {parsing ? 'Parsing...' : 'Parse Quote'}
                  </Button>
                </div>
              </div>
            )}

            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b-2 border-gray-100 sticky top-0">
                <tr>
                  <th className="py-2 font-semibold text-gray-500 w-1/2">Material</th>
                  <th className="py-2 font-semibold text-gray-500 text-right">Qty</th>
                  <th className="py-2 font-semibold text-gray-500 text-right w-32">Unit Price ($)</th>
                  <th className="py-2 font-semibold text-gray-500 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendorQuote.lineItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 group">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.id}</div>
                    </td>
                    <td className="py-3 text-right font-mono text-gray-600">
                      {item.qty} <span className="text-xs text-gray-400">{item.unit}</span>
                    </td>
                    <td className="py-3 text-right">
                      <input 
                        type="number"
                        step="0.01"
                        className={`w-24 text-right p-1 rounded border focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm transition-colors ${item.missingPrice ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200'}`}
                        value={item.unitPrice || ""}
                        placeholder="0.00"
                        onChange={(e) => updateVendorPrice(vendorQuote.id, item.id, e.target.value)}
                      />
                      {item.missingPrice && <div className="text-[10px] text-red-500 mt-1">Missing Price</div>}
                    </td>
                    <td className="py-3 text-right font-bold text-gray-900 font-mono">
                      ${item.lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200">
                <tr>
                  <td colSpan="3" className="py-4 text-right font-bold text-gray-600">Grand Total</td>
                  <td className="py-4 text-right font-bold text-2xl text-blue-600">
                    ${vendorQuote.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                </tr>
              </tfoot>
            </table>

          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setInspectingVendorId(null)}>Cancel</Button>
            <Button onClick={() => setInspectingVendorId(null)} icon={Check}>Save & Close</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
      
      {renderSidebar()}

      <main className="md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 md:hidden">
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-base md:text-lg capitalize text-gray-800 truncate">
              {activeView === 'dashboard' ? 'Sourcing Dashboard' : 
               activeView === 'scope' ? 'Scope Editor' : 
               activeView === 'pricing' ? 'Pricing Workbench' : 'Vendor Manager'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-gray-900">{user?.email || 'Demo User'}</div>
              <div className="text-xs text-gray-500">Procurement Manager</div>
            </div>
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
              {user?.email?.[0]?.toUpperCase() || 'D'}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{activeView === 'dashboard' && (
            <Dashboard 
              quotes={quotes}
              vendors={vendors}
              scope={scope}
              projectInfo={projectInfo}
              onEditScope={() => setActiveView('scope')}
              onInspectVendor={setInspectingVendorId}
              onSelectVendor={setSelectedVendorId}
            />
          )}
          {activeView === 'scope' && (
            <ScopeEditor 
              scope={scope}
              onUpdateQty={updateScopeQty}
              onRemoveItem={removeScopeItem}
              onAddItem={addScopeItem}
            />
          )}
          {activeView === 'vendors' && (
            <VendorManager 
              vendors={vendors}
              onAddVendor={addVendor}
              onDeleteVendor={deleteVendor}
              onInspectVendor={(id) => { setInspectingVendorId(id); setActiveView('dashboard'); }}
            />
          )}
          {activeView === 'pricing' && (
            <PricingWorkbench 
              quotes={quotes}
              scope={scope}
              onUpdatePrice={updateVendorPrice}
              materialCatalog={MATERIAL_CATALOG}
            />
          )}
          </div>
        </div>

        {renderInspectionModal()}

      </main>
    </div>
  );
}

export default function RoofSourcePro() {
  return (
    <ProjectProvider>
      <RoofSourceProContent />
    </ProjectProvider>
  );
}
