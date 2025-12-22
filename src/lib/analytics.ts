import { supabase } from '@/integrations/supabase/client';

// Generate or get session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

interface TrackEventParams {
  eventType: string;
  eventData?: Record<string, unknown>;
  page?: string;
}

export const trackEvent = async ({ eventType, eventData = {}, page }: TrackEventParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('analytics_events').insert([{
      user_id: user?.id || null,
      event_type: eventType,
      event_data: eventData,
      page: page || window.location.pathname,
      session_id: getSessionId(),
    }]);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

// Pre-defined event types
export const AnalyticsEvents = {
  // Page Views
  PAGE_VIEW: 'page_view',
  
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  
  // Payments
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  
  // Orders
  ORDER_PLACED: 'order_placed',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
  
  // Maintenance
  MAINTENANCE_CREATED: 'maintenance_created',
  MAINTENANCE_RESOLVED: 'maintenance_resolved',
  
  // Chatbot
  CHATBOT_OPENED: 'chatbot_opened',
  CHATBOT_MESSAGE_SENT: 'chatbot_message_sent',
  
  // Referrals
  REFERRAL_LINK_COPIED: 'referral_link_copied',
  REFERRAL_LINK_SHARED: 'referral_link_shared',
  
  // Contract
  CONTRACT_VIEWED: 'contract_viewed',
  CONTRACT_SIGNED: 'contract_signed',
  
  // Forum
  FORUM_POST_CREATED: 'forum_post_created',
  FORUM_POST_VIEWED: 'forum_post_viewed',
  FORUM_COMMENT_ADDED: 'forum_comment_added',
};

// Hook for tracking page views
export const usePageTracking = () => {
  return {
    trackPageView: (pageName: string) => {
      trackEvent({
        eventType: AnalyticsEvents.PAGE_VIEW,
        eventData: { pageName },
      });
    },
  };
};
