import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { discountService } from '../services/discountService';
import type { DiscountListParams, DiscountRequest } from '../types/discount';

const DISCOUNTS_KEY = ['discounts'] as const;

export function useDiscounts(params: DiscountListParams = {}) {
  return useQuery({
    queryKey: [...DISCOUNTS_KEY, params],
    queryFn: () => discountService.list(params),
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: DiscountRequest) => discountService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DISCOUNTS_KEY });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: DiscountRequest }) =>
      discountService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DISCOUNTS_KEY });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => discountService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DISCOUNTS_KEY });
    },
  });
}
