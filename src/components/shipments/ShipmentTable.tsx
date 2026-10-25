import { useNavigate } from 'react-router-dom';
import { DataTable } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDateTime } from '../../utils/format';
import { formatCarrierLabel } from '../../utils/shipmentLabels';
import type { Shipment } from '../../types/shipment';

type ShipmentTableProps = {
  shipments: Shipment[];
};

export function ShipmentTable({ shipments }: ShipmentTableProps) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'id',
      header: 'Vận đơn',
      render: (row: Shipment) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">#{row.id}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Đơn phụ #{row.subOrderId}</p>
        </div>
      ),
    },
    {
      key: 'orderId',
      header: 'Đơn hàng',
      render: (row: Shipment) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.orderId ?? '—'}</span>
      ),
    },
    {
      key: 'carrier',
      header: 'Đơn vị VC',
      render: (row: Shipment) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {formatCarrierLabel(row.carrierCode, row.carrierName)}
          </p>
          {row.serviceLevel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.serviceLevel}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tracking',
      header: 'Mã vận đơn',
      render: (row: Shipment) => {
        const trackingCode = row.carrierTrackingId || row.externalShipmentId;
        return trackingCode ? (
          <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">
            {trackingCode}
          </code>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: Shipment) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      render: (row: Shipment) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(row.updatedAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={shipments}
      keyExtractor={(row) => String(row.id)}
      onRowClick={(row) => navigate(`/shipments/${row.id}`)}
    />
  );
}
