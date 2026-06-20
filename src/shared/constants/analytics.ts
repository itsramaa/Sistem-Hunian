export const EVENT_COLORS: Record<string, string> = {
  page_view: "hsl(var(--primary))",
  payment_initiated: "hsl(var(--success))",
  payment_completed: "hsl(142 76% 36%)",
  order_created: "hsl(var(--info))",
  chatbot_opened: "hsl(var(--accent))",
  chatbot_message: "hsl(var(--warning))",
  button_click: "hsl(var(--muted-foreground))",
  default: "hsl(var(--chart-1))",
};

export const ANALYTICS_PII_FIELDS = [
  "email",
  "phone",
  "password",
  "ssn",
  "credit_card",
  "ktp",
  "nik",
  "bank_account",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "session",
];

export const ANALYTICS_BATCH_SIZE = 10;
export const ANALYTICS_FLUSH_INTERVAL_MS = 5000;
export const ANALYTICS_DEBOUNCE_MS = 1000;
