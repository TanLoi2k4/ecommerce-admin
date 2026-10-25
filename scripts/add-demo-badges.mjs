import fs from 'fs';
import path from 'path';

const mockPages = [
  'src/pages/dashboard/DashboardPage.tsx',
  'src/pages/users/UserListPage.tsx',
  'src/pages/users/UserDetailsPage.tsx',
  'src/pages/vendors/VendorListPage.tsx',
  'src/pages/vendors/VendorDetailsPage.tsx',
  'src/pages/vendors/VendorApprovalsPage.tsx',
  'src/pages/vendors/VendorAnalyticsPage.tsx',
  'src/pages/categories/CategoryListPage.tsx',
  'src/pages/categories/CategoryTreePage.tsx',
  'src/pages/orders/OrdersDashboardPage.tsx',
  'src/pages/orders/OrderListPage.tsx',
  'src/pages/orders/OrderDetailsPage.tsx',
  'src/pages/orders/RefundRequestsPage.tsx',
  'src/pages/payments/PaymentDashboardPage.tsx',
  'src/pages/payments/TransactionListPage.tsx',
  'src/pages/payments/PayoutRequestsPage.tsx',
  'src/pages/promotions/FlashSalePage.tsx',
  'src/pages/promotions/VoucherPage.tsx',
  'src/pages/promotions/CampaignPage.tsx',
  'src/pages/reports/RevenueReportPage.tsx',
  'src/pages/reports/VendorReportPage.tsx',
  'src/pages/communication/NotificationMgmtPage.tsx',
  'src/pages/communication/SupportTicketsPage.tsx',
  'src/pages/system/SystemSettingsPage.tsx',
  'src/pages/system/PlatformConfigPage.tsx',
  'src/pages/system/FeatureFlagsPage.tsx',
  'src/pages/system/CMSPage.tsx',
];

const importLine = "import { DemoDataBadge } from '../../components/ui/DemoDataBadge';";

for (const rel of mockPages) {
  const file = path.join(process.cwd(), rel);
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('DemoDataBadge')) {
    console.log('skip', rel);
    continue;
  }
  const lastImportIdx = content.lastIndexOf('import ');
  const end = content.indexOf('\n', lastImportIdx);
  content = content.slice(0, end + 1) + importLine + '\n' + content.slice(end + 1);
  content = content.replace(
    /(<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">[^<]+<\/h1>)/,
    '<div className="flex items-center gap-3">$1<DemoDataBadge /></div>'
  );
  fs.writeFileSync(file, content);
  console.log('updated', rel);
}
