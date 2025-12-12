export const CONVERSION_FACTORS = {
  SQUARE_TO_BUNDLES: 3,
  BUNDLE_TO_SQUARE: 1 / 3,
  LINEAR_FOOT_TO_ROLL: 1 / 100,
  ROLL_TO_LINEAR_FOOT: 100
};

export const convertSquaresToBundles = (squares) => {
  return squares * CONVERSION_FACTORS.SQUARE_TO_BUNDLES;
};

export const convertBundlesToSquares = (bundles) => {
  return bundles * CONVERSION_FACTORS.BUNDLE_TO_SQUARE;
};

export const convertLinearFeetToRolls = (linearFeet) => {
  return Math.ceil(linearFeet * CONVERSION_FACTORS.LINEAR_FOOT_TO_ROLL);
};

export const convertRollsToLinearFeet = (rolls) => {
  return rolls * CONVERSION_FACTORS.ROLL_TO_LINEAR_FOOT;
};

export const convertUnit = (value, fromUnit, toUnit) => {
  const conversions = {
    'Sq-Bdl': convertSquaresToBundles,
    'Bdl-Sq': convertBundlesToSquares,
    'LF-Rolls': convertLinearFeetToRolls,
    'Rolls-LF': convertRollsToLinearFeet
  };

  const key = `${fromUnit}-${toUnit}`;
  const converter = conversions[key];

  if (converter) {
    return converter(value);
  }

  return value;
};

export const calculateLandedCost = (lineItems, taxRate = 0, deliveryFee = 0, palletFee = 0, palletCount = 0) => {
  const subtotal = lineItems.reduce((sum, item) => {
    const lineTotal = (item.unitPrice || 0) * (item.qty || 0);
    return sum + lineTotal;
  }, 0);

  const tax = subtotal * taxRate;
  const totalPalletFees = palletFee * palletCount;
  const grandTotal = subtotal + tax + deliveryFee + totalPalletFees;

  return {
    subtotal,
    tax,
    deliveryFee,
    palletFees: totalPalletFees,
    grandTotal
  };
};
