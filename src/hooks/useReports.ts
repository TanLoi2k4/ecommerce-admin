import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import type { ReportListParams, ReportStatus } from '../types/report';

export function useReports(params: ReportListParams = {}) {
  return useQuery({
    queryKey: ['reports', 'admin', params],
    queryFn: () => reportService.list(params),
  });
}

export function useReport(id?: number) {
  return useQuery({
    queryKey: ['reports', 'admin', 'detail', id],
    queryFn: () => reportService.getById(id!),
    enabled: id != null && !Number.isNaN(id),
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReportStatus }) =>
      reportService.updateStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'admin'] });
      queryClient.setQueryData(['reports', 'admin', 'detail', updated.id], updated);
    },
  });
}
