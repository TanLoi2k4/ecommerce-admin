import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorService } from '../services/vendorService';
import type {
  VendorBankAccountListParams,
  VendorListParams,
  VendorStatus,
  VendorUpdateRequest,
} from '../types/vendor';

export function useVendors(params: VendorListParams) {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => vendorService.list(params),
  });
}

export function useVendor(id?: string) {
  const numericId = id ? Number(id) : NaN;
  return useQuery({
    queryKey: ['vendors', numericId],
    queryFn: () => vendorService.getById(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
  });
}

export function useVendorStats() {
  return useQuery({
    queryKey: ['vendors', 'stats'],
    queryFn: () => vendorService.getStats(),
  });
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: VendorStatus }) =>
      vendorService.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vendors', 'stats'] });
    },
  });
}

export function useUpdateVendorInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VendorUpdateRequest }) =>
      vendorService.updateInfo(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors', variables.id] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vendorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors', 'stats'] });
    },
  });
}

export function useBankAccounts(params: VendorBankAccountListParams) {
  return useQuery({
    queryKey: ['vendors', 'bank-accounts', params],
    queryFn: () => vendorService.listBankAccounts(params),
  });
}

export function useVendorBankAccount(vendorKeycloakId?: string, shopName?: string) {
  return useQuery({
    queryKey: ['vendors', 'bank-account', vendorKeycloakId],
    queryFn: () => vendorService.getBankAccountForVendor(vendorKeycloakId!, shopName!),
    enabled: !!vendorKeycloakId && !!shopName,
  });
}

export function useVendorShopNames(vendorIds: string[]) {
  return useQuery({
    queryKey: ['vendors', 'names', vendorIds],
    queryFn: () => vendorService.fetchShopNamesByIds(vendorIds),
    enabled: vendorIds.length > 0,
    initialData: vendorIds.length === 0 ? new Map<string, string>() : undefined,
  });
}

export function useVerifyBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorKeycloakId, isValid }: { vendorKeycloakId: string; isValid: boolean }) =>
      vendorService.verifyBankAccount(vendorKeycloakId, isValid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', 'bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['vendors', 'bank-account'] });
    },
  });
}
