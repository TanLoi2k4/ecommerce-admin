import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, RotateCcw, Send, Wallet, X } from 'lucide-react';
import {
  useAdminPayouts,
  useApprovePayout,
  useRejectPayout,
  useReleasePayoutItems,
} from '../../hooks/usePayments';
import { useVendorShopNames } from '../../hooks/useVendors';
import type { VendorPayout, VendorPayoutStatus } from '../../types/payment';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageTitle } from '../../components/ui/PageTitle';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { MoneyFlowBanner } from '../../components/payments/MoneyFlowBanner';
import { PaymentStatusTabs } from '../../components/payments/PaymentStatusTabs';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';
import {
  maskBankAccount,
  shortVendorId,
  vendorShopLabel,
  VENDOR_PAYOUT_STATUS_LABELS,
} from '../../utils/paymentLabels';

const PAGE_SIZE = 10;

const STATUS_TABS: { id: VendorPayoutStatus; label: string }[] = [
  { id: 'PENDING_APPROVAL', label: 'Chờ phê duyệt' },
  { id: 'APPROVED', label: 'Đã duyệt' },
  { id: 'PROCESSING', label: 'Đang xử lý' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
  { id: 'REJECTED', label: 'Từ chối' },
  { id: 'FAILED', label: 'Thất bại' },
  { id: 'FAILED_RECONCILED', label: 'Đối soát thất bại' },
];

function formatVnd(amount: number) {
  return formatCurrency(amount, 'VND');
}

export function VendorPayoutApprovalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<VendorPayoutStatus>('PENDING_APPROVAL');
  const [selectedPayout, setSelectedPayout] = useState<VendorPayout | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; payout: VendorPayout | null }>({
    open: false,
    payout: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data: payouts = [], isLoading, error: queryError } = useAdminPayouts(statusFilter);
  const approveMutation = useApprovePayout();
  const rejectMutation = useRejectPayout();
  const releaseMutation = useReleasePayoutItems();

  const isMutating =
    approveMutation.isPending || rejectMutation.isPending || releaseMutation.isPending;

  const vendorIds = useMemo(
    () => [...new Set(payouts.map((payout) => payout.vendorKeycloakId).filter(Boolean))],
    [payouts]
  );
  const { data: vendorNames = new Map<string, string>() } = useVendorShopNames(vendorIds);

  const totalPages = Math.max(1, Math.ceil(payouts.length / PAGE_SIZE));
  const paginatedPayouts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return payouts.slice(start, start + PAGE_SIZE);
  }, [payouts, page]);

  const totalGross = payouts.reduce((sum, payout) => sum + payout.grossAmount, 0);
  const totalNet = payouts.reduce((sum, payout) => sum + payout.netAmount, 0);

  const displayError =
    error ?? (queryError ? extractApiError(queryError, 'Không thể tải lệnh chi trả') : null);

  const handleApprove = async (payout: VendorPayout) => {
    setError(null);
    try {
      await approveMutation.mutateAsync(payout.id);
      setSelectedPayout(null);
    } catch (err) {
      setError(extractApiError(err, 'Không thể duyệt chi trả'));
    }
  };

  const handleReject = async () => {
    if (!rejectModal.payout || !rejectReason.trim()) return;
    setError(null);
    try {
      await rejectMutation.mutateAsync({
        payoutId: rejectModal.payout.id,
        reason: rejectReason.trim(),
      });
      setRejectModal({ open: false, payout: null });
      setRejectReason('');
      setSelectedPayout(null);
    } catch (err) {
      setError(extractApiError(err, 'Không thể từ chối chi trả'));
    }
  };

  const handleReleaseItems = async (payout: VendorPayout) => {
    setError(null);
    try {
      await releaseMutation.mutateAsync(payout.id);
      setSelectedPayout(null);
    } catch (err) {
      setError(extractApiError(err, 'Không thể giải phóng các khoản phải trả'));
    }
  };

  const columns = [
    {
      key: 'payoutCode',
      header: 'Mã lệnh',
      render: (row: VendorPayout) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">{row.payoutCode}</span>
      ),
    },
    {
      key: 'vendorKeycloakId',
      header: 'Nhà bán',
      render: (row: VendorPayout) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {vendorShopLabel(row.vendorKeycloakId, vendorNames)}
          </p>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-400" title={row.vendorKeycloakId}>
            {shortVendorId(row.vendorKeycloakId)}
          </p>
        </div>
      ),
    },
    {
      key: 'grossAmount',
      header: 'Tổng',
      render: (row: VendorPayout) => formatVnd(row.grossAmount),
    },
    {
      key: 'netAmount',
      header: 'Thực nhận',
      render: (row: VendorPayout) => (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatVnd(row.netAmount)}</span>
      ),
    },
    {
      key: 'bank',
      header: 'Tài khoản ngân hàng',
      render: (row: VendorPayout) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-gray-100">{row.bankAccountName ?? '—'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {row.bankName ?? '—'} · {maskBankAccount(row.bankAccountNumber)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: VendorPayout) => <StatusBadge status={row.status.toLowerCase()} />,
    },
    {
      key: 'createdAt',
      header: 'Yêu cầu lúc',
      render: (row: VendorPayout) => (row.createdAt ? formatDate(row.createdAt) : '—'),
    },
    {
      key: 'actions',
      header: '',
      render: (row: VendorPayout) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setSelectedPayout(row)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'PENDING_APPROVAL' && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(row)}
                disabled={isMutating}
                className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 disabled:opacity-50"
                title="Duyệt"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectReason('');
                  setRejectModal({ open: true, payout: row });
                }}
                disabled={isMutating}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:opacity-50"
                title="Từ chối"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          {row.status === 'FAILED' && (
            <button
              type="button"
              onClick={() => handleReleaseItems(row)}
              disabled={isMutating}
              className="rounded p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 disabled:opacity-50"
              title="Giải phóng cho chu kỳ tiếp theo"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Chi trả nhà bán"
        subtitle="Duyệt lệnh rút tiền để chuyển doanh thu về tài khoản ngân hàng đã xác minh"
      />

      <MoneyFlowBanner
        direction="platform-to-vendor"
        links={[
          { label: 'Công nợ sàn → nhà bán', to: '/payments/payables' },
          { label: 'Xác minh ngân hàng', to: '/payments/payouts' },
        ]}
      />

      {displayError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {displayError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          title={VENDOR_PAYOUT_STATUS_LABELS[statusFilter]}
          value={payouts.length}
          icon={Send}
        />
        <DashboardCard title="Tổng lệnh" value={formatVnd(totalGross)} icon={Wallet} />
        <DashboardCard
          title="Thực nhận"
          value={formatVnd(totalNet)}
          icon={Check}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
        />
      </div>

      <PaymentStatusTabs tabs={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : payouts.length === 0 ? (
        <EmptyState
          title="Không có lệnh chi trả"
          description="Thử trạng thái khác hoặc chờ nhà bán gửi yêu cầu rút tiền."
          icon="inbox"
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginatedPayouts}
            keyExtractor={(row) => String((row as VendorPayout).id)}
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        title="Chi tiết lệnh chi trả"
        size="lg"
      >
        {selectedPayout && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedPayout.payoutCode}
              </p>
              <StatusBadge status={selectedPayout.status.toLowerCase()} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Nhà bán</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {vendorShopLabel(selectedPayout.vendorKeycloakId, vendorNames)}
                </p>
                <p className="break-all font-mono text-xs text-gray-500">{selectedPayout.vendorKeycloakId}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Mã giao dịch nhà cung cấp</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedPayout.providerTransactionId ?? '—'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Tổng tiền</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatVnd(selectedPayout.grossAmount)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Phí giao dịch</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatVnd(selectedPayout.transactionFee)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Thực nhận</label>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatVnd(selectedPayout.netAmount)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Ngân hàng</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedPayout.bankName ?? '—'} ({selectedPayout.bankCode ?? '—'})
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Chủ tài khoản</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedPayout.bankAccountName ?? '—'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Số tài khoản</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedPayout.bankAccountNumber ?? '—'}
                </p>
              </div>
              {selectedPayout.createdAt && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Yêu cầu lúc</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDateTime(selectedPayout.createdAt)}
                  </p>
                </div>
              )}
              {selectedPayout.rejectionReason && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Lý do từ chối</label>
                  <p className="text-sm text-red-600 dark:text-red-400">{selectedPayout.rejectionReason}</p>
                </div>
              )}
            </div>

            {selectedPayout.payableItems && selectedPayout.payableItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Khoản được gom ({selectedPayout.payableItems.length})
                </h4>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Đơn hàng</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Số tiền</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {selectedPayout.payableItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-mono text-xs">{item.orderCode}</td>
                          <td className="px-3 py-2">{formatVnd(item.amount)}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={item.status.toLowerCase()} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Đóng
              </button>
              {selectedPayout.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedPayout)}
                    disabled={isMutating}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Duyệt chi trả
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReason('');
                      setRejectModal({ open: true, payout: selectedPayout });
                    }}
                    disabled={isMutating}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </>
              )}
              {selectedPayout.status === 'FAILED' && (
                <button
                  type="button"
                  onClick={() => handleReleaseItems(selectedPayout)}
                  disabled={isMutating}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Giải phóng khoản phải trả
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, payout: null })}
        title="Từ chối chi trả"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Từ chối lệnh <strong>{rejectModal.payout?.payoutCode}</strong>. Các khoản thu nhập sẽ được
            trả về trạng thái chờ để nhà bán rút lại sau.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Nhập lý do từ chối..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectModal({ open: false, payout: null })}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!rejectReason.trim() || isMutating}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Xác nhận từ chối
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
