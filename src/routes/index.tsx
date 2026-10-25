import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { SuperAdminRoute } from '../components/auth/SuperAdminRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { UserListPage } from '../pages/users/UserListPage';
import { UserDetailsPage } from '../pages/users/UserDetailsPage';
import { VendorListPage } from '../pages/vendors/VendorListPage';
import { VendorDetailsPage } from '../pages/vendors/VendorDetailsPage';
import { VendorAnalyticsPage } from '../pages/vendors/VendorAnalyticsPage';
import { ProductListPage } from '../pages/products/ProductListPage';
import { ProductModerationPage } from '../pages/products/ProductModerationPage';
import { ProductApprovalQueuePage } from '../pages/products/ProductApprovalQueuePage';
import { ProductDetailsPage } from '../pages/products/ProductDetailsPage';
import { CategoryListPage } from '../pages/categories/CategoryListPage';
import { OrdersDashboardPage } from '../pages/orders/OrdersDashboardPage';
import { OrderListPage } from '../pages/orders/OrderListPage';
import { OrderDetailsPage } from '../pages/orders/OrderDetailsPage';
import { RefundRequestsPage } from '../pages/orders/RefundRequestsPage';
import { TransactionListPage } from '../pages/payments/TransactionListPage';
import { PayoutRequestsPage } from '../pages/payments/PayoutRequestsPage';
import { VendorPayoutApprovalsPage } from '../pages/payments/VendorPayoutApprovalsPage';
import { PayablesPage } from '../pages/payments/PayablesPage';
import { FlashSalePage } from '../pages/promotions/FlashSalePage';
import { VoucherPage } from '../pages/promotions/VoucherPage';
import { CampaignPage } from '../pages/promotions/CampaignPage';
import { RevenueReportPage } from '../pages/reports/RevenueReportPage';
import { VendorReportPage } from '../pages/reports/VendorReportPage';
import { ProductReportPage } from '../pages/reports/ProductReportPage';
import { ComplaintReportsPage } from '../pages/reports/ComplaintReportsPage';
import { ComplaintReportDetailPage } from '../pages/reports/ComplaintReportDetailPage';
import { NotificationMgmtPage } from '../pages/communication/NotificationMgmtPage';
import { NotificationInboxPage } from '../pages/notifications/NotificationInboxPage';
import { SecurityLogsPage } from '../pages/security/SecurityLogsPage';
import { AdminUserListPage } from '../pages/security/AdminUserListPage';
import { AdminUserEditPage } from '../pages/security/AdminUserEditPage';
import { ShipmentListPage } from '../pages/shipments/ShipmentListPage';
import { ShipmentDetailsPage } from '../pages/shipments/ShipmentDetailsPage';
import { CarrierConfigPage } from '../pages/shipments/CarrierConfigPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationInboxPage />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />
        <Route path="/vendors" element={<VendorListPage />} />
        <Route path="/vendors/:id/analytics" element={<VendorAnalyticsPage />} />
        <Route path="/vendors/:id" element={<VendorDetailsPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/moderation" element={<ProductModerationPage />} />
        <Route path="/products/approvals" element={<ProductApprovalQueuePage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/orders" element={<OrdersDashboardPage />} />
        <Route path="/orders/list" element={<OrderListPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/orders/refunds" element={<RefundRequestsPage />} />
        <Route path="/shipments" element={<ShipmentListPage />} />
        <Route
          path="/shipments/carriers"
          element={
            <SuperAdminRoute>
              <CarrierConfigPage />
            </SuperAdminRoute>
          }
        />
        <Route path="/shipments/:id" element={<ShipmentDetailsPage />} />
        <Route path="/payments" element={<Navigate to="/payments/transactions" replace />} />
        <Route path="/payments/transactions" element={<TransactionListPage />} />
        <Route path="/payments/payout-approvals" element={<VendorPayoutApprovalsPage />} />
        <Route path="/payments/payables" element={<PayablesPage />} />
        <Route path="/payments/payouts" element={<PayoutRequestsPage />} />
        <Route path="/promotions/flash-sales" element={<FlashSalePage />} />
        <Route path="/promotions/vouchers" element={<VoucherPage />} />
        <Route path="/promotions/campaigns" element={<CampaignPage />} />
        <Route path="/reports/revenue" element={<RevenueReportPage />} />
        <Route path="/reports/vendors" element={<VendorReportPage />} />
        <Route path="/reports/products" element={<ProductReportPage />} />
        <Route path="/reports/complaints" element={<ComplaintReportsPage />} />
        <Route path="/reports/complaints/:id" element={<ComplaintReportDetailPage />} />
        <Route path="/communication/notifications" element={<NotificationMgmtPage />} />
        <Route path="/security/logs" element={<SecurityLogsPage />} />
        <Route path="/security/audit-logs" element={<Navigate to="/security/logs" replace />} />
        <Route path="/security/activity-logs" element={<Navigate to="/security/logs" replace />} />
        <Route
          path="/security/admin-users"
          element={
            <SuperAdminRoute>
              <AdminUserListPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/security/admin-users/:id"
          element={
            <SuperAdminRoute>
              <AdminUserEditPage />
            </SuperAdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
