import { Bell, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import { formatRelativeTime } from '../../utils/format';
import { cn } from '../../utils/cn';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotificationStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      void fetchNotifications();
    }
  };

  const handleOpenNotification = async (id: string, link: string, read: boolean) => {
    if (!read) {
      try {
        await markAsRead(id);
      } catch {
        return;
      }
    }
    if (link) navigate(link);
    setIsOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    void deleteNotification(id);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggleOpen}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="dropdown w-80 sm:w-96 z-50">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  className="text-xs text-primary-500 hover:text-primary-600"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Không có thông báo
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-1 border-b border-gray-100 last:border-b-0 dark:border-gray-800',
                      !notification.read && 'bg-primary-50/50 dark:bg-primary-950/20'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void handleOpenNotification(notification.id, notification.link, notification.read)}
                      className="min-w-0 flex-1 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{notification.message}</p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatRelativeTime(notification.createdAt)}</p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="m-2 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-950"
                      aria-label="Xóa thông báo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-primary-500 hover:text-primary-600"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
