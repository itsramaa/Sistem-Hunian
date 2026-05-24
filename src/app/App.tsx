import { InactivityMonitor } from "@/features/auth/components/InactivityMonitor";
import { Meta } from "@/shared/components/meta";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { Providers } from "./providers";
import { AppRouter } from "./router";

const App = () => (
  <Providers>
    <Toaster />
    <Sonner />
    <Meta />
    <InactivityMonitor />
    <AppRouter />
  </Providers>
);

export default App;
