import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Flag, Package, Store, User, XCircle, Loader2 } from 'lucide-react';
import { useReport, useUpdateReportStatus } from '../../hooks/useReports';
import { useProduct } from '../../hooks/useProducts';
import { useVendor } from '../../hooks/useVendors';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SupportChatPanel } from '../../components/chat/SupportChatPanel';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';
import { REPORT_TYPE_LABELS, REPORT_STATUS_OPTIONS, type ReportStatus } from '../../types/report';

function ReportedProductCard({ productId }: { productId: number }) {
  const { data: product, isLoading, error } = useProduct(String(productId));

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />;
  }

  if (error || !product) {
    return (
      <p className="text-sm text-gray-400">Sản phẩm #{productId} không còn tồn tại hoặc đã bị xóa.</p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700">
          <Package className="h-6 w-6" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{product.vendorName}</p>
        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
          {formatCurrency(product.price)}
        </p>
      </div>
    </div>
  );
}

function ReportedVendorCard({ vendorId }: { vendorId: number }) {
  const { data: vendor, isLoading, error } = useVendor(String(vendorId));

  if (isLoading) {
    return <div className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />;
  }

  if (error || !vendor) {
    return (
      <p className="text-sm text-gray-400">Nhà bán #{vendorId} không còn tồn tại hoặc đã bị xóa.</p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
      {vendor.logoUrl ? (
        <img src={vendor.logoUrl} alt={vendor.shopName} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700">
          <Store className="h-6 w-6" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{vendor.shopName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {vendor.lastName} {vendor.firstName} · {vendor.email}
        </p>
        <StatusBadge status={vendor.status.toLowerCase()} className="mt-1" />
      </div>
    </div>
  );
}

export function ComplaintReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportId = id ? Number(id) : undefined;

  const { data: report, isLoading, error } = useReport(reportId);
  const updateStatus = useUpdateReportStatus();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleUpdateStatus = async (status: ReportStatus) => {
    if (!reportId) return;
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ id: reportId, status });
    } catch (err) {
      setActionError(extractApiError(err, 'Không thể cập nhật trạng thái'));
    }
  };

  if (isLoading) {
    return <SkeletonLoader type="table" />;
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/reports/complaints')}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <EmptyState
          title="Không thể tải khiếu nại"
          description={error ? extractApiError(error, 'Khiếu nại không tồn tại') : 'Khiếu nại không tồn tại'}
          icon="alert"
        />
      </div>
    );
  }

  const isMutating = updateStatus.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/reports/complaints')}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Khiếu nại #{report.id}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {REPORT_TYPE_LABELS[report.type]}
            {report.targetId != null ? ` · Mục tiêu #${report.targetId}` : ''}
          </p>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {actionError}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{report.reason}</p>
              <StatusBadge status={report.status.toLowerCase()} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {REPORT_STATUS_OPTIONS.filter((opt) => opt.value !== report.status).map((opt) => (
              <button
                key={opt.value}
                onClick={() => void handleUpdateStatus(opt.value)}
                disabled={isMutating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {isMutating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : opt.value === 'RESOLVED' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : opt.value === 'REJECTED' ? (
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                ) : null}
                Chuyển sang: {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Người báo cáo</label>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {report.reporterName ?? 'Không xác định'}
            </p>
            <p className="break-all font-mono text-xs text-gray-400">{report.reporterKeycloakId}</p>
            <p className="text-xs text-gray-400">{report.reporterRole}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Quản trị viên xử lý</label>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {report.assignedAdminName ?? 'Không xác định'}
            </p>
            <p className="break-all font-mono text-xs text-gray-400">
              {report.assignedAdminId ?? '—'}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Thời gian tạo</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{formatDateTime(report.createdAt)}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Mã phòng chat hỗ trợ</label>
            <p className="break-all font-mono text-sm text-gray-900 dark:text-gray-100">
              {report.chatRoomCode ?? '—'}
            </p>
          </div>
        </div>

        {(report.type === 'PRODUCT' || report.type === 'VENDOR') && (
          <div className="mt-6">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {report.type === 'PRODUCT' ? 'Sản phẩm bị khiếu nại' : 'Nhà bán bị khiếu nại'}
            </label>
            <div className="mt-2">
              {report.targetId == null ? (
                <p className="text-sm text-gray-400">Không có thông tin đối tượng bị khiếu nại.</p>
              ) : report.type === 'PRODUCT' ? (
                <ReportedProductCard productId={report.targetId} />
              ) : (
                <ReportedVendorCard vendorId={report.targetId} />
              )}
            </div>
          </div>
        )}

        {report.targetKeycloakId && (
          <div className="mt-6">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {report.reporterRole === 'VENDOR' ? 'Khách hàng bị tố cáo' : 'Người bị tố cáo'}
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700">
                <User className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.targetName ?? 'Không xác định'}
                </p>
                <p className="break-all font-mono text-xs text-gray-400">{report.targetKeycloakId}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="text-xs text-gray-500 dark:text-gray-400">Mô tả chi tiết</label>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
            {report.description}
          </p>
        </div>
      </div>

      {report.chatRoomCode ? (
        <SupportChatPanel
          roomCode={report.chatRoomCode}
          reporterName={report.reporterName}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-600">
          Khiếu nại này chưa có phòng chat hỗ trợ.
        </div>
      )}
    </div>
  );
}
