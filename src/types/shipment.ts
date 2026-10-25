export type ShipmentStatus =
  | 'CREATED'
  | 'BOOKING_FAILED'
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNING'
  | 'RETURNED'
  | 'CANCELLED';

export interface Shipment {
  id: number;
  subOrderId: number;
  orderId?: number | null;
  externalShipmentId: string;
  carrierCode: string;
  carrierName?: string | null;
  carrierTrackingId?: string | null;
  serviceLevel?: string | null;
  externalReference?: string | null;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  mocked?: boolean | null;
}

export interface ShipmentTracking {
  id: number;
  trackingId: string;
  location?: string | null;
  eta?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehicle?: string | null;
  rawCarrierData?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CarrierConfig {
  id: number;
  carrierCode: string;
  baseUrl: string;
  apiKey?: string | null;
  active: boolean;
}

export interface CarrierConfigRequest {
  carrierCode: string;
  baseUrl: string;
  apiKey?: string;
  active: boolean;
}

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'CREATED',
  'BOOKING_FAILED',
  'BOOKED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNING',
  'RETURNED',
  'CANCELLED',
];

export function normalizeShipment(raw: Shipment): Shipment {
  return {
    ...raw,
    id: Number(raw.id),
    subOrderId: Number(raw.subOrderId),
    orderId: raw.orderId != null ? Number(raw.orderId) : raw.orderId,
    mocked: raw.mocked != null ? Boolean(raw.mocked) : raw.mocked,
  };
}

export function normalizeShipmentTracking(raw: ShipmentTracking): ShipmentTracking {
  return {
    ...raw,
    id: Number(raw.id),
  };
}

export function normalizeCarrierConfig(raw: CarrierConfig): CarrierConfig {
  return {
    ...raw,
    id: Number(raw.id),
    active: Boolean(raw.active),
  };
}

export function sortShipmentsByUpdatedAt(shipments: Shipment[]): Shipment[] {
  return [...shipments].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function filterShipments(
  shipments: Shipment[],
  query: string,
  status?: string,
): Shipment[] {
  const needle = query.trim().toLowerCase();
  return shipments.filter((shipment) => {
    if (status && shipment.status !== status) return false;
    if (!needle) return true;
    const tracking = (shipment.carrierTrackingId || shipment.externalShipmentId || '').toLowerCase();
    return (
      String(shipment.id).includes(needle) ||
      String(shipment.subOrderId).includes(needle) ||
      String(shipment.orderId ?? '').includes(needle) ||
      tracking.includes(needle) ||
      (shipment.carrierCode ?? '').toLowerCase().includes(needle) ||
      (shipment.carrierName ?? '').toLowerCase().includes(needle)
    );
  });
}
