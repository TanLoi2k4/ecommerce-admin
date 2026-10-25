import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Truck } from 'lucide-react';
import {
  useCarrierConfigs,
  useCreateCarrierConfig,
  useDeleteCarrierConfig,
  useUpdateCarrierConfig,
} from '../../hooks/useShipments';
import type { CarrierConfig, CarrierConfigRequest } from '../../types/shipment';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageTitle } from '../../components/ui/PageTitle';
import { extractApiError } from '../../utils/apiError';
import { formatCarrierLabel, KNOWN_CARRIER_CODES, maskApiKey } from '../../utils/shipmentLabels';

type FormState = {
  carrierCode: string;
  customCode: string;
  baseUrl: string;
  apiKey: string;
  active: boolean;
};

const emptyForm: FormState = {
  carrierCode: '',
  customCode: '',
  baseUrl: '',
  apiKey: '',
  active: true,
};

function toRequest(form: FormState): CarrierConfigRequest {
  const code =
    form.carrierCode === 'OTHER' ? form.customCode.trim().toUpperCase() : form.carrierCode;
  return {
    carrierCode: code,
    baseUrl: form.baseUrl.trim(),
    apiKey: form.apiKey.trim() || undefined,
    active: form.active,
  };
}

function configToForm(config: CarrierConfig): FormState {
  const known = KNOWN_CARRIER_CODES.includes(config.carrierCode as (typeof KNOWN_CARRIER_CODES)[number]);
  return {
    carrierCode: known ? config.carrierCode : 'OTHER',
    customCode: known ? '' : config.carrierCode,
    baseUrl: config.baseUrl ?? '',
    apiKey: '',
    active: config.active,
  };
}

export function CarrierConfigPage() {
  const { data: configs = [], isLoading, isError, error, refetch } = useCarrierConfigs();
  const createMutation = useCreateCarrierConfig();
  const updateMutation = useUpdateCarrierConfig();
  const deleteMutation = useDeleteCarrierConfig();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CarrierConfig | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CarrierConfig | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const usedCodes = useMemo(
    () => new Set(configs.map((config) => config.carrierCode.toUpperCase())),
    [configs],
  );

  const selectableKnownCodes = useMemo(
    () =>
      KNOWN_CARRIER_CODES.filter(
        (code) => (editing && editing.carrierCode === code) || !usedCodes.has(code),
      ),
    [editing, usedCodes],
  );

  const columns = useMemo(
    () => [
      {
        key: 'carrier',
        header: 'Đơn vị vận chuyển',
        render: (row: CarrierConfig) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatCarrierLabel(row.carrierCode)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{row.carrierCode}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'baseUrl',
        header: 'Base URL',
        render: (row: CarrierConfig) => (
          <span className="break-all text-sm text-gray-700 dark:text-gray-300">{row.baseUrl}</span>
        ),
      },
      {
        key: 'apiKey',
        header: 'API key',
        render: (row: CarrierConfig) => (
          <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">
            {maskApiKey(row.apiKey)}
          </code>
        ),
      },
      {
        key: 'active',
        header: 'Trạng thái',
        render: (row: CarrierConfig) => <StatusBadge status={row.active ? 'active' : 'inactive'} />,
      },
      {
        key: 'actions',
        header: '',
        render: (row: CarrierConfig) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(row);
                setForm(configToForm(row));
                setFormError(null);
                setModalOpen(true);
              }}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteError(null);
                setDeleteTarget(row);
              }}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const request = toRequest(form);
    if (!request.carrierCode) {
      setFormError('Vui lòng chọn đơn vị vận chuyển');
      return;
    }
    if (!request.baseUrl) {
      setFormError('Vui lòng nhập base URL');
      return;
    }
    if (!editing && !request.apiKey) {
      setFormError('Vui lòng nhập API key');
      return;
    }
    setFormError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, request });
      } else {
        await createMutation.mutateAsync(request);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(extractApiError(err, editing ? 'Không thể cập nhật cấu hình' : 'Không thể tạo cấu hình'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractApiError(err, 'Không thể xóa cấu hình'));
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Cấu hình đơn vị vận chuyển"
        subtitle="Quản lý Viettel Post và các đơn vị vận chuyển khác."
      >
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> Thêm đơn vị
        </button>
      </PageTitle>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : isError ? (
        <EmptyState
          icon="alert"
          title="Không tải được cấu hình vận chuyển"
          description={extractApiError(error, 'Vui lòng thử lại')}
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Thử lại
            </button>
          }
        />
      ) : configs.length === 0 ? (
        <EmptyState
          icon="package"
          title="Chưa có đơn vị vận chuyển"
          description="Thêm Viettel Post hoặc đơn vị khác để hệ thống đặt vận đơn."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Thêm đơn vị
            </button>
          }
        />
      ) : (
        <DataTable columns={columns} data={configs} keyExtractor={(row) => String(row.id)} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !isSaving && setModalOpen(false)}
        title={editing ? 'Sửa đơn vị vận chuyển' : 'Thêm đơn vị vận chuyển'}
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {formError}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Đơn vị
            </label>
            <select
              value={form.carrierCode}
              onChange={(e) => setForm({ ...form, carrierCode: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Chọn đơn vị</option>
              {selectableKnownCodes.map((code) => (
                <option key={code} value={code}>
                  {formatCarrierLabel(code)}
                </option>
              ))}
              <option value="OTHER">Khác</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Đây là loại đơn vị có thể thêm. Đơn vị chỉ xuất hiện trên hệ thống sau khi bạn tạo mới.
            </p>
          </div>

          {form.carrierCode === 'OTHER' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mã đơn vị
              </label>
              <input
                value={form.customCode}
                onChange={(e) => setForm({ ...form, customCode: e.target.value.toUpperCase() })}
                placeholder="VD: NINJA_VAN"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Base URL
            </label>
            <input
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              placeholder="https://api.viettelpost.vn"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              API key {editing ? '(để trống nếu giữ nguyên)' : ''}
            </label>
            <input
              type="password"
              name="carrier-api-key"
              autoComplete="new-password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder={editing ? '••••••••' : 'Nhập API key'}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Đang hoạt động
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSubmit()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        title="Xóa đơn vị vận chuyển"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc muốn xóa <strong>{formatCarrierLabel(deleteTarget?.carrierCode)}</strong>? Hệ
            thống sẽ không còn dùng đơn vị này để đặt vận đơn.
          </p>
          {deleteError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDelete()}
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
