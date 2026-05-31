import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { MerchantLayoutRoute } from "@/shared/components/layouts/MerchantLayoutRoute";
import { Suspense, lazy } from "react";
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { InactivityMonitor } from "@/features/auth/components/InactivityMonitor";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { Meta } from "@/shared/components/meta";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

// Lazy Load Pages
const AdminSetup = lazy(() => import("@/pages/AdminSetup"));
const Auth = lazy(() => import("@/pages/Auth"));
const Index = lazy(() => import("@/pages/Index"));
const Invite = lazy(() => import("@/pages/Invite"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));

// Admin Pages
const Admin2FA = lazy(() => import("@/pages/admin/Admin2FA"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const AdminChatbot = lazy(() => import("@/pages/admin/Chatbot"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminDisputes = lazy(() => import("@/pages/admin/Disputes"));
const AdminMerchants = lazy(() => import("@/pages/admin/Merchants"));
const AdminProperties = lazy(() => import("@/pages/admin/Properties"));
const AdminPlatformConfig = lazy(() => import("@/pages/admin/PlatformConfig"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminSubscriptionTiers = lazy(() => import("@/pages/admin/SubscriptionTiers"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/Subscriptions"));
const AdminTenants = lazy(() => import("@/pages/admin/Tenants"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));

// Merchant Pages
const MerchantBilling = lazy(() => import("@/pages/merchant/Billing"));
const MerchantDashboard = lazy(() => import("@/pages/merchant/Dashboard"));
const MerchantInvoiceDetail = lazy(() => import("@/pages/merchant/InvoiceDetail"));
const MerchantInvoices = lazy(() => import("@/pages/merchant/Invoices"));
const MerchantMaintenance = lazy(() => import("@/pages/merchant/Maintenance"));
const MerchantMaintenanceDetail = lazy(() => import("@/pages/merchant/MaintenanceDetail"));
const MerchantPaymentDetail = lazy(() => import("@/pages/merchant/PaymentDetail"));
const MerchantPayments = lazy(() => import("@/pages/merchant/Payments"));
const MerchantProfile = lazy(() => import("@/pages/merchant/Profile"));
const MerchantProperties = lazy(() => import("@/pages/merchant/Properties"));
const MerchantPropertyDetail = lazy(() => import("@/pages/merchant/PropertyDetail"));
const MerchantReports = lazy(() => import("@/pages/merchant/Reports"));
const MerchantSettings = lazy(() => import("@/pages/merchant/Settings"));
const MerchantTenants = lazy(() => import("@/pages/merchant/Tenants"));
const MerchantTenantDetail = lazy(() => import("@/pages/merchant/TenantDetail"));
const MerchantUnits = lazy(() => import("@/pages/merchant/Units"));
const MerchantUnitDetail = lazy(() => import("@/pages/merchant/UnitDetail"));
const MerchantOcrTutorial = lazy(() => import("@/pages/merchant/OcrTutorial"));
const MerchantMarketIntelligence = lazy(() => import("@/pages/merchant/MarketIntelligence"));
const MerchantSupport = lazy(() => import("@/pages/merchant/Support"));
const MerchantGuardians = lazy(() => import("@/pages/merchant/Guardians"));
const MerchantTenantAnalytics = lazy(() => import("@/pages/merchant/TenantAnalytics"));
const MerchantAnalyticsDashboard = lazy(() => import("@/pages/merchant/AnalyticsDashboard"));
const MerchantReportTemplates = lazy(() => import("@/pages/merchant/ReportTemplates"));
const MerchantComparativePortfolio = lazy(() => import("@/pages/merchant/ComparativePortfolio"));
const MerchantFeedback = lazy(() => import("@/pages/merchant/Feedback"));
const MerchantInventory = lazy(() => import("@/pages/merchant/Inventory"));
// Hub Pages (only InsightsHub remains as a hub)
const MerchantInsightsHub = lazy(() => import("@/pages/merchant/InsightsHub"));

// Tenant Pages
const TenantDashboard = lazy(() => import("@/pages/tenant/Dashboard"));
const TenantInvoiceDetail = lazy(() => import("@/pages/tenant/InvoiceDetail"));
const TenantInvoices = lazy(() => import("@/pages/tenant/Invoices"));
const TenantMaintenance = lazy(() => import("@/pages/tenant/Maintenance"));
const TenantMaintenanceDetail = lazy(() => import("@/pages/tenant/MaintenanceDetail"));
const TenantPayments = lazy(() => import("@/pages/tenant/Payments"));
const TenantProfile = lazy(() => import("@/pages/tenant/Profile"));
const TenantSettings = lazy(() => import("@/pages/tenant/Settings"));

// Payment Pages
const PaymentFailed = lazy(() => import("@/pages/payment/Failed"));
const PaymentSuccess = lazy(() => import("@/pages/payment/Success"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Meta />
          <BrowserRouter>
            <AuthProvider>
              <InactivityMonitor />
              <Routes>
                  {/* Standalone pages - wrapped in their own Suspense with full-screen loader */}
                  <Route path="/" element={<Suspense fallback={<PageLoader />}><Index /></Suspense>} />
                  <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
                  <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><Onboarding /></Suspense>} />
                  <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
                  <Route path="/update-password" element={<Suspense fallback={<PageLoader />}><UpdatePassword /></Suspense>} />
                  <Route path="/admin-setup" element={<Suspense fallback={<PageLoader />}><AdminSetup /></Suspense>} />
                  <Route path="/invite/:token" element={<Suspense fallback={<PageLoader />}><Invite /></Suspense>} />
                  <Route path="/admin/login" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/merchants" element={<ProtectedRoute allowedRoles={['admin']}><AdminMerchants /></ProtectedRoute>} />
                  <Route path="/admin/properties" element={<ProtectedRoute allowedRoles={['admin']}><AdminProperties /></ProtectedRoute>} />
                  <Route path="/admin/tenants" element={<ProtectedRoute allowedRoles={['admin']}><AdminTenants /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={['admin']}><AdminSubscriptions /></ProtectedRoute>} />
                  <Route path="/admin/subscription-tiers" element={<ProtectedRoute allowedRoles={['admin']}><AdminSubscriptionTiers /></ProtectedRoute>} />
                  <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={['admin']}><AdminDisputes /></ProtectedRoute>} />
                  <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
                  <Route path="/admin/platform-config" element={<ProtectedRoute allowedRoles={['admin']}><AdminPlatformConfig /></ProtectedRoute>} />
                  <Route path="/admin/chatbot" element={<ProtectedRoute allowedRoles={['admin']}><AdminChatbot /></ProtectedRoute>} />
                  <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />
                  <Route path="/admin/2fa" element={<ProtectedRoute allowedRoles={['admin']}><Admin2FA /></ProtectedRoute>} />
                  
                  {/* Merchant Routes - Nested with layout */}
                  <Route path="/merchant" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantLayoutRoute /></ProtectedRoute>}>
                    <Route index element={<MerchantDashboard />} />
                    {/* Standalone pages */}
                    <Route path="profile" element={<MerchantProfile />} />
                    <Route path="properties" element={<MerchantProperties />} />
                    <Route path="properties/:id" element={<MerchantPropertyDetail />} />
                    <Route path="tenants" element={<MerchantTenants />} />
                    <Route path="tenants/:tenantId" element={<Suspense fallback={<PageLoader />}><MerchantTenantDetail /></Suspense>} />
                    <Route path="invoices" element={<MerchantInvoices />} />
                    <Route path="invoices/:invoiceId" element={<MerchantInvoiceDetail />} />
                    <Route path="payments" element={<MerchantPayments />} />
                    <Route path="payments/:paymentId" element={<MerchantPaymentDetail />} />
                    <Route path="maintenance" element={<MerchantMaintenance />} />
                    <Route path="maintenance/:id" element={<MerchantMaintenanceDetail />} />
                    <Route path="insights" element={<MerchantInsightsHub />} />
                    <Route path="settings" element={<MerchantSettings />} />
                    <Route path="units" element={<Navigate to="/merchant/properties" replace />} />
                    <Route path="units/:id" element={<MerchantUnitDetail />} />
                    <Route path="guardians" element={<MerchantGuardians />} />
                    <Route path="billing" element={<MerchantBilling />} />
                    <Route path="reports" element={<MerchantReports />} />
                    <Route path="support" element={<MerchantSupport />} />
                    <Route path="feedback" element={<MerchantFeedback />} />
                    <Route path="inventory" element={<MerchantInventory />} />
                    <Route path="ocr-tutorial" element={<MerchantOcrTutorial />} />
                    <Route path="tenant-analytics" element={<MerchantTenantAnalytics />} />
                    <Route path="compliance" element={<Navigate to="/merchant/properties" replace />} />
                    {/* Insights sub-pages */}
                    <Route path="analytics-dashboard" element={<MerchantAnalyticsDashboard />} />
                    <Route path="report-templates" element={<MerchantReportTemplates />} />
                    <Route path="comparative-portfolio" element={<MerchantComparativePortfolio />} />
                    <Route path="market-intelligence" element={<MerchantMarketIntelligence />} />
                    {/* Legacy redirects */}
                    <Route path="assets" element={<Navigate to="/merchant/properties" replace />} />
                    <Route path="occupancy" element={<Navigate to="/merchant/tenants" replace />} />
                    <Route path="finance" element={<Navigate to="/merchant/invoices" replace />} />
                    <Route path="transactions" element={<Navigate to="/merchant/invoices" replace />} />
                    <Route path="operations" element={<Navigate to="/merchant/maintenance" replace />} />
                    <Route path="legal" element={<Navigate to="/merchant/compliance" replace />} />
                    <Route path="analytics" element={<Navigate to="/merchant/insights" replace />} />
                    <Route path="ai-insights" element={<Navigate to="/merchant/insights" replace />} />
                    <Route path="help" element={<Navigate to="/merchant/documents" replace />} />
                  </Route>

                  {/* Tenant Routes */}
                  <Route path="/tenant" element={<ProtectedRoute allowedRoles={['tenant']}><TenantDashboard /></ProtectedRoute>} />
                  <Route path="/tenant/maintenance" element={<ProtectedRoute allowedRoles={['tenant']}><TenantMaintenance /></ProtectedRoute>} />
                  <Route path="/tenant/maintenance/:requestId" element={<ProtectedRoute allowedRoles={['tenant']}><TenantMaintenanceDetail /></ProtectedRoute>} />
                  <Route path="/tenant/payments" element={<ProtectedRoute allowedRoles={['tenant']}><TenantPayments /></ProtectedRoute>} />
                  <Route path="/tenant/settings" element={<ProtectedRoute allowedRoles={['tenant']}><TenantSettings /></ProtectedRoute>} />
                  <Route path="/tenant/profile" element={<ProtectedRoute allowedRoles={['tenant']}><TenantProfile /></ProtectedRoute>} />
                  <Route path="/tenant/invoices" element={<ProtectedRoute allowedRoles={['tenant']}><TenantInvoices /></ProtectedRoute>} />
                  <Route path="/tenant/invoices/:invoiceId" element={<ProtectedRoute allowedRoles={['tenant']}><TenantInvoiceDetail /></ProtectedRoute>} />
                  
                  {/* Payment Redirect Pages (no auth required - redirect from Xendit) */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/failed" element={<PaymentFailed />} />
                  
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>

          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
</HelmetProvider>
);

export default App;
