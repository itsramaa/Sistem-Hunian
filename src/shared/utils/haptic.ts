// Haptic feedback — no-op on web, native on mobile if implemented
export function triggerHaptic(_type: 'success' | 'error' | 'light' | 'medium' | 'heavy'): void {
  // No-op for web browser — can be extended for PWA vibration API if needed
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (_type) {
      case 'error': navigator.vibrate([50, 30, 50]); break;
      case 'success': navigator.vibrate(30); break;
      default: navigator.vibrate(10); break;
    }
  }
}
