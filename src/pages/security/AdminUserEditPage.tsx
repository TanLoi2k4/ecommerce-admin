import { useEffect, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { adminUserService } from '../../services/adminUserService';

import type { AdminUserResponse, AdminUserUpdateAccountRequest, AdminUpdateProfileRequest } from '../../types';

import { extractApiError } from '../../utils/apiError';

import { StatusBadge } from '../../components/ui/StatusBadge';

import { SkeletonLoader } from '../../components/ui/SkeletonLoader';



export function AdminUserEditPage() {

  const { id } = useParams<{ id: string }>();

  const [admin, setAdmin] = useState<AdminUserResponse | null>(null);

  const [profileForm, setProfileForm] = useState<AdminUpdateProfileRequest>({});

  const [accountForm, setAccountForm] = useState<AdminUserUpdateAccountRequest>({});

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);



  useEffect(() => {

    const load = async () => {

      if (!id) return;

      setIsLoading(true);

      try {

        const data = await adminUserService.getById(Number(id));

        setAdmin(data);

        setProfileForm({

          firstName: data.firstName,

          lastName: data.lastName,

          phoneNumber: data.phoneNumber,

        });

        setAccountForm({

          email: data.email,

          status: data.status,

        });

      } catch (err) {

        setError(extractApiError(err, 'Không thể tải quản trị viên'));

      } finally {

        setIsLoading(false);

      }

    };

    load();

  }, [id]);



  const handleProfileSave = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!id) return;

    setIsSaving(true);

    setError(null);

    setMessage(null);

    try {

      const updated = await adminUserService.updateProfile(Number(id), profileForm);

      setAdmin(updated);

      setMessage('Cập nhật hồ sơ thành công');

    } catch (err) {

      setError(extractApiError(err, 'Không thể cập nhật hồ sơ'));

    } finally {

      setIsSaving(false);

    }

  };



  const handleAccountSave = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!id) return;

    setIsSaving(true);

    setError(null);

    setMessage(null);

    try {

      const payload: AdminUserUpdateAccountRequest = { status: accountForm.status };

      if (accountForm.email) payload.email = accountForm.email;

      if (accountForm.password) payload.password = accountForm.password;

      const updated = await adminUserService.updateAccount(Number(id), payload);

      setAdmin(updated);

      setAccountForm((prev) => ({ ...prev, password: '' }));

      setMessage('Cập nhật tài khoản thành công');

    } catch (err) {

      setError(extractApiError(err, 'Không thể cập nhật tài khoản'));

    } finally {

      setIsSaving(false);

    }

  };



  if (isLoading) return <SkeletonLoader type="card" />;

  if (!admin) {

    return (

      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">

        {error || 'Không tìm thấy quản trị viên'}

      </div>

    );

  }



  return (

    <div className="mx-auto max-w-3xl space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sửa quản trị viên</h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">@{admin.username}</p>

        </div>

        <Link to="/security/admin-users" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">

          Quay lại danh sách

        </Link>

      </div>



      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">

        <StatusBadge status={admin.status.toLowerCase()} />

      </div>



      {message && (

        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">

          {message}

        </div>

      )}

      {error && (

        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">

          {error}

        </div>

      )}



      <form onSubmit={handleProfileSave} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">

        <h2 className="text-lg font-semibold">Hồ sơ</h2>

        <div className="grid gap-3 sm:grid-cols-2">

          <input

            value={profileForm.firstName ?? ''}

            onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}

            placeholder="Tên"

            className="h-11 rounded-lg border px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"

          />

          <input

            value={profileForm.lastName ?? ''}

            onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}

            placeholder="Họ"

            className="h-11 rounded-lg border px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"

          />

          <input

            value={profileForm.phoneNumber ?? ''}

            onChange={(e) => setProfileForm((p) => ({ ...p, phoneNumber: e.target.value }))}

            placeholder="Số điện thoại"

            className="h-11 rounded-lg border px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 sm:col-span-2"

          />

        </div>

        <button type="submit" disabled={isSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50">

          Lưu hồ sơ

        </button>

      </form>



      <form onSubmit={handleAccountSave} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">

        <h2 className="text-lg font-semibold">Tài khoản</h2>

        <input

          type="email"

          value={accountForm.email ?? ''}

          onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))}

          className="h-11 w-full rounded-lg border px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"

        />

        <input

          type="password"

          value={accountForm.password ?? ''}

          onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))}

          placeholder="Mật khẩu mới (tùy chọn)"

          className="h-11 w-full rounded-lg border px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"

        />

        <select

          value={accountForm.status ?? 'ACTIVE'}

          onChange={(e) => setAccountForm((p) => ({ ...p, status: e.target.value as AdminUserResponse['status'] }))}

          className="h-11 w-full rounded-lg border px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"

        >

          <option value="ACTIVE">Đang hoạt động</option>

          <option value="INACTIVE">Không hoạt động</option>

          <option value="SUSPENDED">Đình chỉ</option>

        </select>

        <button type="submit" disabled={isSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50">

          Lưu tài khoản

        </button>

      </form>

    </div>

  );

}

