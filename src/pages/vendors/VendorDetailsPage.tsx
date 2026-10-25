import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Ban,
  CheckCircle,
  Trash2,
  User,
  CreditCard,
  BarChart3,
  Save,
  Truck,
} from 'lucide-react';
import {
  useVendor,
  useVendorBankAccount,
  useUpdateVendorStatus,
  useUpdateVendorInfo,
  useDeleteVendor,
  useVerifyBankAccount,
} from '../../hooks/useVendors';
import type { VendorUpdateRequest } from '../../types/vendor';
import { toUiVendorStatus } from '../../services/vendor/mappers';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { useVendorShipments } from '../../hooks/useShipments';
import { ShipmentTable } from '../../components/shipments/ShipmentTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

type Tab = 'profile' | 'bank' | 'shipments';

export function VendorDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [suspendModal, setSuspendModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState<VendorUpdateRequest>({});

  const { data: vendor, isLoading, error: queryError } = useVendor(id);
  const { data: bankAccount, isLoading: bankLoading } = useVendorBankAccount(vendor?.keycloakId, vendor?.shopName);
  const { data: vendorShipments = [], isLoading: shipmentsLoading, isError: shipmentsError, refetch: refetchShipments } =
    useVendorShipments(vendor?.keycloakId);
  const statusMutation = useUpdateVendorStatus();
  const updateMutation = useUpdateVendorInfo();
  const deleteMutation = useDeleteVendor();
  const verifyMutation = useVerifyBankAccount();

  useEffect(() => {
    if (!vendor) return;
    setForm({
      shopName: vendor.shopName,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      username: vendor.username,
      email: vendor.email,
      phone: vendor.phone ?? '',
    });
  }, [vendor]);

  const displayError = error ?? (queryError ? extractApiError(queryError, 'Không thể tải thông tin nhà bán hàng') : null);
  const uiStatus = vendor ? toUiVendorStatus(vendor.status) : '';

  const handleSuspend = async () => {
    if (!vendor) return;
    setError(null);
    try {
      await statusMutation.mutateAsync({ id: vendor.id, status: 'SUSPENDED' });
      setSuspendModal(false);
    } catch (err) {
      setError(extractApiError(err, 'Không thể đình chỉ nhà bán hàng'));
    }
  };

  const handleActivate = async () => {
    if (!vendor) return;
    setError(null);
    try {
      await statusMutation.mutateAsync({ id: vendor.id, status: 'ACTIVE' });
    } catch (err) {
      setError(extractApiError(err, 'Không thể kích hoạt nhà bán hàng'));
    }
  };

  const handleDelete = async () => {
    if (!vendor) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(vendor.id);
      setDeleteModal(false);
      navigate('/vendors');
    } catch (err) {
      setError(extractApiError(err, 'Không thể xóa nhà bán hàng'));
    }
  };

  const handleVerifyBank = async (isValid: boolean) => {
    if (!vendor) return;
    setError(null);
    try {
      await verifyMutation.mutateAsync({ vendorKeycloakId: vendor.keycloakId, isValid });
    } catch (err) {
      setError(extractApiError(err, isValid ? 'Không thể xác minh tài khoản ngân hàng' : 'Không thể từ chối tài khoản ngân hàng'));
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    setError(null);
    setSaveSuccess(false);
    try {
      await updateMutation.mutateAsync({ id: vendor.id, payload: form });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(extractApiError(err, 'Không thể cập nhật thông tin nhà bán hàng'));
    }
  };

  const inputClassName =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {displayError ?? 'Không tìm thấy nhà bán hàng'}
      </div>
    );
  }

  const fullName = `${vendor.lastName} ${vendor.firstName}`.trim();
  const canSuspend = vendor.status === 'ACTIVE';
  const canActivate = vendor.status === 'INACTIVE' || vendor.status === 'SUSPENDED';
  const canDelete = vendor.status !== 'DELETED';
  const canEdit = vendor.status !== 'DELETED';

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Hồ sơ', icon: User },
    { id: 'bank', label: 'Tài khoản ngân hàng', icon: CreditCard },
    { id: 'shipments', label: 'Vận đơn', icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/vendors')}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vendor.shopName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{fullName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/vendors/${id}/analytics`)}
            className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-400"
          >
            <BarChart3 className="h-4 w-4" />
            Phân tích
          </button>
          {canActivate && (
            <button
              onClick={handleActivate}
              disabled={statusMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
            >
              <CheckCircle className="h-4 w-4" />
              Kích hoạt
            </button>
          )}
          {canSuspend && (
            <button
              onClick={() => setSuspendModal(true)}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              <Ban className="h-4 w-4" />
              Đình chỉ
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setDeleteModal(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4" />
              Xóa
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Cập nhật thông tin nhà bán hàng thành công.
        </div>
      )}

      {displayError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {displayError}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tabId
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center text-center">
              {vendor.logoUrl ? (
                <img src={vendor.logoUrl} alt={vendor.shopName} className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {vendor.shopName.charAt(0)}
                </div>
              )}
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">{vendor.shopName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{fullName}</p>
              <div className="mt-3">
                <StatusBadge status={uiStatus} />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{vendor.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{vendor.phone ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Thông tin cửa hàng</h3>
              {canEdit && (
                <button
                  type="submit"
                  form="vendor-edit-form"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>

            <form id="vendor-edit-form" onSubmit={handleSaveInfo} className="mt-4 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Tên cửa hàng</label>
                  <input
                    type="text"
                    value={form.shopName ?? ''}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    disabled={!canEdit || updateMutation.isPending}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Số điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone ?? ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={!canEdit || updateMutation.isPending}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Tên</label>
                  <input
                    type="text"
                    value={form.firstName ?? ''}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    disabled={!canEdit || updateMutation.isPending}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Họ</label>
                  <input
                    type="text"
                    value={form.lastName ?? ''}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    disabled={!canEdit || updateMutation.isPending}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={form.username ?? ''}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    disabled={!canEdit || updateMutation.isPending}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <input
                    type="email"
                    value={form.email ?? ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={!canEdit || updateMutation.isPending}
                    required
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Thông tin hệ thống (chỉ đọc)
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mã nhà bán hàng</label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{vendor.id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mã Keycloak</label>
                    <p className="mt-1 break-all text-sm font-medium text-gray-900 dark:text-gray-100">
                      {vendor.keycloakId}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Ngày tham gia</label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(vendor.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Cập nhật lần cuối</label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDateTime(vendor.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tài khoản ngân hàng</h3>
          {bankLoading ? (
            <div className="mt-4 h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
          ) : !bankAccount ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Nhà bán hàng này chưa có tài khoản ngân hàng.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Tên ngân hàng</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{bankAccount.bankName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Số tài khoản</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{bankAccount.accountNumber}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Tên chủ tài khoản</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{bankAccount.accountName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Trạng thái xác minh</label>
                  <div className="mt-1">
                    <StatusBadge status={bankAccount.verificationStatus.toLowerCase()} />
                  </div>
                </div>
              </div>
              {bankAccount.verificationStatus === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyBank(true)}
                    disabled={verifyMutation.isPending}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Xác minh
                  </button>
                  <button
                    onClick={() => handleVerifyBank(false)}
                    disabled={verifyMutation.isPending}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shipments' && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vận đơn của nhà bán</h3>
          {shipmentsLoading ? (
            <div className="mt-4">
              <SkeletonLoader type="table" />
            </div>
          ) : shipmentsError ? (
            <EmptyState
              icon="alert"
              title="Không tải được vận đơn"
              description="Không lấy được danh sách vận đơn của nhà bán này."
              action={
                <button
                  type="button"
                  onClick={() => void refetchShipments()}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Thử lại
                </button>
              }
            />
          ) : vendorShipments.length === 0 ? (
            <EmptyState
              icon="package"
              title="Chưa có vận đơn"
              description="Nhà bán này chưa có vận đơn nào trên hệ thống."
            />
          ) : (
            <div className="mt-4">
              <ShipmentTable shipments={vendorShipments} />
            </div>
          )}
        </div>
      )}

      <Modal isOpen={suspendModal} onClose={() => setSuspendModal(false)} title="Đình chỉ nhà bán hàng" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn đình chỉ <strong>{vendor.shopName}</strong>?
          </p>
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
              Đình chỉ
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Xóa nhà bán hàng" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn xóa <strong>{vendor.shopName}</strong>? Thao tác này sẽ xóa mềm tài khoản nhà bán hàng.
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
              Xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
