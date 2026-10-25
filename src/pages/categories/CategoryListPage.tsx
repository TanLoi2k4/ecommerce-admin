import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { useCategories, useCategoryMutations } from '../../hooks/useCategories';
import type { CategoryListItem, CategoryRequest } from '../../types/category';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageTitle } from '../../components/ui/PageTitle';
import { extractApiError } from '../../utils/apiError';

const emptyForm = (): CategoryRequest & { active: boolean; virtualTryOn: boolean } => ({
  name: '',
  slug: '',
  description: '',
  active: true,
  virtualTryOn: false,
});

export function CategoryListPage() {
  const { data: categories = [], isLoading, error: queryError } = useCategories();
  const { create, update, remove } = useCategoryMutations();
  const [editModal, setEditModal] = useState<{ open: boolean; category: CategoryListItem | null }>({
    open: false,
    category: null,
  });
  const [createModal, setCreateModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; category: CategoryListItem | null }>({
    open: false,
    category: null,
  });
  const [error, setError] = useState<string | null>(null);

  const listError = error ?? (queryError ? extractApiError(queryError, 'Không thể tải danh sách danh mục') : null);

  const handleCreate = async () => {
    setError(null);
    try {
      await create.mutateAsync({
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        active: formData.active,
        virtualTryOn: formData.virtualTryOn,
      });
      setCreateModal(false);
      setFormData(emptyForm());
    } catch (err) {
      setError(extractApiError(err, 'Không thể tạo danh mục'));
    }
  };

  const handleUpdate = async () => {
    if (!editModal.category) return;
    setError(null);
    try {
      await update.mutateAsync({
        id: Number(editModal.category.id),
        payload: {
          name: formData.name,
          slug: formData.slug || undefined,
          description: formData.description || undefined,
          active: formData.active,
          virtualTryOn: formData.virtualTryOn,
        },
      });
      setEditModal({ open: false, category: null });
      setFormData(emptyForm());
    } catch (err) {
      setError(extractApiError(err, 'Không thể cập nhật danh mục'));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.category) return;
    setError(null);
    try {
      await remove.mutateAsync(Number(deleteModal.category.id));
      setDeleteModal({ open: false, category: null });
    } catch (err) {
      setError(extractApiError(err, 'Không thể vô hiệu hóa danh mục'));
    }
  };

  const openEdit = (category: CategoryListItem) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      virtualTryOn: category.virtualTryOn,
    });
    setEditModal({ open: true, category });
  };

  const columns = [
    {
      key: 'name',
      header: 'Danh mục',
      render: (row: CategoryListItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <FolderOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (row: CategoryListItem) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.description || '—'}</span>
      ),
    },
    {
      key: 'virtualTryOn',
      header: 'Thử đồ',
      render: (row: CategoryListItem) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.virtualTryOn ? 'Bật' : 'Tắt'}</span>
      ),
    },
    { key: 'status', header: 'Trạng thái', render: (row: CategoryListItem) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      render: (row: CategoryListItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ open: true, category: row })}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const formFields = (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Đường dẫn ngắn</label>
        <input
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="Tự động tạo nếu để trống"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="rounded border-gray-300"
        />
        Hoạt động
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={formData.virtualTryOn}
          onChange={(e) => setFormData({ ...formData, virtualTryOn: e.target.checked })}
          className="rounded border-gray-300"
        />
        Cho thử đồ ảo
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Bật với danh mục quần áo. Sản phẩm trong danh mục này chỉ thử được khi có ảnh phẳng.
      </p>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageTitle title="Danh mục" />
        <button
          onClick={() => {
            setFormData(emptyForm());
            setCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </button>
      </div>

      {listError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {listError}
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : categories.length === 0 ? (
        <EmptyState title="Chưa có danh mục" description="Tạo danh mục đầu tiên để bắt đầu." icon="package" />
      ) : (
        <DataTable columns={columns} data={categories} keyExtractor={(row) => row.id} />
      )}

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Thêm danh mục" size="md">
        <div className="space-y-4">
          {formFields}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCreateModal(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.name.trim() || create.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {create.isPending ? 'Đang tạo…' : 'Tạo mới'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, category: null })}
        title="Sửa danh mục"
        size="md"
      >
        <div className="space-y-4">
          {formFields}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditModal({ open: false, category: null })}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdate}
              disabled={!formData.name.trim() || update.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {update.isPending ? 'Đang lưu…' : 'Cập nhật'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, category: null })}
        title="Vô hiệu hóa danh mục"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vô hiệu hóa <strong>{deleteModal.category?.name}</strong>? Danh mục sẽ bị ẩn khỏi cửa hàng.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteModal({ open: false, category: null })}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={remove.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {remove.isPending ? 'Đang vô hiệu hóa…' : 'Vô hiệu hóa'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
