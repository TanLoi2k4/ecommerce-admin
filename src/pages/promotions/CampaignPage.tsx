import { useState } from 'react';
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import { useCampaigns } from '../../hooks/useMarketplace';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { formatDate } from '../../utils/format';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { MarketplaceApiNotice } from '../../components/ui/MarketplaceApiNotice';

export function CampaignPage() {
  const { data, isLoading } = useCampaigns();
  const apiCampaigns = (Array.isArray(data) ? data : []) as any[];
  const [extraCampaigns, setExtraCampaigns] = useState<any[]>([]);
  const campaigns = [...apiCampaigns, ...extraCampaigns];
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', startDate: '', endDate: '' });

  const columns = [
    {
      key: 'name',
      header: 'Chiến dịch',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.description}</p>
          </div>
        </div>
      ),
    },
    { key: 'startDate', header: 'Bắt đầu', render: (row: any) => formatDate(row.startDate) },
    { key: 'endDate', header: 'Kết thúc', render: (row: any) => formatDate(row.endDate) },
    { key: 'participants', header: 'Nhà bán' },
    { key: 'status', header: 'Trạng thái', render: (row: any) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      render: (_row: any) => (
        <div className="flex items-center gap-2">
          <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"><Pencil className="h-4 w-4" /></button>
          <button className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setExtraCampaigns([...extraCampaigns, { id: `CMP${campaigns.length + 1}`, ...formData, status: 'pending', participants: 0, revenue: 0 }]);
    setModalOpen(false);
    setFormData({ name: '', description: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-4">
      <MarketplaceApiNotice />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chiến dịch</h1><DemoDataBadge /></div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" /> Tạo chiến dịch
        </button>
      </div>
      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : (
        <DataTable columns={columns} data={campaigns} keyExtractor={(row) => row.id} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tạo chiến dịch" size="md">
        <div className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày bắt đầu</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày kết thúc</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Hủy</button>
            <button onClick={handleCreate} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Tạo mới</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
