import client from '../api/client';
import type { ApiResponse } from '../types';
import type {
  CarrierConfig,
  CarrierConfigRequest,
  Shipment,
  ShipmentTracking,
} from '../types/shipment';
import {
  normalizeCarrierConfig,
  normalizeShipment,
  normalizeShipmentTracking,
  sortShipmentsByUpdatedAt,
} from '../types/shipment';

const SHIPMENTS_BASE = '/shipments/admin';
const CARRIER_BASE = '/admin/carrier-configs';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

export const shipmentService = {
  async list(): Promise<Shipment[]> {
    const { data } = await client.get<ApiResponse<Shipment[]>>(SHIPMENTS_BASE);
    return sortShipmentsByUpdatedAt((unwrap(data) ?? []).map(normalizeShipment));
  },

  async listByVendor(vendorKeycloakId: string): Promise<Shipment[]> {
    const { data } = await client.get<ApiResponse<Shipment[]>>(
      `${SHIPMENTS_BASE}/vendor/${encodeURIComponent(vendorKeycloakId)}`,
    );
    return sortShipmentsByUpdatedAt((unwrap(data) ?? []).map(normalizeShipment));
  },

  async listByOrder(orderId: number): Promise<Shipment[]> {
    const { data } = await client.get<ApiResponse<Shipment[]>>(
      `${SHIPMENTS_BASE}/by-order/${encodeURIComponent(String(orderId))}`,
    );
    return sortShipmentsByUpdatedAt((unwrap(data) ?? []).map(normalizeShipment));
  },

  async getById(id: number): Promise<Shipment> {
    const { data } = await client.get<ApiResponse<Shipment>>(
      `${SHIPMENTS_BASE}/${encodeURIComponent(String(id))}`,
    );
    return normalizeShipment(unwrap(data));
  },

  async getTracking(id: number): Promise<ShipmentTracking[]> {
    const { data } = await client.get<ApiResponse<ShipmentTracking[]>>(
      `${SHIPMENTS_BASE}/${encodeURIComponent(String(id))}/tracking`,
    );
    return (unwrap(data) ?? []).map(normalizeShipmentTracking);
  },

  async listCarrierConfigs(): Promise<CarrierConfig[]> {
    const { data } = await client.get<ApiResponse<CarrierConfig[]>>(CARRIER_BASE);
    return (unwrap(data) ?? []).map(normalizeCarrierConfig);
  },

  async getCarrierConfig(id: number): Promise<CarrierConfig> {
    const { data } = await client.get<ApiResponse<CarrierConfig>>(
      `${CARRIER_BASE}/${encodeURIComponent(String(id))}`,
    );
    return normalizeCarrierConfig(unwrap(data));
  },

  async createCarrierConfig(request: CarrierConfigRequest): Promise<CarrierConfig> {
    const { data } = await client.post<ApiResponse<CarrierConfig>>(CARRIER_BASE, request);
    return normalizeCarrierConfig(unwrap(data));
  },

  async updateCarrierConfig(id: number, request: CarrierConfigRequest): Promise<CarrierConfig> {
    const { data } = await client.put<ApiResponse<CarrierConfig>>(
      `${CARRIER_BASE}/${encodeURIComponent(String(id))}`,
      request,
    );
    return normalizeCarrierConfig(unwrap(data));
  },

  async deleteCarrierConfig(id: number): Promise<void> {
    const { data } = await client.delete<ApiResponse<void>>(
      `${CARRIER_BASE}/${encodeURIComponent(String(id))}`,
    );
    unwrap(data);
  },
};
