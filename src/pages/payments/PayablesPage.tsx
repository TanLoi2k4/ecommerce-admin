import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle, Clock, Search } from 'lucide-react';
import { usePlatformPayables, useVendorPayables } from '../../hooks/usePayments';
import { useVendorShopNames } from '../../hooks/useVendors';
import type {
  PaymentStatus,
  PlatformPayableToVendor,
  VendorPayableToPlatform,
} from '../../types/payment';
import { DataTable } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageTitle } from '../../components/ui/PageTitle';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { MoneyFlowBanner } from '../../components/payments/MoneyFlowBanner';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { shortVendorId, vendorShopLabel } from '../../utils/paymentLabels';

type Tab = 'platform-to-vendor' | 'vendor-to-platform';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
  { value: 'PARTIALLY_REFUNDED', label: 'Hoàn tiền một phần' },
];

function sumAmount<T extends { amount: number }>(rows: T[]) {
  return rows.reduce((total, row) => total + row.amount, 0);
}

function VendorCell({
  vendorKeycloakId,
  names,
}: {
  vendorKeycloakId?: string | null;
  names: Map<string, string>;
}) {
  return (
    <div>
      <p className="font-medium text-gray-900 dark:text-gray-100">
        {vendorShopLabel(vendorKeycloakId, names)}
      </p>
      {vendorKeycloakId && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{shortVendorId(vendorKeycloakId)}</p>
      )}
    </div>
  );
}

export function PayablesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('platform-to-vendor');
  const [page, setPage] = useState(1);
  const [orderCodeSearch, setOrderCodeSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [status, setStatus] = useState('');

  const filterParams = useMemo(
    () => ({
      orderCode: orderCodeSearch.trim() || undefined,
    }),
    [orderCodeSearch]
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, orderCodeSearch, vendorSearch, status]);

  const {
    data: platformPayables = [],
    isLoading: platformLoading,
    error: platformError,
  } = usePlatformPayables(filterParams);

  const {
    data: vendorPayables = [],
    isLoading: vendorLoading,
    error: vendorError,
  } = useVendorPayables(filterParams);

  const activeRows = activeTab === 'platform-to-vendor' ? platformPayables : vendorPayables;
  const isLoading = activeTab === 'platform-to-vendor' ? platformLoading : vendorLoading;
  const queryError = activeTab === 'platform-to-vendor' ? platformError : vendorError;

  const vendorIds = useMemo(
    () =>
      [
        ...new Set(
          [...platformPayables, ...vendorPayables]
            .map((row) => row.vendorKeycloakId)
            .filter(Boolean)
        ),
      ] as string[],
    [platformPayables, vendorPayables]
  );

  const { data: vendorNames = new Map<string, string>() } = useVendorShopNames(vendorIds);

  const filteredRows = useMemo(() => {
    const statusFilter = status.toUpperCase() as PaymentStatus | '';
    const vendorQuery = vendorSearch.trim().toLowerCase();

    return activeRows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (vendorQuery) {
        const shopName = row.vendorKeycloakId ? vendorNames.get(row.vendorKeycloakId) : undefined;
        const haystack = `${shopName ?? ''} ${row.vendorKeycloakId ?? ''}`.toLowerCase();
        if (!haystack.includes(vendorQuery)) return false;
      }
      return true;
    });
  }, [activeRows, status, vendorSearch, vendorNames]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const displayError = queryError ? extractApiError(queryError, 'Không thể tải công nợ') : null;

  const platformPending = platformPayables.filter((row) => row.status === 'PENDING');
  const vendorPending = vendorPayables.filter((row) => row.status === 'PENDING');
  const filteredPending = filteredRows.filter((row) => row.status === 'PENDING');
  const filteredCompleted = filteredRows.filter((row) => row.status === 'COMPLETED');

  const platformColumns = [
    { key: 'orderCode', header: 'Đơn hàng' },
    {
      key: 'subOrderId',
      header: 'Đơn con',
      render: (row: PlatformPayableToVendor) => (row.subOrderId != null ? `#${row.subOrderId}` : '—'),
    },
    {
      key: 'vendor',
      header: 'Nhà bán',
      render: (row: PlatformPayableToVendor) => (
        <VendorCell vendorKeycloakId={row.vendorKeycloakId} names={vendorNames} />
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (row: PlatformPayableToVendor) => (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.amount, 'VND')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: PlatformPayableToVendor) => <StatusBadge status={row.status.toLowerCase()} />,
    },
    {
      key: 'paidAt',
      header: 'Chi trả lúc',
      render: (row: PlatformPayableToVendor) => (row.paidAt ? formatDateTime(row.paidAt) : '—'),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (row: PlatformPayableToVendor) => (row.createdAt ? formatDate(row.createdAt) : '—'),
    },
  ];

  const vendorColumns = [
    { key: 'orderCode', header: 'Đơn hàng' },
    {
      key: 'subOrderId',
      header: 'Đơn con',
      render: (row: VendorPayableToPlatform) => (row.subOrderId != null ? `#${row.subOrderId}` : '—'),
    },
    {
      key: 'vendor',
      header: 'Nhà bán',
      render: (row: VendorPayableToPlatform) => (
        <VendorCell vendorKeycloakId={row.vendorKeycloakId} names={vendorNames} />
      ),
    },
    {
      key: 'amount',
      header: 'Hoa hồng',
      render: (row: VendorPayableToPlatform) => (
        <span className="font-medium text-amber-600 dark:text-amber-400">
          {formatCurrency(row.amount, 'VND')}
        </span>
      ),
    },
    {
      key: 'commissionRate',
      header: 'Tỷ lệ',
      render: (row: VendorPayableToPlatform) => `${row.commissionRate}%`,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: VendorPayableToPlatform) => <StatusBadge status={row.status.toLowerCase()} />,
    },
    {
      key: 'paidAt',
      header: 'Thanh toán lúc',
      render: (row: VendorPayableToPlatform) => (row.paidAt ? formatDateTime(row.paidAt) : '—'),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (row: VendorPayableToPlatform) => (row.createdAt ? formatDate(row.createdAt) : '—'),
    },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Công nợ hai chiều"
        subtitle="Theo dõi tiền sàn trả nhà bán và phí nhà bán trả sàn — hai chiều tách nhau, không cấn trừ."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setActiveTab('platform-to-vendor')}
          className={cn(
            'rounded-xl border p-5 text-left transition-all',
            activeTab === 'platform-to-vendor'
              ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200 dark:border-emerald-700 dark:bg-emerald-950/30 dark:ring-emerald-900'
              : 'border-gray-200 bg-white hover:border-emerald-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-emerald-800'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Sàn trả nhà bán</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Doanh thu đơn hoàn tất, chờ gom vào lệnh chi trả
              </p>
              <p className="mt-3 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(sumAmount(platformPending), 'VND')}
              </p>
              <p className="text-xs text-gray-500">{platformPending.length} khoản đang chờ</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendor-to-platform')}
          className={cn(
            'rounded-xl border p-5 text-left transition-all',
            activeTab === 'vendor-to-platform'
              ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200 dark:border-amber-700 dark:bg-amber-950/30 dark:ring-amber-900'
              : 'border-gray-200 bg-white hover:border-amber-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-amber-800'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Nhà bán trả sàn</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Phí hoa hồng theo đơn, nhà bán thanh toán qua hóa đơn VNPay
              </p>
              <p className="mt-3 text-lg font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(sumAmount(vendorPending), 'VND')}
              </p>
              <p className="text-xs text-gray-500">{vendorPending.length} khoản đang chờ</p>
            </div>
          </div>
        </button>
      </div>

      <MoneyFlowBanner
        direction={activeTab}
        links={
          activeTab === 'platform-to-vendor'
            ? [
                { label: 'Chi trả nhà bán', to: '/payments/payout-approvals' },
                { label: 'Xác minh ngân hàng', to: '/payments/payouts' },
              ]
            : [{ label: 'Giao dịch', to: '/payments/transactions' }]
        }
      />

      {displayError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {displayError}
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DashboardCard
              title={activeTab === 'platform-to-vendor' ? 'Khoản sàn phải trả' : 'Khoản phí hoa hồng'}
              value={filteredRows.length}
              icon={activeTab === 'platform-to-vendor' ? ArrowDownLeft : ArrowUpRight}
              comparison="Sau bộ lọc hiện tại"
            />
            <DashboardCard
              title="Đang chờ"
              value={formatCurrency(sumAmount(filteredPending), 'VND')}
              icon={Clock}
              iconColor="text-amber-600 dark:text-amber-400"
              iconBgColor="bg-amber-50 dark:bg-amber-900/20"
              comparison={`${filteredPending.length} bản ghi`}
            />
            <DashboardCard
              title="Đã hoàn thành"
              value={formatCurrency(sumAmount(filteredCompleted), 'VND')}
              icon={CheckCircle}
              iconColor="text-emerald-600 dark:text-emerald-400"
              iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
              comparison={`${filteredCompleted.length} bản ghi`}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Tìm theo mã đơn hàng
              </label>
              <SearchBar placeholder="ORD-..." onSearch={setOrderCodeSearch} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Tìm theo nhà bán
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Tên cửa hàng"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <EmptyState
              title={
                activeTab === 'platform-to-vendor'
                  ? 'Không có khoản sàn phải trả'
                  : 'Không có khoản phí hoa hồng'
              }
              description="Thử điều chỉnh bộ lọc hoặc chờ đơn hàng hoàn thành."
              icon="inbox"
            />
          ) : (
            <>
              {activeTab === 'platform-to-vendor' ? (
                <DataTable
                  columns={platformColumns}
                  data={paginatedRows as PlatformPayableToVendor[]}
                  keyExtractor={(row) => String(row.id)}
                />
              ) : (
                <DataTable
                  columns={vendorColumns}
                  data={paginatedRows as VendorPayableToPlatform[]}
                  keyExtractor={(row) => String(row.id)}
                />
              )}
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  );
}
