import React, { createContext, useContext, useState, useMemo } from 'react';
import { calculateLandedCost } from '../utils/conversions';

const MATERIAL_CATALOG = [
  { id: 'OC-DUR-DRIFT', name: "Owens Corning Duration - Driftwood", unit: "Sq", defaultPrice: 115.00 },
  { id: 'OC-DUR-ONYX', name: "Owens Corning Duration - Onyx Black", unit: "Sq", defaultPrice: 115.00 },
  { id: 'IWS-ROLL', name: "Ice & Water Shield (Generic)", unit: "Rolls", defaultPrice: 65.00 },
  { id: 'SYN-FELT', name: "Synthetic Underlayment", unit: "Rolls", defaultPrice: 45.00 },
  { id: 'DRIP-EDGE', name: "Drip Edge (White) 10'", unit: "Pcs", defaultPrice: 8.50 },
  { id: 'HIP-RIDGE', name: "Hip & Ridge Shingles", unit: "Bdl", defaultPrice: 55.00 },
  { id: 'COIL-NAILS', name: "Coil Nails 1-1/4\"", unit: "Box", defaultPrice: 35.00 },
];

const ProjectContext = createContext(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [scope, setScope] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projectInfo, setProjectInfo] = useState({ 
    id: '1024', 
    name: 'Toledo Residential Complex', 
    loc: 'Toledo, OH' 
  });

  const calculateVendorQuote = (vendor) => {
    let itemsFound = 0;
    const lineItems = scope.map(scopeItem => {
      const catalogItem = MATERIAL_CATALOG.find(c => c.id === scopeItem.id);
      const unitPrice = vendor.pricing[scopeItem.id] !== undefined ? vendor.pricing[scopeItem.id] : 0;
      const lineTotal = unitPrice * scopeItem.qty;
      
      if (unitPrice > 0) itemsFound++;

      return {
        ...scopeItem,
        name: catalogItem?.name || scopeItem.id,
        unit: catalogItem?.unit || 'Units',
        unitPrice,
        lineTotal,
        missingPrice: unitPrice === 0
      };
    });

    const palletCount = Math.ceil(scope.reduce((sum, item) => sum + item.qty, 0) / 50);
    
    const costBreakdown = calculateLandedCost(
      lineItems,
      vendor.taxRate || 0,
      vendor.deliveryFee || 0,
      vendor.palletFee || 0,
      palletCount
    );

    return {
      ...vendor,
      lineItems,
      ...costBreakdown,
      total: costBreakdown.grandTotal,
      completeness: Math.round((itemsFound / scope.length) * 100)
    };
  };

  const quotes = useMemo(() => vendors.map(calculateVendorQuote), [vendors, scope]);

  const updateScopeQty = (id, newQty) => {
    setScope(prev => prev.map(item => item.id === id ? { ...item, qty: parseFloat(newQty) || 0 } : item));
  };

  const removeScopeItem = (id) => {
    setScope(prev => prev.filter(item => item.id !== id));
  };

  const addScopeItem = (catalogId) => {
    if (scope.find(i => i.id === catalogId)) return;
    setScope(prev => [...prev, { id: catalogId, qty: 1 }]);
  };

  const addVendor = () => {
    const name = prompt("Enter Vendor Name:");
    if (!name) return;
    const newVendor = {
      id: `v-${Date.now()}`,
      name,
      type: "Manual Entry",
      distance: 0,
      driveTime: 0,
      isManual: true,
      pricing: {}
    };
    setVendors([...vendors, newVendor]);
  };

  const deleteVendor = (id) => {
    if (confirm("Delete this vendor and their pricing data?")) {
      setVendors(prev => prev.filter(v => v.id !== id));
    }
  };

  const updateVendorPrice = (vendorId, itemId, newPrice) => {
    setVendors(prev => prev.map(v => {
      if (v.id !== vendorId) return v;
      return {
        ...v,
        pricing: { ...v.pricing, [itemId]: parseFloat(newPrice) || 0 }
      };
    }));
  };

  const value = {
    scope,
    vendors,
    projectInfo,
    quotes,
    updateScopeQty,
    removeScopeItem,
    addScopeItem,
    addVendor,
    deleteVendor,
    updateVendorPrice,
    setProjectInfo
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
