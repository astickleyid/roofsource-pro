import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVarianceDetection } from '../../hooks/useVarianceDetection';

export const PricingWorkbench = ({ quotes, scope, onUpdatePrice, materialCatalog }) => {
  const [inflationRate, setInflationRate] = useState(0);
  const [targetMargin, setTargetMargin] = useState(20);
  const [viewMode, setViewMode] = useState('cost'); // 'cost' or 'sell'

  const { averages, variances, alerts, getVarianceColor, getVarianceIndicator } = useVarianceDetection(quotes, scope);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: 'name',
        header: 'Material',
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <div className="font-medium text-gray-900">{row.original.name}</div>
            <div className="text-xs text-gray-500 font-mono">{row.original.id}</div>
            {averages[row.original.id] && (
              <div className="text-xs text-blue-600 mt-1">
                Avg: ${averages[row.original.id].toFixed(2)}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'qty',
        header: 'Qty',
        cell: ({ row }) => (
          <div className="text-center font-mono text-sm">
            {row.original.qty} <span className="text-xs text-gray-400">{row.original.unit}</span>
          </div>
        ),
      },
    ];

    quotes.forEach(quote => {
      baseColumns.push({
        id: `vendor-${quote.id}`,
        header: () => (
          <div className="text-center">
            <div className="font-bold">{quote.name}</div>
            <div className="text-xs font-normal text-gray-500">{quote.type}</div>
          </div>
        ),
        cell: ({ row }) => {
          const lineItem = quote.lineItems?.find(li => li.id === row.original.id);
          const variance = variances[quote.id]?.[row.original.id] || 0;
          const varianceColor = getVarianceColor(variance);
          const varianceIndicator = getVarianceIndicator(variance);

          const displayPrice = viewMode === 'sell' && lineItem?.unitPrice
            ? lineItem.unitPrice * (1 + targetMargin / 100)
            : lineItem?.unitPrice || 0;

          return (
            <div className="relative">
              <input
                type="number"
                step="0.01"
                className={`w-full text-right px-2 py-2 border-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono transition-all ${
                  lineItem?.missingPrice
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : varianceColor || 'border-gray-200'
                }`}
                value={lineItem?.unitPrice || ''}
                placeholder="0.00"
                onChange={(e) => onUpdatePrice(quote.id, row.original.id, e.target.value)}
              />
              {varianceIndicator && (
                <div className={`absolute -right-6 top-1/2 -translate-y-1/2 text-lg ${
                  variance > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {varianceIndicator}
                </div>
              )}
              {viewMode === 'sell' && lineItem?.unitPrice > 0 && (
                <div className="text-xs text-gray-500 text-center mt-1">
                  ${displayPrice.toFixed(2)}
                </div>
              )}
              {Math.abs(variance) > 15 && (
                <div className="text-[10px] text-center mt-1 font-medium">
                  <span className={variance > 0 ? 'text-red-600' : 'text-green-600'}>
                    {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          );
        },
      });
    });

    return baseColumns;
  }, [quotes, averages, variances, viewMode, targetMargin, onUpdatePrice, getVarianceColor, getVarianceIndicator]);

  const data = useMemo(() => {
    return scope.map(scopeItem => {
      const catalogItem = materialCatalog.find(c => c.id === scopeItem.id);
      return {
        ...scopeItem,
        name: catalogItem?.name || scopeItem.id,
        unit: catalogItem?.unit || 'Units',
      };
    });
  }, [scope, materialCatalog]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleApplyInflation = () => {
    if (!inflationRate || inflationRate === 0) return;
    
    const confirmed = confirm(
      `Apply ${inflationRate}% inflation to all vendor prices?\n\nThis will increase all prices by ${inflationRate}%.`
    );
    
    if (confirmed) {
      quotes.forEach(quote => {
        quote.lineItems?.forEach(item => {
          if (item.unitPrice > 0) {
            const newPrice = item.unitPrice * (1 + inflationRate / 100);
            onUpdatePrice(quote.id, item.id, newPrice.toFixed(2));
          }
        });
      });
      alert(`Inflation of ${inflationRate}% applied successfully!`);
    }
  };

  return (
    <div className="max-w-[95vw] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing Workbench</h2>
          <p className="text-gray-600">Advanced pricing analysis with variance detection</p>
        </div>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 mb-2">
                {alerts.length} Pricing Alert{alerts.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-1 text-sm">
                {alerts.slice(0, 5).map((alert, i) => (
                  <div key={i} className="text-orange-800">
                    <strong>{alert.vendorName}</strong> - {alert.itemName}: 
                    {alert.type === 'zero-price' ? (
                      <span className="text-red-700 font-bold ml-1">MISSING PRICE</span>
                    ) : (
                      <span className="ml-1">
                        ${alert.price.toFixed(2)} ({alert.variance}% from avg)
                      </span>
                    )}
                  </div>
                ))}
                {alerts.length > 5 && (
                  <div className="text-orange-600 italic">
                    ...and {alerts.length - 5} more alerts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-blue-600" />
          Global Adjustments
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Inflation Buffer */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
              <TrendingUp size={14} />
              Inflation Buffer
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={inflationRate}
                onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.0"
              />
              <span className="flex items-center text-gray-500 font-medium">%</span>
            </div>
            <Button 
              size="sm" 
              fullWidth 
              onClick={handleApplyInflation}
              disabled={!inflationRate || inflationRate === 0}
              variant="outline"
            >
              Apply Inflation
            </Button>
          </div>

          {/* Markup Calculator */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
              <Percent size={14} />
              Target Margin
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={targetMargin}
                onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="20"
              />
              <span className="flex items-center text-gray-500 font-medium">%</span>
            </div>
            <div className="text-xs text-gray-500">
              Applied when viewing sell prices
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
              <TrendingDown size={14} />
              Price View
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                fullWidth
                variant={viewMode === 'cost' ? 'primary' : 'outline'}
                onClick={() => setViewMode('cost')}
              >
                Cost Price
              </Button>
              <Button
                size="sm"
                fullWidth
                variant={viewMode === 'sell' ? 'primary' : 'outline'}
                onClick={() => setViewMode('sell')}
              >
                Sell Price
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              {viewMode === 'sell' && `+${targetMargin}% margin applied`}
            </div>
          </div>

        </div>
      </div>

      {/* Pricing Grid */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left font-semibold text-gray-700"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Legend & Indicators</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-red-500 bg-red-50 rounded"></div>
            <span className="text-gray-700">&gt;30% variance (critical)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-400 bg-orange-50 rounded"></div>
            <span className="text-gray-700">15-30% variance (warning)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-lg">↑</span>
            <span className="text-gray-700">Above average price</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-bold text-lg">↓</span>
            <span className="text-gray-700">Below average price</span>
          </div>
        </div>
      </div>

    </div>
  );
};
