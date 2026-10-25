import { useEffect, useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { Plus, Pencil, Trash2 } from 'lucide-react';

import { authService } from '../../services/authService';
import { adminUserService } from '../../services/adminUserService';
import { tokenStorage } from '../../utils/tokenStorage';

import type { AdminUserCreateRequest, AdminUserResponse } from '../../types';

import { extractApiError } from '../../utils/apiError';

import { DataTable } from '../../components/ui/DataTable';

import { SearchBar } from '../../components/ui/SearchBar';

import { FilterPanel } from '../../components/ui/FilterPanel';

import { Pagination } from '../../components/ui/Pagination';

import { StatusBadge } from '../../components/ui/StatusBadge';

import { Modal } from '../../components/ui/Modal';

import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

import { EmptyState } from '../../components/ui/EmptyState';

import { PageTitle } from '../../components/ui/PageTitle';

import { formatDateTime } from '../../utils/format';



const emptyCreateForm: AdminUserCreateRequest = {

  username: '',

  email: '',

  firstName: '',

  lastName: '',

  phoneNumber: '',

  password: '',

};



const fieldLabels: Record<keyof AdminUserCreateRequest, string> = {

  username: 'Tên đăng nhập',

  email: 'Email',

  firstName: 'Tên',

  lastName: 'Họ',

  phoneNumber: 'Số điện thoại',

  password: 'Mật khẩu',

};

const createFormFields: {
  field: keyof AdminUserCreateRequest;
  type: string;
  autoComplete: string;
  name: string;
  placeholder?: string;
}[] = [
  { field: 'username', type: 'text', autoComplete: 'off', name: 'admin-new-username' },
  { field: 'email', type: 'email', autoComplete: 'off', name: 'admin-new-email' },
  { field: 'firstName', type: 'text', autoComplete: 'off', name: 'admin-new-first-name' },
  { field: 'lastName', type: 'text', autoComplete: 'off', name: 'admin-new-last-name' },
  { field: 'phoneNumber', type: 'tel', autoComplete: 'off', name: 'admin-new-phone', placeholder: 'VD: 0901234567 (để trống nếu không có)' },
  { field: 'password', type: 'password', autoComplete: 'new-password', name: 'admin-new-password' },
];



export function AdminUserListPage() {

  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUserResponse[]>([]);

  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [filters, setFilters] = useState<Record<string, string>>({});

  const [createOpen, setCreateOpen] = useState(false);

  const [createForm, setCreateForm] = useState<AdminUserCreateRequest>(emptyCreateForm);

  const [deleteTarget, setDeleteTarget] = useState<AdminUserResponse | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);



  const fetchUsers = async (page = 1) => {

    setIsLoading(true);

    setPageError(null);

    try {

      const result = await adminUserService.list({

        page,

        size: 10,

        search: searchQuery || undefined,

        status: filters.status as AdminUserResponse['status'] | undefined,

      });

      setUsers(result.data);

      setPagination({ page: result.page, totalPages: result.totalPages, total: result.total });

    } catch (err) {

      setPageError(extractApiError(err, 'Không thể tải danh sách quản trị viên'));

    } finally {

      setIsLoading(false);

    }

  };



  useEffect(() => {

    fetchUsers(1);

  }, [searchQuery, filters]);



  const handleCreate = async () => {

    setIsSubmitting(true);

    setCreateError(null);

    try {

      if (tokenStorage.getAccessToken() && tokenStorage.isAccessTokenExpired()) {
        try {
          await authService.refreshToken();
        } catch {
          setCreateError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }
      }

      await adminUserService.create(createForm);

      setCreateOpen(false);

      setCreateForm(emptyCreateForm);

      setCreateError(null);

      fetchUsers(pagination.page);

    } catch (err) {

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setCreateError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        const message = extractApiError(err, 'Không thể tạo quản trị viên');
        if (message === 'Session expired') {
          setCreateError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          setCreateError(message);
        }
      }

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleDelete = async () => {

    if (!deleteTarget) return;

    setIsSubmitting(true);

    setDeleteError(null);

    try {

      await adminUserService.delete(deleteTarget.id);

      setDeleteTarget(null);

      fetchUsers(pagination.page);

    } catch (err) {

      setDeleteError(extractApiError(err, 'Không thể xóa quản trị viên'));

    } finally {

      setIsSubmitting(false);

    }

  };



  const filterOptions = [

    {

      key: 'status',

      label: 'Trạng thái',

      type: 'select' as const,

      options: [

        { value: 'ACTIVE', label: 'Đang hoạt động' },

        { value: 'INACTIVE', label: 'Không hoạt động' },

        { value: 'SUSPENDED', label: 'Đình chỉ' },

      ],

    },

  ];



  const columns = [

    {

      key: 'name',

      header: 'Quản trị viên',

      render: (row: AdminUserResponse) => (

        <div>

          <p className="font-medium text-gray-900 dark:text-gray-100">

            {row.lastName} {row.firstName}

          </p>

          <p className="text-xs text-gray-500">@{row.username}</p>

        </div>

      ),

    },

    { key: 'email', header: 'Email' },

    { key: 'status', header: 'Trạng thái', render: (row: AdminUserResponse) => <StatusBadge status={row.status.toLowerCase()} /> },

    { key: 'createdAt', header: 'Ngày tạo', render: (row: AdminUserResponse) => formatDateTime(row.createdAt) },

    {

      key: 'actions',

      header: '',

      render: (row: AdminUserResponse) => (

        <div className="flex items-center gap-2">

          <button

            onClick={(e) => {

              e.stopPropagation();

              navigate(`/security/admin-users/${row.id}`);

            }}

            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"

          >

            <Pencil className="h-4 w-4" />

          </button>

          <button

            onClick={(e) => {

              e.stopPropagation();

              setDeleteTarget(row);
              setDeleteError(null);

            }}

            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"

          >

            <Trash2 className="h-4 w-4" />

          </button>

        </div>

      ),

    },

  ];



  return (

    <div className="space-y-4">

      <PageTitle title="Quản trị viên">

        <button

          onClick={() => {
            setCreateForm(emptyCreateForm);
            setCreateError(null);
            setCreateOpen(true);
          }}

          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"

        >

          <Plus className="h-4 w-4" />

          Tạo quản trị viên

        </button>

      </PageTitle>



      {pageError && (

        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">

          {pageError}

        </div>

      )}



      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        <SearchBar placeholder="Tìm theo tên đăng nhập hoặc email..." onSearch={setSearchQuery} className="flex-1" />

        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />

      </div>



      {isLoading ? (

        <SkeletonLoader type="table" />

      ) : users.length === 0 ? (

        <EmptyState title="Không tìm thấy quản trị viên" description="Tạo quản trị viên mới để bắt đầu." icon="inbox" />

      ) : (

        <>

          <DataTable columns={columns} data={users} keyExtractor={(row) => String(row.id)} />

          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchUsers} />

        </>

      )}



      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
        }}
        title="Tạo quản trị viên"
        size="lg"
      >

        <form
          autoComplete="off"
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          {createError && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {createError}
            </div>
          )}

          <div aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
            <input tabIndex={-1} type="text" name="prevent_autofill" autoComplete="off" defaultValue="" readOnly />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">

            {createFormFields.map(({ field, type, autoComplete, name, placeholder }) => (

              <input

                key={field}

                type={type}

                name={name}

                autoComplete={autoComplete}

                value={createForm[field] ?? ''}

                onChange={(e) => setCreateForm((p) => ({ ...p, [field]: e.target.value }))}

                placeholder={placeholder ?? fieldLabels[field]}

                className="h-11 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"

                required={field !== 'phoneNumber'}

              />

            ))}

          </div>

          <div className="mt-4 flex justify-end gap-2">

            <button type="button" onClick={() => { setCreateOpen(false); setCreateError(null); }} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-600">

              Hủy

            </button>

            <button

              type="submit"

              disabled={isSubmitting}

              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"

            >

              {isSubmitting ? 'Đang tạo...' : 'Tạo mới'}

            </button>

          </div>
        </form>

      </Modal>



      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        title="Xóa quản trị viên"
        size="sm"
      >

        {deleteError && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {deleteError}
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400">

          Xóa <strong>{deleteTarget?.username}</strong>? Hành động này không thể hoàn tác.

        </p>

        <div className="mt-4 flex justify-end gap-2">

          <button onClick={() => setDeleteTarget(null)} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-600">

            Hủy

          </button>

          <button

            onClick={handleDelete}

            disabled={isSubmitting}

            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"

          >

            {isSubmitting ? 'Đang xóa...' : 'Xóa'}

          </button>

        </div>

      </Modal>

    </div>

  );

}

