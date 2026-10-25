import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { NotificationCenter } from '../components/ui/NotificationCenter';

export function Header() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:px-6">
      <div className="hidden sm:block">
        <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý nền tảng</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <NotificationCenter />

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-medium text-primary-600 dark:bg-primary-900 dark:text-primary-400">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 md:block">
              {user?.name || 'Quản trị viên'}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 md:block" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="dropdown z-50">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={user?.name || 'Quản trị viên'}>
                    {user?.name || 'Quản trị viên'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={user?.email}>
                    {user?.email}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <User className="h-5 w-5" />
                    Tài khoản
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-950"
                  >
                    <LogOut className="h-5 w-5" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
