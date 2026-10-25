import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2,
  Package,
  CreditCard,
  Truck,
  MessageCircle,
  AlertTriangle,
  Info,
  CheckCheck,
} from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { PageTitle } from '../../components/ui/PageTitle';
import { formatRelativeTime } from '../../utils/format';
import type { PersonalNotificationType } from '../../types/notification';

const TYPE_LABELS: Record<PersonalNotificationType, string> = {
  ORDER: 'Đơn hàng',
  PAYMENT: 'Thanh toán',
  SHIPMENT: 'Vận chuyển',
  CHAT: 'Tin nhắn',
  REPORT: 'Báo cáo',
  SYSTEM: 'Hệ thống',
};

const TYPE_COLORS: Record<PersonalNotificationType, string> = {
  ORDER: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  PAYMENT: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300',
  SHIPMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  CHAT: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300',
  REPORT: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300',
  SYSTEM: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const TYPE_ICONS: Record<PersonalNotificationType, React.ReactNode> = {
  ORDER: <Package className="h-5 w-5 text-primary-500" />,
  PAYMENT: <CreditCard className="h-5 w-5 text-success-500" />,
  SHIPMENT: <Truck className="h-5 w-5 text-blue-500" />,
  CHAT: <MessageCircle className="h-5 w-5 text-warning-500" />,
  REPORT: <AlertTriangle className="h-5 w-5 text-error-500" />,
  SYSTEM: <Info className="h-5 w-5 text-gray-500" />,
};

const TAB_TYPES: Array<{ id: string; label: string; types?: PersonalNotificationType[] }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'ORDER', label: 'Đơn hàng', types: ['ORDER'] },
  { id: 'PAYMENT', label: 'Thanh toán', types: ['PAYMENT'] },
  { id: 'SHIPMENT', label: 'Vận chuyển', types: ['SHIPMENT'] },
  { id: 'CHAT', label: 'Tin nhắn', types: ['CHAT'] },
  { id: 'REPORT', label: 'Báo cáo', types: ['REPORT'] },
  { id: 'SYSTEM', label: 'Hệ thống', types: ['SYSTEM'] },
];

export function NotificationInboxPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const tabs = TAB_TYPES.map((tab) => ({
    ...tab,
    count:
      tab.id === 'all'
        ? notifications.length
        : notifications.filter((n) => tab.types?.includes(n.type)).length,
  }));

  const activeTypes = TAB_TYPES.find((t) => t.id === activeTab)?.types;
  const filtered = activeTab === 'all' ? notifications : notifications.filter((n) => activeTypes?.includes(n.type));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = async (id: string, link: string, read: boolean) => {
    if (!read) {
      try {
        await markAsRead(id);
      } catch {
        return;
      }
    }
    if (link) navigate(link);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle title="Thông báo" subtitle="Cập nhật đơn hàng, thanh toán, báo cáo và tin nhắn của bạn">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="btn btn-outline btn-sm"
          >
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </PageTitle>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {isLoading ? (
          <div className="p-4">
            <SkeletonLoader type="text" count={5} className="mb-3 h-16" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="Không có thông báo"
            description={
              activeTab === 'all'
                ? 'Thông báo mới sẽ xuất hiện tại đây'
                : `Không có thông báo loại ${TAB_TYPES.find((t) => t.id === activeTab)?.label ?? ''}`
            }
          />
        ) : (
          filtered.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                !notification.read ? 'border-l-4 border-l-primary-500 bg-primary-50/30 dark:bg-primary-950/10' : ''
              }`}
            >
              <div className="mt-1 shrink-0">{TYPE_ICONS[notification.type]}</div>
              <button
                type="button"
                onClick={() => void handleOpen(notification.id, notification.link, notification.read)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[notification.type]}`}>
                    {TYPE_LABELS[notification.type]}
                  </span>
                  {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                </div>
                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                <p className="mt-2 text-xs text-gray-400">{formatRelativeTime(notification.createdAt)}</p>
              </button>
              <button
                type="button"
                onClick={(e) => void handleDelete(notification.id, e)}
                disabled={deletingId === notification.id}
                className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-950"
                aria-label="Xóa thông báo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
