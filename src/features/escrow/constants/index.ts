export const DISBURSEMENT_OPTIONS = [
  { value: 'daily', label: 'Daily', fee: '0.25%', feeRate: 0.0025, description: 'Receive funds daily with 0.25% fee' },
  { value: 'weekly', label: 'Weekly', fee: 'Free', feeRate: 0, description: 'Receive funds every Monday, no fee' },
  { value: 'monthly', label: 'Monthly', fee: 'Free', feeRate: 0, description: 'Receive funds on the 1st, no fee' },
  { value: 'on_demand', label: 'On Demand', fee: '0.5%', feeRate: 0.005, description: 'Request anytime with 0.5% fee' },
];
