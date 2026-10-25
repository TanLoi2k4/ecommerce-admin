import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react';
import {
  useCreateDiscount,
  useDeleteDiscount,
  useDiscounts,
  useUpdateDiscount,
} from '../../hooks/useDiscounts';
import {
  getDiscountStatus,
  instantToLocalInput,
  localInputToInstant,
} from '../../services/discountService';
import type { Discount, DiscountRequest, DiscountType } from '../../types/discount';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { PageTitle } from '../../components/ui/PageTitle';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';

type FormState = {
  code: string;
  description: string;
  type: DiscountType;
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  startDate: string;
  endDate: string;
};

const emptyForm: FormState = {
  code: '',
  description: '',
  type: 'PERCENTAGE',
  discountValue: '',
  minOrderValue: '0',
  maxDiscount: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
};

function discountToForm(discount: Discount): FormState {
  return {
    code: discount.code ?? '',
    description: discount.description ?? '',
    type: discount.type,
    discountValue: String(discount.discountValue ?? ''),
    minOrderValue: String(discount.minOrderValue ?? 0),
    maxDiscount: discount.maxDiscount != null ? String(discount.maxDiscount) : '',
    usageLimit: discount.usageLimit != null ? String(discount.usageLimit) : '',
    startDate: instantToLocalInput(discount.startDate),
    endDate: instantToLocalInput(discount.endDate),
  };
}

function formToRequest(form: FormState): DiscountRequest {
  const discountValue = Number(form.discountValue);
  const minOrderValue = form.minOrderValue === '' ? 0 : Number(form.minOrderValue);
  const maxDiscount =
    form.type === 'PERCENTAGE' && form.maxDiscount !== '' ? Number(form.maxDiscount) : null;
  const usageLimit = form.usageLimit !== '' ? Number(form.usageLimit) : null;

  return {
    code: form.code.trim().toUpperCase(),
    description: form.description.trim() || undefined,
    type: form.type,
    discountValue,
    minOrderValue: Number.isFinite(minOrderValue) ? minOrderValue : 0,
    maxDiscount: maxDiscount != null && Number.isFinite(maxDiscount) ? maxDiscount : null,
    usageLimit: usageLimit != null && Number.isFinite(usageLimit) ? usageLimit : null,
    startDate: localInputToInstant(form.startDate, false),
    endDate: localInputToInstant(form.endDate, true),
  };
}

function validateForm(form: FormState): string | null {
  if (!form.code.trim()) return 'Vui lòng nhập mã voucher';
  const value = Number(form.discountValue);
  if (!Number.isFinite(value) || value <= 0) return 'Giá trị giảm phải lớn hơn 0';
  if (form.type === 'PERCENTAGE' && value > 100) return 'Phần trăm giảm tối đa là 100';
  if (form.minOrderValue !== '' && Number(form.minOrderValue) < 0) {
    return 'Chi tiêu tối thiểu không được âm';
  }
  if (form.usageLimit !== '' && Number(form.usageLimit) < 0) {
    return 'Số lần dùng tối đa không được âm';
  }
  if (form.startDate && form.endDate) {
    const start = new Date(form.startDate).getTime();
    const end = new Date(form.endDate).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
      return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc';
    }
  }
  return null;
}

function typeLabel(type: DiscountType) {
  return type === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền cố định';
}

export function VoucherPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useDiscounts({ page, size: 20 });
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();
  const deleteMutation = useDeleteDiscount();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const vouchers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const columns = useMemo(
    () => [
      {
        key: 'code',
        header: 'Voucher',
        render: (row: Discount) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              <Ticket className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{row.code}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {typeLabel(row.type)}
                {row.description ? ` · ${row.description}` : ''}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'value',
        header: 'Giá trị',
        render: (row: Discount) =>
          row.type === 'PERCENTAGE'
            ? `${row.discountValue}%${row.maxDiscount != null ? ` (tối đa ${formatCurrency(row.maxDiscount)})` : ''}`
            : formatCurrency(row.discountValue),
      },
      {
        key: 'minOrderValue',
        header: 'Chi tiêu tối thiểu',
        render: (row: Discount) => formatCurrency(row.minOrderValue ?? 0),
      },
      {
        key: 'usedCount',
        header: 'Đã dùng',
        render: (row: Discount) =>
          `${row.usedCount ?? 0}${row.usageLimit != null ? `/${row.usageLimit}` : ''}`,
      },
      {
        key: 'period',
        header: 'Thời gian',
        render: (row: Discount) => (
          <div className="text-xs text-gray-600 dark:text-gray-300">
            <div>{formatDateTime(row.startDate)}</div>
            <div className="text-gray-400">→ {formatDateTime(row.endDate)}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (row: Discount) => <StatusBadge status={getDiscountStatus(row)} />,
      },
      {
        key: 'actions',
        header: '',
        render: (row: Discount) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
              aria-label="Sửa voucher"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteTarget(row);
              }}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              aria-label="Xóa voucher"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  function openCreate() {
    setEditing(null);
    setFormData(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(row: Discount) {
    setEditing(row);
    setFormData(discountToForm(row));
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit() {
    const validationError = validateForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const request = formToRequest(formData);
    setFormError(null);

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, request });
      } else {
        await createMutation.mutateAsync(request);
      }
      setModalOpen(false);
      setEditing(null);
      setFormData(emptyForm);
    } catch (err) {
      setFormError(extractApiError(err, editing ? 'Không thể cập nhật voucher' : 'Không thể tạo voucher'));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractApiError(err, 'Không thể xóa voucher'));
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Voucher nền tảng">
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> Tạo voucher
        </button>
      </PageTitle>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : isError ? (
        <EmptyState
          icon="alert"
          title="Không tải được danh sách voucher"
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
      ) : vouchers.length === 0 ? (
        <EmptyState
          title="Chưa có voucher"
          description="Tạo mã giảm giá đầu tiên để khách hàng áp dụng khi thanh toán."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Tạo voucher
            </button>
          }
        />
      ) : (
        <>
          <DataTable columns={columns} data={vouchers} keyExtractor={(row) => String(row.id)} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !isSaving && setModalOpen(false)}
        title={editing ? 'Sửa voucher' : 'Tạo voucher'}
        size="md"
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {formError}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mã</label>
            <input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="VD: SALE10"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả ngắn (tuỳ chọn)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Loại</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as DiscountType, maxDiscount: '' })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="PERCENTAGE">Phần trăm</option>
                <option value="FIXED_AMOUNT">Số tiền cố định</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Giá trị {formData.type === 'PERCENTAGE' ? '(%)' : '(VND)'}
              </label>
              <input
                type="number"
                min={0}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Chi tiêu tối thiểu
              </label>
              <input
                type="number"
                min={0}
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số lần dùng tối đa
              </label>
              <input
                type="number"
                min={0}
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="Để trống = không giới hạn"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {formData.type === 'PERCENTAGE' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Giảm tối đa (VND)
              </label>
              <input
                type="number"
                min={0}
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                placeholder="Tuỳ chọn — giới hạn số tiền giảm"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bắt đầu
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kết thúc
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

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
        title="Xóa voucher"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc muốn xóa mã <strong>{deleteTarget?.code}</strong>? Hành động này không thể hoàn tác.
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
