export const getCancellationReasonLabel = (reason: string) => {
  const labels: Record<string, string> = {
    too_expensive: 'Too Expensive',
    not_using: 'Not Using',
    missing_features: 'Missing Features',
    switching_competitor: 'Switching to Competitor',
    business_closed: 'Business Closed',
    other: 'Other',
  };
  return labels[reason] || reason;
};
