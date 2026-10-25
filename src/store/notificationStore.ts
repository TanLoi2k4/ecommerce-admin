import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import { extractApiError } from '../utils/apiError';
import type { PersonalNotificationResponse } from '../types/notification';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: PersonalNotificationResponse['type'];
  read: boolean;
  createdAt: string;
  link: string;
}

function mapNotification(dto: PersonalNotificationResponse): Notification {
  return {
    id: String(dto.id),
    title: dto.title,
    message: dto.content,
    type: dto.type,
    // Jackson serializes boolean isRead as "read"
    read: Boolean(dto.isRead ?? dto.read ?? false),
    createdAt: dto.createdAt,
    link: dto.link ?? '',
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  pushRealtimeNotification: (dto: PersonalNotificationResponse) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const [page, unreadCount] = await Promise.all([
        notificationService.list(0, 20),
        notificationService.unreadCount().catch(() => null),
      ]);
      const notifications = (page?.content ?? []).map(mapNotification);
      set({
        notifications,
        unreadCount:
          unreadCount ?? notifications.filter((n) => !n.read).length,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: extractApiError(error, 'Không thể tải thông báo') });
    }
  },

  pushRealtimeNotification: (dto) => {
    const item = mapNotification(dto);
    const { notifications, unreadCount } = get();
    if (notifications.some((n) => n.id === item.id)) return;
    set({
      notifications: [item, ...notifications].slice(0, 50),
      unreadCount: item.read ? unreadCount : unreadCount + 1,
    });
  },

  markAsRead: async (id) => {
    const prev = get().notifications;
    const wasUnread = prev.find((n) => n.id === id && !n.read);
    const notifications = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    set({
      notifications,
      unreadCount: wasUnread ? Math.max(0, get().unreadCount - 1) : get().unreadCount,
    });
    try {
      await notificationService.markRead(Number(id));
    } catch {
      set({
        notifications: prev,
        unreadCount: wasUnread ? get().unreadCount + 1 : get().unreadCount,
      });
    }
  },

  markAllAsRead: async () => {
    const prev = get().notifications;
    const prevUnread = get().unreadCount;
    set({ notifications: prev.map((n) => ({ ...n, read: true })), unreadCount: 0 });
    try {
      await notificationService.markAllRead();
    } catch {
      set({ notifications: prev, unreadCount: prevUnread });
    }
  },

  deleteNotification: async (id) => {
    const prev = get().notifications;
    const removed = prev.find((n) => n.id === id);
    const notifications = prev.filter((n) => n.id !== id);
    set({
      notifications,
      unreadCount:
        removed && !removed.read
          ? Math.max(0, get().unreadCount - 1)
          : get().unreadCount,
    });
    try {
      await notificationService.remove(Number(id));
    } catch {
      set({
        notifications: prev,
        unreadCount:
          removed && !removed.read ? get().unreadCount + 1 : get().unreadCount,
      });
    }
  },
}));
