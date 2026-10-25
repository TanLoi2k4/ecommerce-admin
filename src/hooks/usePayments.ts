import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import type { PayablesFilterParams, RejectPayoutRequest, VendorPayoutStatus } from '../types/payment';

export function useAdminPayouts(status: VendorPayoutStatus = 'PENDING_APPROVAL') {
  return useQuery({
    queryKey: ['payments', 'payouts', status],
    queryFn: () => paymentService.listPayouts(status),
  });
}

export function useApprovePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: number) => paymentService.approvePayout(payoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'payouts'] });
    },
  });
}

export function useRejectPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payoutId, reason }: { payoutId: number; reason: string }) =>
      paymentService.rejectPayout(payoutId, { reason } satisfies RejectPayoutRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'payouts'] });
    },
  });
}

export function useReleasePayoutItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: number) => paymentService.releaseFailedPayoutItems(payoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'payouts'] });
    },
  });
}

export function usePlatformPayables(params: PayablesFilterParams = {}) {
  return useQuery({
    queryKey: ['payments', 'platform-payables', params],
    queryFn: () => paymentService.getPlatformPayables(params),
  });
}

export function useVendorPayables(params: PayablesFilterParams = {}) {
  return useQuery({
    queryKey: ['payments', 'vendor-payables', params],
    queryFn: () => paymentService.getVendorPayables(params),
  });
}

export function usePaymentByOrderCode(orderCode?: string) {
  return useQuery({
    queryKey: ['payments', 'detail', orderCode],
    queryFn: () => paymentService.getPaymentByOrderCode(orderCode!),
    enabled: !!orderCode,
  });
}
