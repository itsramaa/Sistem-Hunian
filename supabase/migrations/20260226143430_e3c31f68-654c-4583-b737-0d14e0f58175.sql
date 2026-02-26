
-- Add collections_reminder_config to merchants for reminder preferences
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS collections_reminder_config jsonb NOT NULL DEFAULT '{
    "enabled": true,
    "channels": ["email"],
    "schedule": [
      {"days_overdue": 2, "channel": "email", "tone": "friendly"},
      {"days_overdue": 5, "channel": "email", "tone": "firm"},
      {"days_overdue": 10, "channel": "email", "tone": "urgent"},
      {"days_overdue": 15, "channel": "email", "tone": "notice"}
    ]
  }'::jsonb;

COMMENT ON COLUMN public.merchants.collections_reminder_config
  IS 'JSONB config for automated payment reminder schedule and channels';
