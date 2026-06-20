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

// SRS core features — §4.2–§4.8
const OperatorDashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const OperatorProperties = lazy(() => import("@/features/properties/pages/Properties"));
const OperatorRooms = lazy(() => import("@/features/rooms/pages/Rooms"));
const OperatorTenants = lazy(() => import("@/features/tenants/pages/Tenants"));
const OperatorPayments = lazy(() => import("@/features/payments/pages/Payments"));
const OperatorConfirmations = lazy(() => import("@/features/confirmations/pages/ConfirmationsPage"));
const OperatorMaintenance = lazy(() => import("@/features/maintenance/pages/Maintenance"));
const OperatorNotifications = lazy(() => import("@/features/notifications/pages/NotificationHistory"));
const OperatorProfile = lazy(() => import("@/features/profile/pages/Profile"));
const OperatorSettingsPage = lazy(() => import("@/features/profile/pages/Settings"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
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

      {/* Operator / Manager / Viewer — all behind /dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['operator', 'manager', 'viewer']}>
            <MerchantLayoutRoute />
          </ProtectedRoute>
        }
      >
        <Route index element={<S><OperatorDashboard /></S>} />
        {/* §4.3 Properti */}
        <Route path="properties" element={<S><OperatorProperties /></S>} />
        {/* §4.4 Kamar */}
        <Route path="rooms" element={<S><OperatorRooms /></S>} />
        {/* §4.5 Penghuni */}
        <Route path="tenants" element={<S><OperatorTenants /></S>} />
        {/* §4.6 Pembayaran */}
        <Route path="payments" element={<S><OperatorPayments /></S>} />
        {/* §4.7 Konfirmasi DP */}
        <Route path="confirmations" element={<S><OperatorConfirmations /></S>} />
        {/* §4.8 Maintenance */}
        <Route path="maintenance" element={<S><OperatorMaintenance /></S>} />
        {/* Misc */}
        <Route path="notifications" element={<S><OperatorNotifications /></S>} />
        <Route path="profile" element={<S><OperatorProfile /></S>} />
        <Route path="settings" element={<S><OperatorSettingsPage /></S>} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/merchant" element={<Navigate to="/dashboard" replace />} />
      <Route path="/merchant/*" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<S><NotFound /></S>} />
    </Routes>
  );
}
