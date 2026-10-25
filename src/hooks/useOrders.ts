import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import type { AnalyticsPeriodQuery } from '../types/analytics';
import type { OrderListParams } from '../types/order';

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: ['orders', 'admin', params],
    queryFn: () => orderService.list(params),
  });
}

export function useOrder(orderCode?: string) {
  return useQuery({
    queryKey: ['orders', 'admin', 'detail', orderCode],
    queryFn: () => orderService.getByOrderCode(orderCode!),
    enabled: !!orderCode,
  });
}

export function useOrderStats(query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['orders', 'admin', 'stats', query.period, query.anchor],
    queryFn: () => orderService.getStats(query),
    placeholderData: keepPreviousData,
  });
}
