// Tax utility functions for Yates Inc.

export type TaxType = 'product' | 'paycheck';

interface TaxBracket {
  maxAmount: number;
  rate: number;
}

// Product taxes: added to price
const PRODUCT_TAX_BRACKETS: TaxBracket[] = [
  { maxAmount: 50, rate: 0.05 },      // 5% for $50 and under
  { maxAmount: 300, rate: 0.10 },     // 10% for over $50 up to $300
  { maxAmount: Infinity, rate: 0.15 } // 15% for over $300
];

// Paycheck taxes: subtracted from salary
const PAYCHECK_TAX_BRACKETS: TaxBracket[] = [
  { maxAmount: 50, rate: 0.02 },      // 2% for $50 and under
  { maxAmount: 300, rate: 0.04 },     // 4% for over $50 up to $300
  { maxAmount: Infinity, rate: 0.08 } // 8% for over $300
];

/**
 * Get the tax rate for a given amount
 */
export function getTaxRate(amount: number, type: TaxType): number {
  const brackets = type === 'product' ? PRODUCT_TAX_BRACKETS : PAYCHECK_TAX_BRACKETS;
  
  for (const bracket of brackets) {
    if (amount <= bracket.maxAmount) {
      return bracket.rate;
    }
  }
  
  // Fallback to highest bracket
  return brackets[brackets.length - 1].rate;
}

/**
 * Calculate the tax amount for a given price/salary
 */
export function calculateTax(amount: number, type: TaxType): number {
  const rate = getTaxRate(amount, type);
  return amount * rate;
}

/**
 * Get tax rate as a percentage string (e.g., "5%")
 */
export function getTaxRateLabel(amount: number, type: TaxType): string {
  const rate = getTaxRate(amount, type);
  return `${(rate * 100).toFixed(0)}%`;
}

/**
 * Calculate final amount after tax
 * - Products: adds tax (customer pays more)
 * - Paychecks: subtracts tax (employee receives less)
 */
export function calculateFinalAmount(amount: number, type: TaxType): number {
  const tax = calculateTax(amount, type);
  
  if (type === 'product') {
    return amount + tax; // Tax added to price
  } else {
    return amount - tax; // Tax subtracted from paycheck
  }
}

/**
 * Get a breakdown of the tax calculation
 */
export function getTaxBreakdown(amount: number, type: TaxType) {
  const rate = getTaxRate(amount, type);
  const taxAmount = calculateTax(amount, type);
  const finalAmount = calculateFinalAmount(amount, type);
  
  return {
    originalAmount: amount,
    taxRate: rate,
    taxRateLabel: getTaxRateLabel(amount, type),
    taxAmount,
    finalAmount,
    isAdded: type === 'product',
    isSubtracted: type === 'paycheck',
  };
}











