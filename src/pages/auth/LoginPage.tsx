import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chào mừng trở lại</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Đăng nhập vào tài khoản quản trị</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <div>
          <label htmlFor="admin-login-username" className="label">
            Tên đăng nhập
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="admin-login-username"
              name="admin-login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input pl-10"
              placeholder="Nhập tên đăng nhập"
              autoComplete="off"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-login-password" className="label">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="admin-login-password"
              name="admin-login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="Nhập mật khẩu"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="link text-sm font-medium">
            Quên mật khẩu?
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoggingIn} className="btn btn-primary btn-lg w-full">
          {isLoggingIn ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Đang đăng nhập...
            </span>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Đăng nhập
            </>
          )}
        </button>
      </form>
    </div>
  );
}
