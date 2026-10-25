import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, Ban, CheckCircle, Trash2, MapPin } from 'lucide-react';
import {
  useCustomer,
  useCustomerAddresses,
  useUpdateCustomerStatus,
  useDeleteCustomer,
} from '../../hooks/useCustomers';
import { toUiStatus } from '../../services/customer/mappers';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';

export function UserDetailsPage() {
  const { id: userId = '' } = useParams();
  const navigate = useNavigate();
  const [suspendModal, setSuspendModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: customer, isLoading, error: queryError } = useCustomer(userId);
  const { data: addresses = [] } = useCustomerAddresses(userId);
  const statusMutation = useUpdateCustomerStatus();
  const deleteMutation = useDeleteCustomer();

  const displayError = error ?? (queryError ? extractApiError(queryError, 'Không thể tải thông tin khách hàng') : null);
  const uiStatus = customer ? toUiStatus(customer.status) : '';

  const handleSuspend = async () => {
    if (!customer) return;
    setError(null);
    try {
      await statusMutation.mutateAsync({
        id: customer.id,
        status: 'SUSPENDED',
        reason: suspendReason || undefined,
      });
      setSuspendModal(false);
      setSuspendReason('');
    } catch (err) {
      setError(extractApiError(err, 'Không thể đình chỉ khách hàng'));
    }
  };

  const handleActivate = async () => {
    if (!customer) return;
    setError(null);
    try {
      await statusMutation.mutateAsync({ id: customer.id, status: 'ACTIVE' });
    } catch (err) {
      setError(extractApiError(err, 'Không thể kích hoạt khách hàng'));
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(customer.id);
      setDeleteModal(false);
      navigate('/users');
    } catch (err) {
      setError(extractApiError(err, 'Không thể xóa khách hàng'));
    }
  };

  if (!userId) {
    navigate('/users');
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {displayError ?? 'Không tìm thấy khách hàng'}
      </div>
    );
  }

  const fullName = `${customer.lastName} ${customer.firstName}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chi tiết khách hàng</h1>
      </div>

      {displayError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {displayError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col items-center text-center">
            {customer.profileImageUrl ? (
              <img
                src={customer.profileImageUrl}
                alt={fullName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
                {fullName.charAt(0)}
              </div>
            )}
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">{fullName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{customer.username}</p>
            <div className="mt-3">
              <StatusBadge status={uiStatus} />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{customer.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{customer.phone ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Tham gia {formatDate(customer.createdAt)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {uiStatus !== 'suspended' && uiStatus !== 'deleted' && (
              <button
                onClick={() => setSuspendModal(true)}
                disabled={statusMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <Ban className="h-4 w-4" />
                Đình chỉ khách hàng
              </button>
            )}
            {(uiStatus === 'suspended' || uiStatus === 'inactive') && (
              <button
                onClick={handleActivate}
                disabled={statusMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
              >
                <CheckCircle className="h-4 w-4" />
                {statusMutation.isPending ? 'Đang kích hoạt...' : 'Kích hoạt khách hàng'}
              </button>
            )}
            {uiStatus !== 'deleted' && (
              <button
                onClick={() => setDeleteModal(true)}
                disabled={deleteMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Trash2 className="h-4 w-4" />
                Xóa khách hàng
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Thông tin tài khoản</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mã khách hàng</label>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{customer.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mã Keycloak</label>
                <p className="mt-1 break-all text-sm font-medium text-gray-900 dark:text-gray-100">{customer.keycloakId}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tên đăng nhập</label>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{customer.username}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái tài khoản</label>
                <div className="mt-1"><StatusBadge status={uiStatus} /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tên</label>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{customer.firstName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Họ</label>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{customer.lastName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Cập nhật lần cuối</label>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{formatDateTime(customer.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Địa chỉ</h3>
            {addresses.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chưa có địa chỉ nào.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {address.street}, {address.city}, {address.country}
                      </p>
                      {address.isDefault && (
                        <span className="mt-1 inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-950/50 dark:text-primary-400">
                          Mặc định
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={suspendModal} onClose={() => setSuspendModal(false)} title="Đình chỉ khách hàng" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn đình chỉ <strong>{fullName}</strong>?
          </p>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Lý do đình chỉ (tùy chọn)..."
            className="h-24 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setSuspendModal(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleSuspend}
              disabled={statusMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {statusMutation.isPending ? 'Đang đình chỉ...' : 'Đình chỉ'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Xóa khách hàng" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Xóa mềm <strong>{fullName}</strong>? Tài khoản sẽ được đánh dấu là đã xóa và không thể hoàn tác từ bảng quản trị.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteModal(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
