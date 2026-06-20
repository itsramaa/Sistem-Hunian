import { Loader2 } from "lucide-react";
import { MerchantLayoutRoute } from "@/app/layouts/MerchantLayoutRoute";
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";

// Utility
const Index = lazy(() => import("@/app/pages/HomePage"));
const NotFound = lazy(() => import("@/app/pages/NotFoundPage"));
const Unauthorized = lazy(() => import("@/app/pages/UnauthorizedPage"));

// Auth
const Auth = lazy(() => import("@/features/auth/pages/Auth"));
const ResetPassword = lazy(() => import("@/features/auth/pages/ResetPassword"));
const UpdatePassword = lazy(() => import("@/features/auth/pages/UpdatePassword"));

// Admin stubs
const AdminLogin = lazy(() => import("@/features/admin/pages/AdminLogin"));
const Admin2FA = lazy(() => import("@/features/admin/pages/Admin2FA"));
const AdminDashboard = lazy(() => import("@/features/admin/pages/Dashboard"));
const AdminMerchants = lazy(() => import("@/features/admin/pages/Merchants"));
const AdminProperties = lazy(() => import("@/features/admin/pages/Properties"));
const AdminTenants = lazy(() => import("@/features/admin/pages/Tenants"));
const AdminUsers = lazy(() => import("@/features/admin/pages/AdminUsers"));
const AdminSettings = lazy(() => import("@/features/admin/pages/Settings"));

// SRS core features — §4.2–§4.8 + Audit Trail
const OperatorDashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const OperatorProperties = lazy(() => import("@/features/properties/pages/Properties"));
const OperatorRooms = lazy(() => import("@/features/rooms/pages/Rooms"));
const OperatorTenants = lazy(() => import("@/features/tenants/pages/Tenants"));
const OperatorPayments = lazy(() => import("@/features/payments/pages/Payments"));
const OperatorConfirmations = lazy(() => import("@/features/confirmations/pages/ConfirmationsPage"));
const OperatorMaintenance = lazy(() => import("@/features/maintenance/pages/Maintenance"));
const OperatorAuditTrail = lazy(() => import("@/features/audit/pages/AuditTrailPage"));
const OperatorNotifications = lazy(() => import("@/features/notifications/pages/NotificationHistory"));
const OperatorProfile = lazy(() => import("@/features/profile/pages/Profile"));
const OperatorSettingsPage = lazy(() => import("@/features/profile/pages/Settings"));

// Full-page loader — for top-level routes (login, admin, public pages)
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Content-area loader — sidebar stays visible, only content area shows spinner
const ContentLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
  </div>
);

// S = full-page Suspense (login, admin, public)
const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// DS = content-area Suspense (inside dashboard layout — sidebar stays)
const DS = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<ContentLoader />}>{children}</Suspense>
);

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<S><Index /></S>} />
      <Route path="/login" element={<S><Auth /></S>} />
      <Route path="/reset-password" element={<S><ResetPassword /></S>} />
      <Route path="/update-password" element={<S><UpdatePassword /></S>} />
      <Route path="/unauthorized" element={<S><Unauthorized /></S>} />

      {/* Admin */}
      <Route path="/admin/login" element={<S><AdminLogin /></S>} />
      <Route path="/admin/2fa" element={<S><Admin2FA /></S>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><S><AdminDashboard /></S></ProtectedRoute>} />
      <Route path="/admin/merchants" element={<ProtectedRoute allowedRoles={['admin']}><S><AdminMerchants /></S></ProtectedRoute>} />
      <Route path="/admin/properties" element={<ProtectedRoute allowedRoles={['admin']}><S><AdminProperties /></S></ProtectedRoute>} />
      <Route path="/admin/tenants" element={<ProtectedRoute allowedRoles={['admin']}><S><AdminTenants /></S></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><S><AdminUsers /></S></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><S><AdminSettings /></S></ProtectedRoute>} />

      {/* Dashboard — sidebar stays on all child route transitions */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['operator', 'manager', 'viewer']}>
            <MerchantLayoutRoute />
          </ProtectedRoute>
        }
      >
        <Route index element={<DS><OperatorDashboard /></DS>} />
        {/* §4.3 Properti */}
        <Route path="properties" element={<ProtectedRoute allowedRoles={['operator']}><DS><OperatorProperties /></DS></ProtectedRoute>} />
        {/* §4.4 Kamar */}
        <Route path="rooms" element={<ProtectedRoute allowedRoles={['operator']}><DS><OperatorRooms /></DS></ProtectedRoute>} />
        {/* §4.5 Penghuni */}
        <Route path="tenants" element={<ProtectedRoute allowedRoles={['operator']}><DS><OperatorTenants /></DS></ProtectedRoute>} />
        {/* §4.6 Pembayaran */}
        <Route path="payments" element={<ProtectedRoute allowedRoles={['operator']}><DS><OperatorPayments /></DS></ProtectedRoute>} />
        {/* §4.7 Konfirmasi DP */}
        <Route path="confirmations" element={<ProtectedRoute allowedRoles={['operator']}><DS><OperatorConfirmations /></DS></ProtectedRoute>} />
        {/* §4.8 Maintenance */}
        <Route path="maintenance" element={<ProtectedRoute allowedRoles={['operator', 'manager']}><DS><OperatorMaintenance /></DS></ProtectedRoute>} />
        {/* Audit Trail */}
        <Route path="audit" element={<ProtectedRoute allowedRoles={['operator', 'manager']}><DS><OperatorAuditTrail /></DS></ProtectedRoute>} />
        {/* Misc */}
        <Route path="notifications" element={<DS><OperatorNotifications /></DS>} />
        <Route path="profile" element={<DS><OperatorProfile /></DS>} />
        <Route path="settings" element={<DS><OperatorSettingsPage /></DS>} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/merchant" element={<Navigate to="/dashboard" replace />} />
      <Route path="/merchant/*" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<S><NotFound /></S>} />
    </Routes>
  );
}
