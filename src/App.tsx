import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminSetup from "./pages/AdminSetup";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMerchants from "./pages/admin/Merchants";
import AdminEscrow from "./pages/admin/Escrow";
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantProperties from "./pages/merchant/Properties";
import MerchantTenants from "./pages/merchant/Tenants";
import MerchantMaintenance from "./pages/merchant/Maintenance";
import MerchantPayments from "./pages/merchant/Payments";
import MerchantReports from "./pages/merchant/Reports";
import MerchantInvoices from "./pages/merchant/Invoices";
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantMaintenance from "./pages/tenant/Maintenance";
import TenantPayments from "./pages/tenant/Payments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/merchants" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMerchants />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/escrow" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminEscrow />
                </ProtectedRoute>
              } 
            />
            
            {/* Merchant Routes */}
            <Route 
              path="/merchant" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/properties" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantProperties />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/tenants" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantTenants />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/maintenance" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantMaintenance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/payments" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantPayments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/reports" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/invoices" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantInvoices />
                </ProtectedRoute>
              } 
            />
            
            {/* Tenant Routes */}
            <Route 
              path="/tenant" 
              element={
                <ProtectedRoute allowedRoles={['tenant']}>
                  <TenantDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tenant/maintenance" 
              element={
                <ProtectedRoute allowedRoles={['tenant']}>
                  <TenantMaintenance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tenant/payments" 
              element={
                <ProtectedRoute allowedRoles={['tenant']}>
                  <TenantPayments />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
