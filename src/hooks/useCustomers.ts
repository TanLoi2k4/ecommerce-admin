import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import type { CustomerListParams, CustomerStatus, CustomerUpdateRequest } from '../types/customer';

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.list(params),
  });
}

export function useCustomer(id?: string) {
  const numericId = id ? Number(id) : NaN;
  return useQuery({
    queryKey: ['customers', numericId],
    queryFn: () => customerService.getById(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
  });
}

export function useCustomerAddresses(id?: string) {
  const numericId = id ? Number(id) : NaN;
  return useQuery({
    queryKey: ['customers', numericId, 'addresses'],
    queryFn: () => customerService.getAddresses(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
  });
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ['customers', 'stats'],
    queryFn: () => customerService.getStats(),
  });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: CustomerStatus; reason?: string }) =>
      customerService.updateStatus(id, status, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customers', 'stats'] });
    },
  });
}

export function useUpdateCustomerInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CustomerUpdateRequest }) =>
      customerService.updateInfo(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', 'stats'] });
    },
  });
}
