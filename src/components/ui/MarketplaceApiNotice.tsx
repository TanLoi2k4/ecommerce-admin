import { MARKETPLACE_API_ENABLED } from '../../services/marketplace/marketplaceService';

export function MarketplaceApiNotice() {
  if (MARKETPLACE_API_ENABLED) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
      API marketplace cho nhà bán, sản phẩm và đơn hàng chưa được kết nối.
      Dữ liệu khách hàng được tải từ customer-service. Phê duyệt thanh toán sử dụng payment-service.
    </div>
  );
}
