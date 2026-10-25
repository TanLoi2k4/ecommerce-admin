import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import type { CategoryRequest } from '../types/category';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.list(),
  });
}

export function useCategory(id?: string) {
  const numericId = id ? Number(id) : NaN;
  return useQuery({
    queryKey: ['categories', numericId],
    queryFn: () => categoryService.getById(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  return {
    create: useMutation({
      mutationFn: (payload: CategoryRequest) => categoryService.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: CategoryRequest }) =>
        categoryService.update(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => categoryService.deactivate(id),
      onSuccess: invalidate,
    }),
  };
}
