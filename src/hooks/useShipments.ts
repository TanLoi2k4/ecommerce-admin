import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shipmentService } from '../services/shipmentService';
import type { CarrierConfigRequest } from '../types/shipment';

const SHIPMENTS_KEY = ['shipments', 'admin'] as const;
const CARRIERS_KEY = ['carrier-configs'] as const;

export function useAdminShipments() {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'list'],
    queryFn: () => shipmentService.list(),
  });
}

export function useAdminShipment(id?: number) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'detail', id],
    queryFn: () => shipmentService.getById(id!),
    enabled: Number.isFinite(id),
  });
}

export function useAdminShipmentTracking(id?: number) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'tracking', id],
    queryFn: () => shipmentService.getTracking(id!),
    enabled: Number.isFinite(id),
  });
}

export function useVendorShipments(vendorKeycloakId?: string) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'vendor', vendorKeycloakId],
    queryFn: () => shipmentService.listByVendor(vendorKeycloakId!),
    enabled: !!vendorKeycloakId,
  });
}

export function useOrderShipments(orderId?: number) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'order', orderId],
    queryFn: () => shipmentService.listByOrder(orderId!),
    enabled: Number.isFinite(orderId),
  });
}

export function useCarrierConfigs() {
  return useQuery({
    queryKey: CARRIERS_KEY,
    queryFn: () => shipmentService.listCarrierConfigs(),
  });
}

export function useCreateCarrierConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CarrierConfigRequest) => shipmentService.createCarrierConfig(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CARRIERS_KEY });
    },
  });
}

export function useUpdateCarrierConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: CarrierConfigRequest }) =>
      shipmentService.updateCarrierConfig(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CARRIERS_KEY });
    },
  });
}

export function useDeleteCarrierConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shipmentService.deleteCarrierConfig(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CARRIERS_KEY });
    },
  });
}
