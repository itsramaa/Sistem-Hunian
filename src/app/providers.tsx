import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { queryClient } from "./query-client";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                {children}
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
