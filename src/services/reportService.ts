import client from '../api/client';
import type { ApiResponse, PaginatedResult, SpringPage } from '../types';
import type { ReportListParams, ReportResponse, ReportStatus } from '../types/report';
import { mapSpringPage, toSpringPage } from '../utils/pagination';

export const reportService = {
  async list(params: ReportListParams = {}): Promise<PaginatedResult<ReportResponse>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<SpringPage<ReportResponse>>>('/reports', {
      params: {
        page: toSpringPage(uiPage),
        size: params.size ?? 100,
      },
    });
    return mapSpringPage(data.data, uiPage);
  },

  async getById(id: number): Promise<ReportResponse> {
    const { data } = await client.get<ApiResponse<ReportResponse>>(`/reports/${id}`);
    return data.data;
  },

  async updateStatus(id: number, status: ReportStatus): Promise<ReportResponse> {
    const { data } = await client.put<ApiResponse<ReportResponse>>(`/reports/${id}/status`, {
      status,
    });
    return data.data;
  },
};
