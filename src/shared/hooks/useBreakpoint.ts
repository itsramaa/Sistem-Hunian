import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

function getWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1024;
}

/**
 * Returns true when viewport width is below the given breakpoint.
 * Defaults to 'md' (768px) — aligns with SRS §8 tablet breakpoint.
 */
export function useBreakpoint(breakpoint: Breakpoint = 'md'): boolean {
  const [isBelow, setIsBelow] = useState(() => getWidth() < BREAKPOINTS[breakpoint]);

  useEffect(() => {
    const handler = () => setIsBelow(getWidth() < BREAKPOINTS[breakpoint]);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);

  return isBelow;
}

/** Returns true on mobile (< 640px) per SRS §8 */
export function useIsMobile(): boolean {
  return useBreakpoint('sm');
}

/** Returns true on tablet or smaller (< 1024px) */
export function useIsTabletOrMobile(): boolean {
  return useBreakpoint('lg');
}
