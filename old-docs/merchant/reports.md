# Merchant Reports

## Overview
Laporan dan analytics untuk merchant.

## File Location
- `src/pages/merchant/Reports.tsx` - Halaman reports
- `src/components/merchant/RevenueForecast.tsx` - Forecast
- `src/components/merchant/TenantChurnAnalytics.tsx` - Churn analytics
- `src/components/merchant/OnTimePaymentRate.tsx` - Payment rate
- `src/components/merchant/VacancyDashboard.tsx` - Vacancy

## Database Tables
- `invoices` - Revenue data
- `contracts` - Occupancy data
- `payments` - Payment data

## Features
- ✅ Revenue report
- ✅ Occupancy report
- ✅ Payment collection report
- ✅ Revenue forecast
- ✅ Tenant churn analytics
- ✅ On-time payment rate
- ✅ Vacancy tracking
- ✅ Export reports

## Implementation Status
| Feature | Status |
|---------|--------|
| Revenue | ✅ Complete |
| Occupancy | ✅ Complete |
| Collection | ✅ Complete |
| Forecast | ✅ Complete |
| Churn | ✅ Complete |
| Export | ⚠️ Partial |

## Report Types
- Monthly Revenue
- Yearly Revenue
- Occupancy Rate
- Collection Rate
- Tenant Retention
- Vacancy Duration

## Related Components
- `RevenueForecast`
- `TenantChurnAnalytics`
- `OnTimePaymentRate`
- `VacancyDashboard`
- `exportUtils` - Export functions
