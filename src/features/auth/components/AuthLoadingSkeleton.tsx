import { Building2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface AuthLoadingSkeletonProps {
  destination?: string;
}

export function AuthLoadingSkeleton({ destination }: AuthLoadingSkeletonProps) {
  return (
    <div 
      className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative"
      role="status"
      aria-live="polite"
      aria-label="Memuat halaman autentikasi"
    >
      {/* Brand panel skeleton (desktop) */}
      <div className="hidden md:flex relative flex-col items-center justify-center bg-gradient-to-br from-foreground via-primary to-secondary overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="gradient-orb gradient-orb-1 -top-20 -left-20" />
          <div className="gradient-orb gradient-orb-2 -bottom-32 -right-20" />
        </div>
        <div className="relative z-10 space-y-6 text-center">
          <Skeleton className="w-20 h-20 rounded-2xl mx-auto bg-primary-foreground/10" />
          <Skeleton className="h-10 w-64 mx-auto bg-primary-foreground/10" />
          <Skeleton className="h-5 w-48 mx-auto bg-primary-foreground/10" />
        </div>
      </div>

      {/* Form panel skeleton */}
      <div className="relative flex items-center justify-center px-4 py-8 overflow-hidden bg-muted/30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="gradient-orb gradient-orb-1 -top-20 -left-20" />
          <div className="gradient-orb gradient-orb-3 top-1/2 left-1/3" />
        </div>

        <div className="relative z-10 w-full max-w-md glass-card p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {destination 
                ? `Mengarahkan ke ${destination}...` 
                : 'Memuat...'}
            </p>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
