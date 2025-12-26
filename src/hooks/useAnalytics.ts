import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { trackEvent, EventTypes, resetCachedUser, type EventType } from '@/lib/analytics';

type EventData = Record<string, string | number | boolean | null>;

export function useAnalytics() {
  const { user } = useAuth();
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  // Reset cached user when auth changes
  useEffect(() => {
    resetCachedUser();
  }, [user?.id]);

  const track = useCallback(async (
    eventType: EventType | string, 
    eventData?: EventData,
    page?: string
  ) => {
    await trackEvent({
      eventType,
      eventData: eventData || {},
      page: page || location.pathname,
    });
  }, [location.pathname]);

  // Track page views automatically - with duplicate prevention
  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;
    
    // Prevent duplicate tracking for same path
    if (lastTrackedPath.current === currentPath) {
      return;
    }
    lastTrackedPath.current = currentPath;
    
    track(EventTypes.PAGE_VIEW, {
      path: location.pathname,
      search: location.search,
      referrer: document.referrer || null,
    });
  }, [location.pathname, location.search, track]);

  return { trackEvent: track };
}

// Specific tracking functions
export function usePaymentTracking() {
  const { trackEvent } = useAnalytics();

  const trackPaymentInitiated = (paymentId: string, amount: number, paymentType: string) => {
    trackEvent(EventTypes.PAYMENT_INITIATED, {
      payment_id: paymentId,
      amount,
      payment_type: paymentType,
    });
  };

  const trackPaymentCompleted = (paymentId: string, amount: number, paymentMethod: string) => {
    trackEvent(EventTypes.PAYMENT_COMPLETED, {
      payment_id: paymentId,
      amount,
      payment_method: paymentMethod,
    });
  };

  const trackPaymentFailed = (paymentId: string, errorMessage: string) => {
    trackEvent(EventTypes.PAYMENT_FAILED, {
      payment_id: paymentId,
      error: errorMessage,
    });
  };

  return { trackPaymentInitiated, trackPaymentCompleted, trackPaymentFailed };
}

export function useOrderTracking() {
  const { trackEvent } = useAnalytics();

  const trackOrderPlaced = (orderId: string, productId: string, vendorId: string, amount: number) => {
    trackEvent(EventTypes.ORDER_PLACED, {
      order_id: orderId,
      product_id: productId,
      vendor_id: vendorId,
      amount,
    });
  };

  const trackOrderCompleted = (orderId: string) => {
    trackEvent(EventTypes.ORDER_COMPLETED, { order_id: orderId });
  };

  const trackOrderCancelled = (orderId: string, reason: string) => {
    trackEvent(EventTypes.ORDER_CANCELLED, {
      order_id: orderId,
      cancel_reason: reason,
    });
  };

  return { trackOrderPlaced, trackOrderCompleted, trackOrderCancelled };
}

export function useMaintenanceTracking() {
  const { trackEvent } = useAnalytics();

  const trackMaintenanceSubmitted = (requestId: string, category: string, priority: string) => {
    trackEvent(EventTypes.MAINTENANCE_CREATED, {
      request_id: requestId,
      category,
      priority,
    });
  };

  const trackMaintenanceResolved = (requestId: string) => {
    trackEvent(EventTypes.MAINTENANCE_RESOLVED, { request_id: requestId });
  };

  return { trackMaintenanceSubmitted, trackMaintenanceResolved };
}

export function useChatbotTracking() {
  const { trackEvent } = useAnalytics();

  const trackChatbotOpened = () => {
    trackEvent(EventTypes.CHATBOT_OPENED);
  };

  const trackChatbotMessage = (messageType: 'user' | 'bot') => {
    trackEvent(EventTypes.CHATBOT_MESSAGE_SENT, { message_type: messageType });
  };

  return { trackChatbotOpened, trackChatbotMessage };
}

export function useReferralTracking() {
  const { trackEvent } = useAnalytics();

  const trackReferralLinkCopied = () => {
    trackEvent(EventTypes.REFERRAL_LINK_COPIED);
  };

  const trackReferralLinkShared = (channel: string) => {
    trackEvent(EventTypes.REFERRAL_LINK_SHARED, { channel });
  };

  return { trackReferralLinkCopied, trackReferralLinkShared };
}
