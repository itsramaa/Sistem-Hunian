import { Customer, TaxInfo } from '../types';

const TAX_RATES: Record<string, number> = {
  'US_CA': 0.0725,  // California sales tax
  'US_NY': 0.04,    // New York sales tax
  'GB': 0.20,       // UK VAT
  'DE': 0.19,       // Germany VAT
  'FR': 0.20,       // France VAT
  'AU': 0.10,       // Australia GST
  'ID': 0.11,       // Indonesia PPN (Assuming local context)
};

export const getTaxJurisdiction = (customer: Customer): string | null => {
  const country = customer.address?.country;
  const state = customer.address?.state;

  if (country === 'US' && state) {
    return `US_${state}`;
  } else if (['GB', 'DE', 'FR', 'ID', 'AU'].includes(country || '')) {
    return country || null;
  }
  return null;
};

export const getTaxType = (jurisdiction: string): string => {
  if (jurisdiction.startsWith('US_')) {
    return 'Sales Tax';
  } else if (['GB', 'DE', 'FR'].includes(jurisdiction)) {
    return 'VAT';
  } else if (jurisdiction === 'AU') {
    return 'GST';
  } else if (jurisdiction === 'ID') {
    return 'PPN';
  }
  return 'Tax';
};

export const calculateTax = (amount: number, customer: Customer): TaxInfo => {
  const jurisdiction = getTaxJurisdiction(customer);

  if (!jurisdiction) {
    return {
      tax_amount: 0,
      tax_rate: 0,
      jurisdiction: 'N/A',
      tax_type: 'None',
      inclusive: false,
    };
  }

  const taxRate = TAX_RATES[jurisdiction] || 0;
  const taxAmount = amount * taxRate;

  return {
    tax_amount: taxAmount,
    tax_rate: taxRate,
    jurisdiction,
    tax_type: getTaxType(jurisdiction),
    inclusive: false, // Assuming exclusive tax for now
  };
};
