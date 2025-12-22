import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type EventData = Record<string, string | number | boolean | null>;

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export function useAnalytics() {
  const { user } = useAuth();
  const location = useLocation();

  const trackEvent = useCallback(async (
    eventType: string, 
    eventData?: EventData,
    page?: string
  ) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: eventData || {},
        page: page || location.pathname,
        user_id: user?.id || null,
        session_id: getSessionId(),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [user?.id, location.pathname]);

  // Track page views automatically
  useEffect(() => {
    trackEvent('page_view', {
      path: location.pathname,
      search: location.search,
      referrer: document.referrer,
    });
  }, [location.pathname, location.search, trackEvent]);

  return { trackEvent };
}

// Specific tracking functions
export function usePaymentTracking() {
  const { trackEvent } = useAnalytics();

  const trackPaymentInitiated = (paymentId: string, amount: number, paymentType: string) => {
    trackEvent('payment_initiated', {
      payment_id: paymentId,
      amount,
      payment_type: paymentType,
    });
  };

  const trackPaymentCompleted = (paymentId: string, amount: number, paymentMethod: string) => {
    trackEvent('payment_completed', {
      payment_id: paymentId,
      amount,
      payment_method: paymentMethod,
    });
  };

  const trackPaymentFailed = (paymentId: string, errorMessage: string) => {
    trackEvent('payment_failed', {
      payment_id: paymentId,
      error: errorMessage,
    });
  };

  return { trackPaymentInitiated, trackPaymentCompleted, trackPaymentFailed };
}

export function useOrderTracking() {
  const { trackEvent } = useAnalytics();

  const trackOrderPlaced = (orderId: string, productId: string, vendorId: string, amount: number) => {
    trackEvent('order_placed', {
      order_id: orderId,
      product_id: productId,
      vendor_id: vendorId,
      amount,
    });
  };

  const trackOrderCompleted = (orderId: string) => {
    trackEvent('order_completed', { order_id: orderId });
  };

  const trackOrderCancelled = (orderId: string, reason: string) => {
    trackEvent('order_cancelled', {
      order_id: orderId,
      cancel_reason: reason,
    });
  };

  return { trackOrderPlaced, trackOrderCompleted, trackOrderCancelled };
}

export function useMaintenanceTracking() {
  const { trackEvent } = useAnalytics();

  const trackMaintenanceSubmitted = (requestId: string, category: string, priority: string) => {
    trackEvent('maintenance_submitted', {
      request_id: requestId,
      category,
      priority,
    });
  };

  const trackMaintenanceResolved = (requestId: string) => {
    trackEvent('maintenance_resolved', { request_id: requestId });
  };

  return { trackMaintenanceSubmitted, trackMaintenanceResolved };
}

export function useChatbotTracking() {
  const { trackEvent } = useAnalytics();

  const trackChatbotOpened = () => {
    trackEvent('chatbot_opened');
  };

  const trackChatbotMessage = (messageType: 'user' | 'bot') => {
    trackEvent('chatbot_message', { message_type: messageType });
  };

  return { trackChatbotOpened, trackChatbotMessage };
}