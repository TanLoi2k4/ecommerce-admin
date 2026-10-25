import { useEffect } from 'react';
import {
  connectNotificationSocket,
  isNotificationSocketConnected,
} from '../api/notificationSocket';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { tokenStorage } from '../utils/tokenStorage';

const POLL_FALLBACK_MS = 10_000;

/**
 * Realtime notifications via STOMP /user/queue/notifications.
 * Polling is only used when the websocket is disconnected.
 */
export function useNotificationRealtime(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const pushRealtimeNotification = useNotificationStore((s) => s.pushRealtimeNotification);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    void fetchNotifications();

    const disconnect = connectNotificationSocket(
      () => tokenStorage.getAccessToken(),
      pushRealtimeNotification
    );

    const pollTimer = window.setInterval(() => {
      if (!isNotificationSocketConnected()) {
        void fetchNotifications().catch(() => undefined);
      }
    }, POLL_FALLBACK_MS);

    return () => {
      disconnect();
      window.clearInterval(pollTimer);
    };
  }, [enabled, isAuthenticated, fetchNotifications, pushRealtimeNotification]);
}
