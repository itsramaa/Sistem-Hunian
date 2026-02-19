import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/shared/components/theme-provider";
import App from "@/App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="sihuni-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);
