import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Eye, X } from 'lucide-react';
import { useBankAccounts, useVendorShopNames, useVerifyBankAccount } from '../../hooks/useVendors';
import type { AccountVerificationStatus, VendorBankAccountResponse } from '../../types/vendor';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageTitle } from '../../components/ui/PageTitle';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { SearchBar } from '../../components/ui/SearchBar';
import { MoneyFlowBanner } from '../../components/payments/MoneyFlowBanner';
import { PaymentStatusTabs } from '../../components/payments/PaymentStatusTabs';
import { formatDate, formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';
import { BANK_VERIFICATION_LABELS, shortVendorId, vendorShopLabel } from '../../utils/paymentLabels';

const STATUS_TABS: { id: AccountVerificationStatus | 'ALL'; label: string }[] = [
  { id: 'PENDING', label: 'Chờ xác minh' },
  { id: 'VERIFIED', label: 'Đã xác minh' },
  { id: 'REJECTED', label: 'Từ chối' },
  { id: 'FAILED', label: 'Thất bại' },
  { id: 'ALL', label: 'Tất cả' },
];

export function PayoutRequestsPage() {
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<AccountVerificationStatus | 'ALL'>('PENDING');
  const [vendorName, setVendorName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<VendorBankAccountResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [statusTab, vendorName]);

  const { data, isLoading, error: queryError } = useBankAccounts({
    page,
    size: 10,
    verificationStatus: statusTab === 'ALL' ? undefined : statusTab,
    vendorName: vendorName || undefined,
  });
  const verifyMutation = useVerifyBankAccount();

  const accounts = data?.data ?? [];
  const pagination = { page: data?.page ?? 1, totalPages: data?.totalPages ?? 1, total: data?.total ?? 0 };
  const displayError =
    error ?? (queryError ? extractApiError(queryError, 'Không thể tải tài khoản ngân hàng') : null);

  const vendorIds = useMemo(
    () => [...new Set(accounts.map((account) => account.vendorKeycloakId).filter(Boolean))],
    [accounts]
  );
  const { data: vendorNames = new Map<string, string>() } = useVendorShopNames(vendorIds);

  const handleVerify = async (vendorKeycloakId: string, isValid: boolean) => {
    setError(null);
    try {
      await verifyMutation.mutateAsync({ vendorKeycloakId, isValid });
      setSelectedAccount(null);
    } catch (err) {
      setError(extractApiError(err, isValid ? 'Không thể xác minh tài khoản' : 'Không thể từ chối tài khoản'));
    }
  };

  const columns = [
    {
      key: 'vendor',
      header: 'Nhà bán',
      render: (row: VendorBankAccountResponse) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {vendorShopLabel(row.vendorKeycloakId, vendorNames)}
          </p>
          <p className="font-mono text-xs text-gray-500">{shortVendorId(row.vendorKeycloakId)}</p>
        </div>
      ),
    },
    {
      key: 'accountName',
      header: 'Chủ tài khoản',
      render: (row: VendorBankAccountResponse) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.accountName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.bankName}</p>
        </div>
      ),
    },
    { key: 'accountNumber', header: 'Số tài khoản' },
    { key: 'bankCode', header: 'Mã ngân hàng' },
    {
      key: 'verificationStatus',
      header: 'Trạng thái',
      render: (row: VendorBankAccountResponse) => (
        <StatusBadge status={row.verificationStatus.toLowerCase()} />
      ),
    },
    {
      key: 'verifiedAt',
      header: 'Xác minh lúc',
      render: (row: VendorBankAccountResponse) => (row.verifiedAt ? formatDate(row.verifiedAt) : '—'),
    },
    {
      key: 'actions',
      header: '',
      render: (row: VendorBankAccountResponse) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setSelectedAccount(row)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.verificationStatus === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => handleVerify(row.vendorKeycloakId, true)}
                disabled={verifyMutation.isPending}
                className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                title="Xác minh"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleVerify(row.vendorKeycloakId, false)}
                disabled={verifyMutation.isPending}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                title="Từ chối"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Xác minh ngân hàng"
        subtitle="Xác minh tài khoản nhận tiền trước khi nhà bán có thể yêu cầu rút doanh thu"
      />

      <MoneyFlowBanner
        direction="platform-to-vendor"
        description="Tài khoản phải được xác minh thì nhà bán mới gửi được lệnh rút. Sau đó duyệt chi trả trên trang Chi trả nhà bán."
        links={[
          { label: 'Chi trả nhà bán', to: '/payments/payout-approvals' },
          { label: 'Công nợ sàn → nhà bán', to: '/payments/payables' },
        ]}
      />

      {displayError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {displayError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard title="Đang xem" value={pagination.total} icon={CreditCard} />
        <DashboardCard
          title="Trạng thái"
          value={statusTab === 'ALL' ? 'Tất cả' : BANK_VERIFICATION_LABELS[statusTab]}
          icon={Check}
        />
        <DashboardCard
          title="Bước tiếp theo"
          value="Chi trả"
          icon={Eye}
              comparison="Duyệt lệnh rút sau khi xác minh"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PaymentStatusTabs tabs={STATUS_TABS} value={statusTab} onChange={setStatusTab} />
        <SearchBar placeholder="Tìm theo tên nhà bán..." onSearch={setVendorName} className="w-full lg:w-72" />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tài khoản ngân hàng"
          description="Thử điều chỉnh trạng thái hoặc tên nhà bán."
          icon="inbox"
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={accounts}
            keyExtractor={(row) => String((row as VendorBankAccountResponse).id)}
          />
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        title="Chi tiết tài khoản ngân hàng"
        size="md"
      >
        {selectedAccount && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Nhà bán</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {vendorShopLabel(selectedAccount.vendorKeycloakId, vendorNames)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Chủ tài khoản</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAccount.accountName}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Ngân hàng</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAccount.bankName}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Số tài khoản</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAccount.accountNumber}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Mã ngân hàng</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAccount.bankCode}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Loại tài khoản</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAccount.accountType ?? '—'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Trạng thái</label>
                <div className="mt-1">
                  <StatusBadge status={selectedAccount.verificationStatus.toLowerCase()} />
                </div>
              </div>
              {selectedAccount.verifiedAt && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Xác minh lúc</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDateTime(selectedAccount.verifiedAt)}
                  </p>
                </div>
              )}
              {selectedAccount.verificationNotes && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Ghi chú</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedAccount.verificationNotes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => navigate('/vendors')}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Danh sách nhà bán
              </button>
              {selectedAccount.verificationStatus === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleVerify(selectedAccount.vendorKeycloakId, true)}
                    disabled={verifyMutation.isPending}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Xác minh
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify(selectedAccount.vendorKeycloakId, false)}
                    disabled={verifyMutation.isPending}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
