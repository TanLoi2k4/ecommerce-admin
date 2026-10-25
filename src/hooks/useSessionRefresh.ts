import { useEffect, useRef } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../utils/tokenStorage';

const REFRESH_BUFFER_MS = 60_000;
const FALLBACK_REFRESH_MS = 4 * 60_000;
const MIN_SCHEDULE_MS = 30_000;

function getRefreshDelay(expiresAt: number | null): number {
  if (expiresAt) {
    return Math.max(MIN_SCHEDULE_MS, expiresAt - Date.now() - REFRESH_BUFFER_MS);
  }
  return FALLBACK_REFRESH_MS;
}

function shouldRefreshNow(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  return expiresAt - Date.now() <= REFRESH_BUFFER_MS;
}

/** Tự refresh access token trước khi hết hạn để admin không bị đăng xuất khi idle. */
export function useSessionRefresh(enabled = true) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !tokenStorage.getRefreshToken()) return;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      const expiresAt = tokenStorage.getExpiresAt();
      timerRef.current = setTimeout(() => {
        void runRefresh();
      }, getRefreshDelay(expiresAt));
    };

    const runRefresh = async () => {
      try {
        await authService.refreshToken();
        scheduleNext();
      } catch {
        // Refresh thất bại — request tiếp theo sẽ xử lý 401
      }
    };

    const refreshIfNeeded = async () => {
      const expiresAt = tokenStorage.getExpiresAt();
      if (shouldRefreshNow(expiresAt)) {
        await runRefresh();
        return;
      }
      scheduleNext();
    };

    void refreshIfNeeded();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled]);
}
