# Platform Configuration

## Overview
Konfigurasi platform-wide seperti fee, limits, dan settings.

## File Location
- `src/pages/admin/PlatformConfig.tsx` - Halaman platform config
- `src/pages/admin/Settings.tsx` - Settings admin

## Database Tables
- `platform_config` - Konfigurasi platform (jika ada)
- Various config tables

## Features
- ✅ Platform fee settings
- ✅ Payment gateway config
- ✅ Email templates
- ✅ Notification settings
- ✅ Feature flags
- ✅ Maintenance mode

## Implementation Status
| Feature | Status |
|---------|--------|
| Fee Settings | ✅ Complete |
| Payment Config | ✅ Complete |
| Email Templates | ⚠️ Partial |
| Feature Flags | ⚠️ Partial |

## Configuration Items
- `platform_fee_percentage` - Platform fee (%)
- `gateway_fee_percentage` - Gateway fee (%)
- `min_disbursement_amount` - Minimum disbursement
- `disbursement_schedule` - Default schedule
- `trial_days` - Default trial days

## Related Components
- `Settings` page
- Various admin pages
