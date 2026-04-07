import { DISBURSEMENT_OPTIONS } from '../constants';

export const calculateDisbursementFee = (amount: number, scheduleType: string = 'on_demand') => {
  const option = DISBURSEMENT_OPTIONS.find(o => o.value === scheduleType) || DISBURSEMENT_OPTIONS[3];
  return amount * option.feeRate;
};
