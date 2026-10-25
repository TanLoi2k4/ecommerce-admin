import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import type { PaymentMethod, PaymentStatus } from '../types/payment';

export interface TransactionListParams {
  page?: number;
  size?: number;
  search?: string;
  type?: string;
  status?: string;
}

function mapUiStatusToPaymentStatus(status?: string): PaymentStatus | undefined {
  if (!status) return undefined;
  switch (status.toLowerCase()) {
    case 'completed':
      return 'COMPLETED';
    case 'pending':
      return 'PENDING';
    case 'failed':
      return 'FAILED';
    default:
      return undefined;
  }
}

export function useTransactions(params: TransactionListParams = {}) {
  const paymentStatus = mapUiStatusToPaymentStatus(params.status);
  const unsupportedType = params.type && params.type !== 'payment';

  return useQuery({
    queryKey: ['payments', 'admin', 'transactions', params],
    queryFn: () => {
      if (unsupportedType) {
        return Promise.resolve({ data: [], total: 0, page: params.page ?? 1, totalPages: 0 });
      }
      return paymentService.listTransactions({
        page: params.page,
        size: params.size,
        search: params.search,
        status: paymentStatus,
      });
    },
  });
}
