import { Loader2 } from "lucide-react";
import { MerchantLayoutRoute } from "@/shared/components/layouts/MerchantLayoutRoute";
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";

// App-level pages
const Index = lazy(() => import("@/app/pages/Index"));
const NotFound = lazy(() => import("@/app/pages/NotFound"));
const Unauthorized = lazy(() => import("@/app/pages/Unauthorized"));

// Auth pages
const AdminSetup = lazy(() => import("@/features/auth/pages/AdminSetup"));
const Auth = lazy(() => import("@/features/auth/pages/Auth"));
const Invite = lazy(() => import("@/features/auth/pages/Invite"));
const Onboarding = lazy(() => import("@/features/auth/pages/Onboarding"));
const ResetPassword = lazy(() => import("@/features/auth/pages/ResetPassword"));
const UpdatePassword = lazy(() => import("@/features/auth/pages/UpdatePassword"));

// Admin Pages
const Admin2FA = lazy(() => import("@/features/dashboard/pages/admin/Admin2FA"));
const AdminAnalytics = lazy(() => import("@/features/dashboard/pages/admin/Analytics"));
const AdminAuditLogs = lazy(() => import("@/features/dashboard/pages/admin/AuditLogs"));
const AdminChatbot = lazy(() => import("@/features/dashboard/pages/admin/Chatbot"));
const AdminDashboard = lazy(() => import("@/features/dashboard/pages/admin/Dashboard"));
const AdminDisputes = lazy(() => import("@/features/dashboard/pages/admin/Disputes"));
const AdminMerchants = lazy(() => import("@/features/dashboard/pages/admin/Merchants"));
const AdminProperties = lazy(() => import("@/features/dashboard/pages/admin/Properties"));
const AdminOrders = lazy(() => import("@/features/dashboard/pages/admin/Orders"));
const AdminPlatformConfig = lazy(() => import("@/features/dashboard/pages/admin/PlatformConfig"));
const AdminSettings = lazy(() => import("@/features/dashboard/pages/admin/Settings"));
const AdminSubscriptionTiers = lazy(() => import("@/features/dashboard/pages/admin/SubscriptionTiers"));
const AdminSubscriptions = lazy(() => import("@/features/dashboard/pages/admin/Subscriptions"));
const AdminTenants = lazy(() => import("@/features/dashboard/pages/admin/Tenants"));
const AdminUsers = lazy(() => import("@/features/dashboard/pages/admin/AdminUsers"));
const AdminLogin = lazy(() => import("@/features/dashboard/pages/admin/AdminLogin"));

// Merchant Pages
const MerchantBilling = lazy(() => import("@/features/billing/pages/Billing"));
const MerchantDashboard = lazy(() => import("@/features/dashboard/pages/MerchantDashboard"));
const MerchantInvoiceDetail = lazy(() => import("@/features/billing/pages/InvoiceDetail"));
const MerchantInvoices = lazy(() => import("@/features/billing/pages/Invoices"));
const MerchantMaintenance = lazy(() => import("@/features/maintenance/pages/Maintenance"));
const MerchantMaintenanceDetail = lazy(() => import("@/features/maintenance/pages/MaintenanceDetail"));
const MerchantMoveOuts = lazy(() => import("@/features/contracts/pages/MoveOuts"));
const MerchantMoveOutDetail = lazy(() => import("@/features/contracts/pages/MoveOutDetail"));
const MerchantPaymentDetail = lazy(() => import("@/features/payments/pages/PaymentDetail"));
const MerchantPayments = lazy(() => import("@/features/payments/pages/Payments"));
const MerchantProfile = lazy(() => import("@/features/profile/pages/Profile"));
const MerchantProperties = lazy(() => import("@/features/properties/pages/Properties"));
const MerchantPropertyDetail = lazy(() => import("@/features/properties/pages/PropertyDetail"));
const MerchantReports = lazy(() => import("@/features/analytics/pages/Reports"));
const MerchantSettings = lazy(() => import("@/features/profile/pages/Settings"));
const MerchantTenants = lazy(() => import("@/features/users/pages/Tenants"));
const MerchantTenantDetail = lazy(() => import("@/features/users/pages/TenantDetail"));
const MerchantUnits = lazy(() => import("@/features/properties/pages/Units"));
const MerchantUnitDetail = lazy(() => import("@/features/properties/pages/UnitDetail"));
const MerchantOcrTutorial = lazy(() => import("@/features/analytics/pages/OcrTutorial"));
const MerchantMarketIntelligence = lazy(() => import("@/features/analytics/pages/MarketIntelligence"));
const MerchantSupport = lazy(() => import("@/features/profile/pages/Support"));
const MerchantGuardians = lazy(() => import("@/features/users/pages/Guardians"));
const MerchantTenantAnalytics = lazy(() => import("@/features/analytics/pages/TenantAnalytics"));
const MerchantDataQuality = lazy(() => import("@/features/analytics/pages/DataQualityHistory"));
const MerchantAnalyticsDashboard = lazy(() => import("@/features/analytics/pages/AnalyticsDashboard"));
const MerchantReportTemplates = lazy(() => import("@/features/analytics/pages/ReportTemplates"));
const MerchantComparativePortfolio = lazy(() => import("@/features/analytics/pages/ComparativePortfolio"));
const MerchantFeedback = lazy(() => import("@/features/analytics/pages/Feedback"));
const MerchantInventory = lazy(() => import("@/features/inventory/pages/Inventory"));
const MerchantInsightsHub = lazy(() => import("@/features/analytics/pages/InsightsHub"));
const MerchantWaitinglist = lazy(() => import("@/features/waitinglist/pages/WaitinglistPage"));

// Tenant Pages
const TenantDashboard = lazy(() => import("@/features/dashboard/pages/TenantDashboard"));
const TenantInvoiceDetail = lazy(() => import("@/features/billing/pages/TenantInvoiceDetail"));
const TenantInvoices = lazy(() => import("@/features/billing/pages/TenantInvoices"));
const TenantMaintenance = lazy(() => import("@/features/maintenance/pages/TenantMaintenance"));
const TenantMaintenanceDetail = lazy(() => import("@/features/maintenance/pages/TenantMaintenanceDetail"));
const TenantMarketplace = lazy(() => import("@/features/orders/pages/Marketplace"));
const TenantOrders = lazy(() => import("@/features/orders/pages/Orders"));
const TenantPayments = lazy(() => import("@/features/payments/pages/TenantPayments"));
const TenantProfile = lazy(() => import("@/features/profile/pages/TenantProfile"));
const TenantSettings = lazy(() => import("@/features/profile/pages/TenantSettings"));
const TenantNotificationHistory = lazy(() => import("@/features/notifications/pages/NotificationHistory"));

// Payment Pages
const PaymentFailed = lazy(() => import("@/features/payments/pages/Failed"));
const PaymentSuccess = lazy(() => import("@/features/payments/pages/Success"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function AppRouter() {
  return (
    <Routes>
      {/* Standalone pages */}
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
      <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />
      <Route path="/admin/2fa" element={<ProtectedRoute allowedRoles={['admin']}><Admin2FA /></ProtectedRoute>} />

      {/* Merchant Routes - Nested with layout */}
      <Route path="/merchant" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantLayoutRoute /></ProtectedRoute>}>
        <Route index element={<MerchantDashboard />} />
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
        <Route path="move-outs" element={<MerchantMoveOuts />} />
        <Route path="move-outs/:noticeId" element={<MerchantMoveOutDetail />} />
        <Route path="reports" element={<MerchantReports />} />
        <Route path="support" element={<MerchantSupport />} />
        <Route path="feedback" element={<MerchantFeedback />} />
        <Route path="inventory" element={<MerchantInventory />} />
        <Route path="waitinglist" element={<MerchantWaitinglist />} />
        <Route path="ocr-tutorial" element={<MerchantOcrTutorial />} />
        <Route path="tenant-analytics" element={<MerchantTenantAnalytics />} />
        <Route path="compliance" element={<Navigate to="/merchant/properties" replace />} />
        <Route path="data-quality" element={<MerchantDataQuality />} />
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
      <Route path="/tenant/marketplace" element={<ProtectedRoute allowedRoles={['tenant']}><TenantMarketplace /></ProtectedRoute>} />
      <Route path="/tenant/orders" element={<ProtectedRoute allowedRoles={['tenant']}><TenantOrders /></ProtectedRoute>} />
      <Route path="/tenant/notifications" element={<ProtectedRoute allowedRoles={['tenant']}><TenantNotificationHistory /></ProtectedRoute>} />

      {/* Payment Redirect Pages (no auth required - redirect from Xendit) */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
