import { supabase } from '@/lib/integrations/supabase/client';
import {
  ANALYTICS_BATCH_SIZE,
  ANALYTICS_DEBOUNCE_MS,
  ANALYTICS_FLUSH_INTERVAL_MS,
  ANALYTICS_PII_FIELDS,
} from '@/constants/analytics';

// Valid event types enum
export const EventTypes = {
  PAGE_VIEW: 'page_view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  ORDER_PLACED: 'order_placed',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
  MAINTENANCE_CREATED: 'maintenance_created',
  MAINTENANCE_RESOLVED: 'maintenance_resolved',
  CHATBOT_OPENED: 'chatbot_opened',
  CHATBOT_MESSAGE_SENT: 'chatbot_message_sent',
  REFERRAL_LINK_COPIED: 'referral_link_copied',
  REFERRAL_LINK_SHARED: 'referral_link_shared',
  CONTRACT_VIEWED: 'contract_viewed',
  CONTRACT_SIGNED: 'contract_signed',
  FORUM_POST_CREATED: 'forum_post_created',
  FORUM_POST_VIEWED: 'forum_post_viewed',
  FORUM_COMMENT_ADDED: 'forum_comment_added',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

// UUID polyfill for older browsers
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate tab-specific session ID to avoid collision across tabs
const getSessionId = (): string => {
  try {
    // Include tab identifier to prevent collision across tabs
    const tabId = sessionStorage.getItem('analytics_tab_id') || generateUUID().slice(0, 8);
    if (!sessionStorage.getItem('analytics_tab_id')) {
      sessionStorage.setItem('analytics_tab_id', tabId);
    }
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${tabId}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  } catch {
    // Private mode or storage blocked - generate ephemeral ID
    return `ephemeral_${generateUUID()}`;
  }
};

// Check if user has opted out of tracking
const hasOptedOut = (): boolean => {
  try {
    return localStorage.getItem('analytics_opt_out') === 'true';
  } catch {
    return false;
  }
};

// Set opt-out preference
export const setAnalyticsOptOut = (optOut: boolean): void => {
  try {
    if (optOut) {
      localStorage.setItem('analytics_opt_out', 'true');
    } else {
      localStorage.removeItem('analytics_opt_out');
    }
  } catch {
    // Ignore storage errors
  }
};

// Filter PII from event data
const sanitizeEventData = (data: Record<string, unknown>): Record<string, string | number | boolean | null> => {
  const sanitized: Record<string, string | number | boolean | null> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field contains PII
    if (ANALYTICS_PII_FIELDS.some(pii => lowerKey.includes(pii))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      sanitized[key] = value as string | number | boolean;
    } else {
      sanitized[key] = JSON.stringify(value);
    }
  }
  
  return sanitized;
};

interface TrackEventParams {
  eventType: EventType | string;
  eventData?: Record<string, unknown>;
  page?: string;
}

// Event queue for batching and offline support
let eventQueue: Array<{
  event_type: string;
  event_data: Record<string, string | number | boolean | null>;
  page: string;
  user_id: string | null;
  session_id: string;
  idempotency_key: string;
}> = [];

let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let cachedUserId: string | null = null;

// Load offline queue on startup
const loadOfflineQueue = () => {
  try {
    const stored = localStorage.getItem('offline_analytics_queue');
    if (stored) {
      eventQueue = JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
};

// Save queue for offline support
const saveOfflineQueue = () => {
  try {
    if (eventQueue.length > 0) {
      localStorage.setItem('offline_analytics_queue', JSON.stringify(eventQueue));
    } else {
      localStorage.removeItem('offline_analytics_queue');
    }
  } catch {
    // Ignore storage errors
  }
};

// Flush events to database
const flushEvents = async () => {
  if (eventQueue.length === 0) return;
  
  const events = [...eventQueue];
  eventQueue = [];
  saveOfflineQueue();
  
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  try {
    const { error } = await supabase.from('analytics_events').insert(events);
    if (error) {
      // Re-queue on failure
      eventQueue = [...events, ...eventQueue];
      saveOfflineQueue();
      console.error('Analytics flush failed:', error);
    }
  } catch (error) {
    // Re-queue on error
    eventQueue = [...events, ...eventQueue];
    saveOfflineQueue();
    console.error('Analytics flush error:', error);
  }
};

// Listen for online event to flush queued events
if (typeof window !== 'undefined') {
  loadOfflineQueue();
  window.addEventListener('online', flushEvents);
  window.addEventListener('beforeunload', () => {
    // Attempt to flush on page unload
    if (eventQueue.length > 0) {
      saveOfflineQueue();
    }
  });
}

// Debounce map for rapid events
const eventDebounceMap = new Map<string, number>();
const DEBOUNCE_MS = ANALYTICS_DEBOUNCE_MS;

export const trackEvent = async ({ eventType, eventData = {}, page }: TrackEventParams) => {
  // Check opt-out preference
  if (hasOptedOut()) return;
  
  // Debounce rapid duplicate events
  const debounceKey = `${eventType}_${page || ''}`;
  const lastTime = eventDebounceMap.get(debounceKey);
  const now = Date.now();
  
  if (lastTime && now - lastTime < DEBOUNCE_MS) {
    return; // Skip duplicate event within debounce window
  }
  eventDebounceMap.set(debounceKey, now);
  
  try {
    // Use cached user ID if available
    if (!cachedUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      cachedUserId = user?.id || null;
    }
    
    const event = {
      event_type: eventType,
      event_data: sanitizeEventData(eventData),
      page: page || window.location.pathname,
      user_id: cachedUserId,
      session_id: getSessionId(),
      idempotency_key: `${getSessionId()}_${eventType}_${now}`,
    };
    
    // Check if offline
    if (!navigator.onLine) {
      eventQueue.push(event);
      saveOfflineQueue();
      return;
    }
    
    // Add to batch queue
    eventQueue.push(event);
    
    // Flush if batch size reached
    if (eventQueue.length >= ANALYTICS_BATCH_SIZE) {
      await flushEvents();
    } else if (!flushTimeout) {
      // Schedule flush after interval
      flushTimeout = setTimeout(flushEvents, ANALYTICS_FLUSH_INTERVAL_MS);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

// Reset cached user on auth changes
export const resetCachedUser = () => {
  cachedUserId = null;
};

// Hook for tracking page views
export const usePageTracking = () => {
  return {
    trackPageView: (pageName: string) => {
      trackEvent({
        eventType: EventTypes.PAGE_VIEW,
        eventData: { pageName },
      });
    },
  };
};
