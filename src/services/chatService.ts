import client from '../api/client';
import type { ApiResponse, SpringPage } from '../types';
import type { ChatMessageDto } from '../types/chat';

export const chatService = {
  async getMessages(roomCode: string, page = 0, size = 50): Promise<SpringPage<ChatMessageDto>> {
    const { data } = await client.get<ApiResponse<SpringPage<ChatMessageDto>>>(
      `/chat/rooms/${encodeURIComponent(roomCode)}/messages`,
      { params: { page, size } }
    );
    return data.data;
  },

  async sendMessage(
    roomCode: string,
    content: string,
    type = 'TEXT',
    files?: File[]
  ): Promise<ChatMessageDto> {
    const form = new FormData();
    if (content) form.append('content', content);
    form.append('type', type);
    if (files) {
      files.forEach((file) => form.append('files', file));
    }
    const { data } = await client.post<ApiResponse<ChatMessageDto>>(
      `/chat/rooms/${encodeURIComponent(roomCode)}/messages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  async markRead(roomCode: string): Promise<void> {
    await client.put(`/chat/rooms/${encodeURIComponent(roomCode)}/read`);
  },
};
