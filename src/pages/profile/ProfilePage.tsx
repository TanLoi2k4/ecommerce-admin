import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Mail, Phone, Lock, AtSign, Shield, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import type { AdminUpdateAccountRequest, AdminUpdateProfileRequest } from '../../types';
import { extractApiError } from '../../utils/apiError';
import { StatusBadge } from '../../components/ui/StatusBadge';

const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

type ProfileTab = 'profile' | 'security';

function Field({
  label,
  error,
  helper,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-error-500">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</p>}
    </div>
  );
}

export function ProfilePage() {
  const { user, checkAuth } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeView: ProfileTab =
    tabParam === 'security' ? 'security' : 'profile';

  useEffect(() => {
    if (!tabParam) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'profile');
      setSearchParams(next, { replace: true });
    }
  }, [tabParam, searchParams, setSearchParams]);

  const setActiveView = (tab: ProfileTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (tab !== 'profile') next.delete('edit');
    setSearchParams(next, { replace: true });
  };

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<AdminUpdateProfileRequest>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [accountForm, setAccountForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber ?? '',
      });
      setAccountForm((prev) => ({
        ...prev,
        username: user.username,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('edit') === '1' && activeView === 'profile' && user?.isSuperAdmin) {
      setIsEditing(true);
    }
  }, [searchParams, activeView, user?.isSuperAdmin]);

  const handleProfileSave = async () => {
    if (!user?.isSuperAdmin) {
      setProfileError('Chỉ Super Admin mới được cập nhật thông tin cá nhân');
      return;
    }

    if (profileForm.phoneNumber && !PHONE_REGEX.test(profileForm.phoneNumber)) {
      setProfileError('Số điện thoại phải gồm đúng 10 chữ số');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await authService.updateProfile(profileForm);
      await checkAuth({ silent: true });
      setIsEditing(false);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(extractApiError(err, 'Không thể cập nhật thông tin'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber ?? '',
      });
    }
    setProfileError(null);
    setIsEditing(false);
  };

  const validateAccountForm = () => {
    const errors: Record<string, string> = {};
    if (!accountForm.currentPassword) {
      errors.currentPassword = 'Mật khẩu hiện tại là bắt buộc';
    }
    if (accountForm.username && accountForm.username.length < 3) {
      errors.username = 'Tên đăng nhập tối thiểu 3 ký tự';
    }
    if (accountForm.newPassword) {
      if (!PASSWORD_REGEX.test(accountForm.newPassword)) {
        errors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự và chứa chữ cái cùng số';
      }
      if (accountForm.newPassword !== accountForm.confirmPassword) {
        errors.confirmPassword = 'Mật khẩu mới không khớp';
      }
    }
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAccountForm()) return;

    setIsSavingAccount(true);
    setAccountErrors({});
    setAccountSuccess(false);
    try {
      const payload: AdminUpdateAccountRequest = {
        currentPassword: accountForm.currentPassword,
      };
      if (accountForm.username && accountForm.username !== user?.username) {
        payload.username = accountForm.username.trim();
      }
      if (user?.isSuperAdmin && accountForm.email && accountForm.email !== user?.email) {
        payload.email = accountForm.email;
      }
      if (accountForm.newPassword) payload.password = accountForm.newPassword;

      const updated = await authService.updateAccount(payload);
      await checkAuth({ silent: true });
      setAccountForm((prev) => ({
        ...prev,
        username: updated.username,
        email: updated.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setAccountSuccess(true);
    } catch (err) {
      setAccountErrors({ form: extractApiError(err, 'Không thể cập nhật tài khoản') });
    } finally {
      setIsSavingAccount(false);
    }
  };

  if (!user) return null;

  const canEditPersonalInfo = Boolean(user.isSuperAdmin);
  const canEditEmail = Boolean(user.isSuperAdmin);
  const canEditProfile = canEditPersonalInfo && isEditing;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-600 text-3xl font-semibold text-white">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
            <p className="text-gray-500">@{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <StatusBadge status={user.status.toLowerCase()} />
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-400"
                >
                  {role}
                </span>
              ))}
            </div>
            {user.createdAt && (
              <p className="mt-1 text-sm text-gray-400">
                Thành viên từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['profile', 'security'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveView(tab)}
            className={`border-b-2 px-6 py-4 font-medium transition-colors ${
              activeView === tab
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'profile' ? 'Tài khoản' : 'Bảo mật'}
          </button>
        ))}
      </div>

      {activeView === 'profile' && (
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Thông tin cá nhân
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {canEditPersonalInfo
                  ? 'Quản lý họ tên và số điện thoại'
                  : 'Chỉ Super Admin mới được cập nhật thông tin cá nhân'}
              </p>
            </div>
            {canEditPersonalInfo &&
              (!isEditing ? (
                <button type="button" className="btn btn-outline" onClick={() => setIsEditing(true)}>
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isSavingProfile}
                    onClick={() => void handleProfileSave()}
                  >
                    {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              ))}
          </div>

          {profileSuccess && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
              Cập nhật thông tin thành công!
            </div>
          )}

          {profileError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {profileError}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Họ">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    disabled={!canEditProfile}
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="input pl-10 disabled:opacity-60"
                  />
                </div>
              </Field>
              <Field label="Tên">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    disabled={!canEditProfile}
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="input pl-10 disabled:opacity-60"
                  />
                </div>
              </Field>
            </div>
            <Field label="Tên đăng nhập" helper="Đổi tên đăng nhập ở tab Bảo mật">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input disabled value={user.username} className="input pl-10 opacity-60" />
              </div>
            </Field>
            <Field
              label="Email"
              helper={
                canEditEmail
                  ? 'Đổi email ở tab Bảo mật'
                  : 'Chỉ Super Admin mới được cập nhật email'
              }
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input disabled value={user.email} className="input pl-10 opacity-60" />
              </div>
            </Field>
            <Field label="Số điện thoại" helper={canEditPersonalInfo ? '10 chữ số' : undefined}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  disabled={!canEditProfile}
                  value={profileForm.phoneNumber}
                  onChange={(e) =>
                    setProfileForm((p) => ({
                      ...p,
                      phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                    }))
                  }
                  className="input pl-10 disabled:opacity-60"
                  placeholder="10 chữ số"
                />
              </div>
            </Field>
          </div>
        </div>
      )}

      {activeView === 'security' && (
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Bảo mật tài khoản
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {canEditEmail
                ? 'Cập nhật thông tin đăng nhập và mật khẩu'
                : 'Bạn chỉ có thể cập nhật tên đăng nhập và mật khẩu'}
            </p>
          </div>

          {accountSuccess && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
              Cập nhật tài khoản thành công!
            </div>
          )}

          {accountErrors.form && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {accountErrors.form}
            </div>
          )}

          <form onSubmit={handleAccountSave} className="space-y-4">
            <Field
              label="Tên đăng nhập mới"
              error={accountErrors.username}
              helper="Để trống nếu không muốn thay đổi"
            >
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={accountForm.username}
                  onChange={(e) => setAccountForm((p) => ({ ...p, username: e.target.value }))}
                  className="input pl-10"
                  minLength={3}
                />
              </div>
            </Field>
            {canEditEmail ? (
              <Field label="Email mới" helper="Để trống nếu không muốn thay đổi">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))}
                    className="input pl-10"
                  />
                </div>
              </Field>
            ) : (
              <Field label="Email" helper="Chỉ Super Admin mới được cập nhật email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input disabled value={user.email} className="input pl-10 opacity-60" />
                </div>
              </Field>
            )}

            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Đổi mật khẩu</p>

            <Field label="Mật khẩu hiện tại *" error={accountErrors.currentPassword}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={accountForm.currentPassword}
                  onChange={(e) =>
                    setAccountForm((p) => ({ ...p, currentPassword: e.target.value }))
                  }
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </Field>
            <Field
              label="Mật khẩu mới"
              error={accountErrors.newPassword}
              helper="Để trống nếu không đổi mật khẩu"
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={accountForm.newPassword}
                  onChange={(e) => setAccountForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="input pl-10"
                />
              </div>
            </Field>
            <Field label="Xác nhận mật khẩu mới" error={accountErrors.confirmPassword}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={accountForm.confirmPassword}
                  onChange={(e) =>
                    setAccountForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  className="input pl-10"
                />
              </div>
            </Field>

            <button type="submit" disabled={isSavingAccount} className="btn btn-primary mt-2">
              {isSavingAccount ? 'Đang lưu...' : 'Lưu thay đổi tài khoản'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
