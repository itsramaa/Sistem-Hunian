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
import Invite from "./pages/Invite";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMerchants from "./pages/admin/Merchants";
import AdminEscrow from "./pages/admin/Escrow";
import AdminVendors from "./pages/admin/Vendors";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminSubscriptionTiers from "./pages/admin/SubscriptionTiers";
import AdminDisputes from "./pages/admin/Disputes";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminVendorVerifications from "./pages/admin/VendorVerifications";
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantProperties from "./pages/merchant/Properties";
import MerchantTenants from "./pages/merchant/Tenants";
import MerchantMaintenance from "./pages/merchant/Maintenance";
import MerchantPayments from "./pages/merchant/Payments";
import MerchantReports from "./pages/merchant/Reports";
import MerchantInvoices from "./pages/merchant/Invoices";
import MerchantSettings from "./pages/merchant/Settings";
import MerchantUnits from "./pages/merchant/Units";
import MerchantEscrow from "./pages/merchant/Escrow";
import MerchantReferrals from "./pages/merchant/Referrals";
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantMaintenance from "./pages/tenant/Maintenance";
import TenantMaintenanceDetail from "./pages/tenant/MaintenanceDetail";
import TenantSignContract from "./pages/tenant/SignContract";
import TenantPayments from "./pages/tenant/Payments";
import TenantSettings from "./pages/tenant/Settings";
import TenantContracts from "./pages/tenant/Contracts";
import TenantInvoices from "./pages/tenant/Invoices";
import TenantMarketplace from "./pages/tenant/Marketplace";
import TenantVendorDetail from "./pages/tenant/VendorDetail";
import TenantOrders from "./pages/tenant/Orders";
import TenantForum from "./pages/tenant/Forum";
import TenantForumPost from "./pages/tenant/ForumPost";
import TenantReferrals from "./pages/tenant/Referrals";
import VendorDashboard from "./pages/vendor/Dashboard";
import VendorJobs from "./pages/vendor/Jobs";
import VendorEarnings from "./pages/vendor/Earnings";
import VendorProfile from "./pages/vendor/Profile";
import VendorSettings from "./pages/vendor/Settings";
import VendorProducts from "./pages/vendor/Products";
import VendorReferrals from "./pages/vendor/Referrals";
import NotFound from "./pages/NotFound";
import { ChatbotWidget } from "./components/chatbot/ChatbotWidget";

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/invite/:token" element={<Invite />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/merchants" element={<ProtectedRoute allowedRoles={['admin']}><AdminMerchants /></ProtectedRoute>} />
            <Route path="/admin/escrow" element={<ProtectedRoute allowedRoles={['admin']}><AdminEscrow /></ProtectedRoute>} />
            <Route path="/admin/vendors" element={<ProtectedRoute allowedRoles={['admin']}><AdminVendors /></ProtectedRoute>} />
            <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={['admin']}><AdminSubscriptions /></ProtectedRoute>} />
            <Route path="/admin/subscription-tiers" element={<ProtectedRoute allowedRoles={['admin']}><AdminSubscriptionTiers /></ProtectedRoute>} />
            <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={['admin']}><AdminDisputes /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/vendor-verifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminVendorVerifications /></ProtectedRoute>} />
            
            {/* Merchant Routes */}
            <Route path="/merchant" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantDashboard /></ProtectedRoute>} />
            <Route path="/merchant/properties" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantProperties /></ProtectedRoute>} />
            <Route path="/merchant/tenants" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantTenants /></ProtectedRoute>} />
            <Route path="/merchant/maintenance" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantMaintenance /></ProtectedRoute>} />
            <Route path="/merchant/payments" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantPayments /></ProtectedRoute>} />
            <Route path="/merchant/reports" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantReports /></ProtectedRoute>} />
            <Route path="/merchant/invoices" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantInvoices /></ProtectedRoute>} />
            <Route path="/merchant/settings" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantSettings /></ProtectedRoute>} />
            <Route path="/merchant/units" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantUnits /></ProtectedRoute>} />
            <Route path="/merchant/escrow" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantEscrow /></ProtectedRoute>} />
            <Route path="/merchant/referrals" element={<ProtectedRoute allowedRoles={['merchant']}><MerchantReferrals /></ProtectedRoute>} />
            
            {/* Tenant Routes */}
            <Route path="/tenant" element={<ProtectedRoute allowedRoles={['tenant']}><TenantDashboard /></ProtectedRoute>} />
            <Route path="/tenant/maintenance" element={<ProtectedRoute allowedRoles={['tenant']}><TenantMaintenance /></ProtectedRoute>} />
            <Route path="/tenant/maintenance/:requestId" element={<ProtectedRoute allowedRoles={['tenant']}><TenantMaintenanceDetail /></ProtectedRoute>} />
            <Route path="/tenant/sign-contract/:contractId" element={<ProtectedRoute allowedRoles={['tenant']}><TenantSignContract /></ProtectedRoute>} />
            <Route path="/tenant/payments" element={<ProtectedRoute allowedRoles={['tenant']}><TenantPayments /></ProtectedRoute>} />
            <Route path="/tenant/settings" element={<ProtectedRoute allowedRoles={['tenant']}><TenantSettings /></ProtectedRoute>} />
            <Route path="/tenant/contracts" element={<ProtectedRoute allowedRoles={['tenant']}><TenantContracts /></ProtectedRoute>} />
            <Route path="/tenant/invoices" element={<ProtectedRoute allowedRoles={['tenant']}><TenantInvoices /></ProtectedRoute>} />
            <Route path="/tenant/marketplace" element={<ProtectedRoute allowedRoles={['tenant']}><TenantMarketplace /></ProtectedRoute>} />
            <Route path="/tenant/marketplace/:vendorId" element={<ProtectedRoute allowedRoles={['tenant']}><TenantVendorDetail /></ProtectedRoute>} />
            <Route path="/tenant/orders" element={<ProtectedRoute allowedRoles={['tenant']}><TenantOrders /></ProtectedRoute>} />
            <Route path="/tenant/forum" element={<ProtectedRoute allowedRoles={['tenant']}><TenantForum /></ProtectedRoute>} />
            <Route path="/tenant/forum/:postId" element={<ProtectedRoute allowedRoles={['tenant']}><TenantForumPost /></ProtectedRoute>} />
            <Route path="/tenant/referrals" element={<ProtectedRoute allowedRoles={['tenant']}><TenantReferrals /></ProtectedRoute>} />
            
            {/* Vendor Routes */}
            <Route path="/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
            <Route path="/vendor/products" element={<ProtectedRoute allowedRoles={['vendor']}><VendorProducts /></ProtectedRoute>} />
            <Route path="/vendor/jobs" element={<ProtectedRoute allowedRoles={['vendor']}><VendorJobs /></ProtectedRoute>} />
            <Route path="/vendor/earnings" element={<ProtectedRoute allowedRoles={['vendor']}><VendorEarnings /></ProtectedRoute>} />
            <Route path="/vendor/profile" element={<ProtectedRoute allowedRoles={['vendor']}><VendorProfile /></ProtectedRoute>} />
            <Route path="/vendor/settings" element={<ProtectedRoute allowedRoles={['vendor']}><VendorSettings /></ProtectedRoute>} />
            <Route path="/vendor/referrals" element={<ProtectedRoute allowedRoles={['vendor']}><VendorReferrals /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatbotWidget />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
