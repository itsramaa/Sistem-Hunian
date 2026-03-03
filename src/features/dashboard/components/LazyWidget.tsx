import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface LazyWidgetProps {
  children: ReactNode;
  height?: string;
}

export function LazyWidget({ children, height = '200px' }: LazyWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (visible) return <>{children}</>;

  return (
    <div ref={ref} style={{ minHeight: height }}>
      <Skeleton className="w-full h-full rounded-2xl" style={{ minHeight: height }} />
    </div>
  );
}
