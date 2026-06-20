import { InactivityMonitor } from "@/features/auth/components/InactivityMonitor";
import { Meta } from "@/shared/components/meta";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { Providers } from "@/shared/lib/providers";
import { AppRouter } from "@/app/router/router";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

const App = () => (
  <Providers>
    <ErrorBoundary>
      <Toaster />
      <Sonner />
      <Meta />
      <InactivityMonitor />
      <AppRouter />
    </ErrorBoundary>
  </Providers>
);

export default App;
