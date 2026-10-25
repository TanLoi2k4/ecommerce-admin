import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import type { ProductListParams } from '../types/product';

const productQueryOptions = {
  staleTime: 0,
  refetchOnWindowFocus: true,
  refetchInterval: 30_000,
} as const;

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.list(params),
    ...productQueryOptions,
  });
}

export function useProduct(id?: string) {
  const numericId = id ? Number(id) : NaN;
  return useQuery({
    queryKey: ['products', numericId],
    queryFn: () => productService.getById(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
    ...productQueryOptions,
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productService.getTotalCount(),
  });
}

export function useProductReviews(productId?: string, page = 1) {
  const numericId = productId ? Number(productId) : NaN;
  return useQuery({
    queryKey: ['products', numericId, 'reviews', page],
    queryFn: () => productService.getReviews(numericId, page - 1, 10),
    enabled: Number.isFinite(numericId) && numericId > 0,
  });
}

export function useDeleteReview(productId?: string) {
  const queryClient = useQueryClient();
  const numericId = productId ? Number(productId) : NaN;
  return useMutation({
    mutationFn: (reviewId: number) => productService.deleteReview(reviewId),
    onSuccess: () => {
      if (Number.isFinite(numericId)) {
        queryClient.invalidateQueries({ queryKey: ['products', numericId, 'reviews'] });
      }
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
