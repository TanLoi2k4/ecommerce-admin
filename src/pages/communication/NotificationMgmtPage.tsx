import { useEffect, useMemo, useState } from 'react';
import { Plus, Send, Trash2, Bell, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useBroadcastNotifications, useBroadcastNotificationMutations } from '../../hooks/useNotificationMgmt';
import { customerService } from '../../services/customerService';
import { vendorService } from '../../services/vendorService';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageTitle } from '../../components/ui/PageTitle';
import { extractApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/format';
import {
  BROADCAST_AUDIENCE_OPTIONS,
  BROADCAST_SEVERITY_OPTIONS,
  type BroadcastAudience,
  type BroadcastNotificationResponse,
  type BroadcastSeverity,
  type CreateBroadcastNotificationRequest,
} from '../../types/notification';

const AUDIENCE_LABELS: Record<BroadcastAudience, string> = {
  ALL: 'Tất cả người dùng',
  VENDORS: 'Nhà bán',
  CUSTOMERS: 'Khách hàng',
  USER: 'Người cụ thể',
};

type RecipientKind = 'CUSTOMER' | 'VENDOR';

type SelectedRecipient = {
  keycloakId: string;
  label: string;
  kind: RecipientKind;
};

const emptyForm = () => ({
  title: '',
  message: '',
  severity: 'INFO' as BroadcastSeverity,
  audience: 'ALL' as BroadcastAudience,
});

function audienceDisplay(row: BroadcastNotificationResponse): string {
  if (row.audience === 'USER') {
    return row.recipientLabel?.trim() || 'Người cụ thể';
  }
  return AUDIENCE_LABELS[row.audience];
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function NotificationMgmtPage() {
  const { data: notifications = [], isLoading, error: listError } = useBroadcastNotifications();
  const { create, send, remove } = useBroadcastNotificationMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [recipientKind, setRecipientKind] = useState<RecipientKind>('CUSTOMER');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<BroadcastNotificationResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BroadcastNotificationResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(recipientSearch.trim(), 300);
  const searchEnabled = modalOpen && formData.audience === 'USER' && !selectedRecipient;

  const { data: customerResults, isFetching: searchingCustomers } = useQuery({
    queryKey: ['notification-recipient-customers', debouncedSearch],
    queryFn: () =>
      customerService.list({
        page: 1,
        size: 8,
        status: 'ACTIVE',
        search: debouncedSearch || undefined,
      }),
    enabled: searchEnabled && recipientKind === 'CUSTOMER',
  });

  const { data: vendorResults, isFetching: searchingVendors } = useQuery({
    queryKey: ['notification-recipient-vendors', debouncedSearch],
    queryFn: () =>
      vendorService.list({
        page: 1,
        size: 8,
        status: 'ACTIVE',
        search: debouncedSearch || undefined,
      }),
    enabled: searchEnabled && recipientKind === 'VENDOR',
  });

  const recipientOptions = useMemo(() => {
    if (recipientKind === 'CUSTOMER') {
      return (customerResults?.data ?? [])
        .filter((c) => !!c.keycloakId)
        .map((c) => ({
          keycloakId: c.keycloakId,
          label: `${c.name} (@${c.username})`,
          sub: c.email,
          kind: 'CUSTOMER' as const,
        }));
    }
    return (vendorResults?.data ?? [])
      .filter((v) => !!v.keycloakId)
      .map((v) => ({
        keycloakId: v.keycloakId,
        label: `${v.shopName} (@${v.username})`,
        sub: v.email,
        kind: 'VENDOR' as const,
      }));
  }, [recipientKind, customerResults, vendorResults]);

  const searching = searchingCustomers || searchingVendors;

  const columns = [
    {
      key: 'title',
      header: 'Thông báo',
      render: (row: BroadcastNotificationResponse) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.title}</p>
            <p className="max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">{row.message}</p>
          </div>
        </div>
      ),
    },
    { key: 'severity', header: 'Loại', render: (row: BroadcastNotificationResponse) => <StatusBadge status={row.severity.toLowerCase()} /> },
    {
      key: 'audience',
      header: 'Đối tượng',
      render: (row: BroadcastNotificationResponse) => (
        <div>
          <span>{audienceDisplay(row)}</span>
          {row.audience === 'USER' && row.recipientLabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Người cụ thể</p>
          )}
        </div>
      ),
    },
    { key: 'status', header: 'Trạng thái', render: (row: BroadcastNotificationResponse) => <StatusBadge status={row.status.toLowerCase()} /> },
    {
      key: 'readCount',
      header: 'Đã đọc',
      render: (row: BroadcastNotificationResponse) =>
        row.status === 'SENT' ? `${row.readCount}/${row.recipientCount}` : '—',
    },
    { key: 'createdAt', header: 'Ngày tạo', render: (row: BroadcastNotificationResponse) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row: BroadcastNotificationResponse) => (
        <div className="flex items-center gap-2">
          {row.status === 'DRAFT' && (
            <button
              onClick={() => setSendTarget(row)}
              title="Gửi thông báo"
              className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setDeleteTarget(row)}
            title="Xóa"
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const resetRecipientPicker = () => {
    setRecipientKind('CUSTOMER');
    setRecipientSearch('');
    setSelectedRecipient(null);
  };

  const handleCreate = async () => {
    setFormError(null);
    if (formData.audience === 'USER' && !selectedRecipient) {
      setFormError('Vui lòng chọn người nhận cụ thể.');
      return;
    }
    try {
      const payload: CreateBroadcastNotificationRequest = {
        ...formData,
        ...(formData.audience === 'USER' && selectedRecipient
          ? {
              recipientId: selectedRecipient.keycloakId,
              recipientLabel: selectedRecipient.label,
            }
          : {}),
      };
      await create.mutateAsync(payload);
      setModalOpen(false);
      setFormData(emptyForm());
      resetRecipientPicker();
    } catch (err) {
      setFormError(extractApiError(err, 'Không thể gửi thông báo'));
    }
  };

  const handleSend = async () => {
    if (!sendTarget) return;
    setActionError(null);
    try {
      await send.mutateAsync(sendTarget.id);
      setSendTarget(null);
    } catch (err) {
      setActionError(extractApiError(err, 'Không thể gửi thông báo'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setActionError(extractApiError(err, 'Không thể xóa thông báo'));
    }
  };

  const canSubmit =
    !!formData.title.trim() &&
    !!formData.message.trim() &&
    (formData.audience !== 'USER' || !!selectedRecipient) &&
    !create.isPending;

  return (
    <div className="space-y-4">
      <PageTitle
        title="Quản lý thông báo"
        subtitle="Tạo và gửi thông báo đến hộp thư khách hàng và/hoặc nhà bán trên toàn hệ thống"
      >
        <button
          onClick={() => {
            setFormData(emptyForm());
            resetRecipientPicker();
            setFormError(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> Tạo thông báo
        </button>
      </PageTitle>

      {listError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {extractApiError(listError, 'Không thể tải danh sách thông báo')}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Chưa có thông báo nào"
          description="Tạo và gửi thông báo đầu tiên đến khách hàng hoặc nhà bán."
          icon="inbox"
        />
      ) : (
        <DataTable columns={columns} data={notifications} keyExtractor={(row) => String(row.id)} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Gửi thông báo" size="md">
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Thông báo sẽ được gửi ngay vào hộp thư của đối tượng đã chọn.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tiêu đề</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Loại</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as BroadcastSeverity })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {BROADCAST_SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Đối tượng</label>
              <select
                value={formData.audience}
                onChange={(e) => {
                  const audience = e.target.value as BroadcastAudience;
                  setFormData({ ...formData, audience });
                  if (audience !== 'USER') {
                    resetRecipientPicker();
                  }
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {BROADCAST_AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.audience === 'USER' && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Người nhận</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientKind('CUSTOMER');
                    setSelectedRecipient(null);
                    setRecipientSearch('');
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    recipientKind === 'CUSTOMER'
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientKind('VENDOR');
                    setSelectedRecipient(null);
                    setRecipientSearch('');
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    recipientKind === 'VENDOR'
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Nhà bán
                </button>
              </div>

              {selectedRecipient ? (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedRecipient.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedRecipient.kind === 'CUSTOMER' ? 'Khách hàng' : 'Nhà bán'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipient(null)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    title="Đổi người nhận"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder={
                        recipientKind === 'CUSTOMER'
                          ? 'Tìm khách hàng theo tên, email, username…'
                          : 'Tìm nhà bán theo shop, email, username…'
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    {searching ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Đang tìm…</p>
                    ) : recipientOptions.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Không tìm thấy người dùng phù hợp.</p>
                    ) : (
                      recipientOptions.map((opt) => (
                        <button
                          key={opt.keycloakId}
                          type="button"
                          onClick={() =>
                            setSelectedRecipient({
                              keycloakId: opt.keycloakId,
                              label: opt.label,
                              kind: opt.kind,
                            })
                          }
                          className="flex w-full flex-col items-start border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{opt.sub}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleCreate}
              disabled={!canSubmit}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {create.isPending ? 'Đang gửi…' : 'Gửi ngay'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!sendTarget} onClose={() => setSendTarget(null)} title="Gửi thông báo" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gửi <strong>{sendTarget?.title}</strong> đến{' '}
            <strong>{sendTarget ? audienceDisplay(sendTarget) : ''}</strong>?
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setSendTarget(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleSend}
              disabled={send.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {send.isPending ? 'Đang gửi…' : 'Gửi ngay'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa thông báo" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Xóa <strong>{deleteTarget?.title}</strong>?
            {deleteTarget?.status === 'SENT' && ' Thông báo đã gửi sẽ bị thu hồi khỏi hộp thư người nhận.'}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={remove.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {remove.isPending ? 'Đang xóa…' : 'Xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
