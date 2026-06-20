import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('lg');

  useEffect(() => {
    const get = (): Breakpoint => {
      const w = window.innerWidth;
      if (w < 640) return 'xs';
      if (w < 768) return 'sm';
      if (w < 1024) return 'md';
      if (w < 1280) return 'lg';
      return 'xl';
    };
    const handler = () => setBp(get());
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return bp;
}

export function useIsMobile() {
  const bp = useBreakpoint();
  return bp === 'xs';
}

export function useIsTabletOrBelow() {
  const bp = useBreakpoint();
  return bp === 'xs' || bp === 'sm' || bp === 'md';
}
