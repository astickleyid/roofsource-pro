import { useMemo } from 'react';

export const useVarianceDetection = (quotes, scope) => {
  const varianceData = useMemo(() => {
    if (!quotes || quotes.length === 0 || !scope || scope.length === 0) {
      return { averages: {}, variances: {}, alerts: [] };
    }

    const averages = {};
    const variances = {};
    const alerts = [];

    scope.forEach(item => {
      const prices = quotes
        .map(q => {
          const lineItem = q.lineItems?.find(li => li.id === item.id);
          return lineItem?.unitPrice;
        })
        .filter(price => price !== undefined && price > 0);

      if (prices.length > 0) {
        const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        averages[item.id] = avg;

        quotes.forEach(quote => {
          const lineItem = quote.lineItems?.find(li => li.id === item.id);
          if (lineItem) {
            const variance = ((lineItem.unitPrice - avg) / avg) * 100;
            
            if (!variances[quote.id]) {
              variances[quote.id] = {};
            }
            variances[quote.id][item.id] = variance;

            if (Math.abs(variance) > 15) {
              alerts.push({
                vendorId: quote.id,
                vendorName: quote.name,
                itemId: item.id,
                itemName: lineItem.name,
                price: lineItem.unitPrice,
                average: avg,
                variance: variance.toFixed(1),
                severity: Math.abs(variance) > 30 ? 'high' : 'medium'
              });
            }

            if (lineItem.unitPrice === 0) {
              alerts.push({
                vendorId: quote.id,
                vendorName: quote.name,
                itemId: item.id,
                itemName: lineItem.name,
                price: 0,
                average: avg,
                variance: -100,
                severity: 'critical',
                type: 'zero-price'
              });
            }
          }
        });
      }
    });

    return { averages, variances, alerts };
  }, [quotes, scope]);

  const getVarianceColor = (variance) => {
    const absVariance = Math.abs(variance);
    if (absVariance > 30) return 'border-red-500 bg-red-50';
    if (absVariance > 15) return 'border-orange-400 bg-orange-50';
    return '';
  };

  const getVarianceIndicator = (variance) => {
    if (variance > 15) return '↑';
    if (variance < -15) return '↓';
    return '';
  };

  return {
    ...varianceData,
    getVarianceColor,
    getVarianceIndicator
  };
};
