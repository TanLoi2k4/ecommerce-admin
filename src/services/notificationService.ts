import client from '../api/client';
import type { ApiResponse, SpringPage } from '../types';
import type {
  BroadcastNotificationResponse,
  CreateBroadcastNotificationRequest,
  PersonalNotificationResponse,
} from '../types/notification';

export const notificationService = {
  // ─── Broadcast notification campaigns (admin only) ──────────────────────
  async listBroadcasts(): Promise<BroadcastNotificationResponse[]> {
    const { data } = await client.get<ApiResponse<BroadcastNotificationResponse[]>>('/notifications/broadcast');
    return data.data ?? [];
  },

  async createBroadcast(payload: CreateBroadcastNotificationRequest): Promise<BroadcastNotificationResponse> {
    const { data } = await client.post<ApiResponse<BroadcastNotificationResponse>>('/notifications/broadcast', payload);
    return data.data;
  },

  async sendBroadcast(id: number): Promise<BroadcastNotificationResponse> {
    const { data } = await client.put<ApiResponse<BroadcastNotificationResponse>>(`/notifications/broadcast/${id}/send`);
    return data.data;
  },

  async deleteBroadcast(id: number): Promise<void> {
    await client.delete(`/notifications/broadcast/${id}`);
  },

  // ─── Personal notification inbox (bell icon) ─────────────────────────────
  async list(page = 0, size = 20): Promise<SpringPage<PersonalNotificationResponse>> {
    const { data } = await client.get<ApiResponse<SpringPage<PersonalNotificationResponse>>>('/notifications', {
      params: { page, size },
    });
    return data.data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await client.get<ApiResponse<number>>('/notifications/unread-count');
    return data.data ?? 0;
  },

  async markRead(id: number): Promise<PersonalNotificationResponse> {
    const { data } = await client.put<ApiResponse<PersonalNotificationResponse>>(`/notifications/${id}/read`);
    return data.data;
  },

  async markAllRead(): Promise<void> {
    await client.put('/notifications/read-all');
  },

  async remove(id: number): Promise<void> {
    await client.delete(`/notifications/${id}`);
  },
};
