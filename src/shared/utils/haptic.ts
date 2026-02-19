/**
 * Haptic feedback utility for mobile devices
 */

type HapticType = 'success' | 'error' | 'light' | 'medium' | 'heavy';

const vibrationPatterns: Record<HapticType, number | number[]> = {
  success: 100,
  error: [50, 50, 50],
  light: 20,
  medium: 50,
  heavy: 100,
};

/**
 * Trigger haptic feedback on supported devices
 * @param type - Type of haptic feedback
 */
export const triggerHaptic = (type: HapticType = 'light'): void => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const pattern = vibrationPatterns[type];
    navigator.vibrate(pattern);
  }
};

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};
