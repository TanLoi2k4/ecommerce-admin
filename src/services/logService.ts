import client from '../api/client';
import type { ApiResponse, LogQueryParams, LogResponse, LogStats, PaginatedResult, SpringPage } from '../types';
import { mapSpringPage, toSpringPage } from '../utils/pagination';

export const logService = {
  async getLogs(params: LogQueryParams = {}): Promise<PaginatedResult<LogResponse>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<SpringPage<LogResponse>>>('/admin/logs', {
      params: {
        page: toSpringPage(uiPage),
        size: params.size ?? 20,
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        level: params.level,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
    return mapSpringPage(data.data, uiPage);
  },

  async getStats(hours = 24): Promise<LogStats> {
    const { data } = await client.get<ApiResponse<LogStats>>('/admin/logs/stats', {
      params: { hours },
    });
    return data.data;
  },

  async getRecentByUser(userId: number, hours = 24): Promise<LogResponse[]> {
    const { data } = await client.get<ApiResponse<LogResponse[]>>(`/admin/logs/recent/${userId}`, {
      params: { hours },
    });
    return data.data;
  },
};
