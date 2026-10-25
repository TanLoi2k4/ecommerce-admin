import { EmptyState } from '../../components/ui/EmptyState';
import { PageTitle } from '../../components/ui/PageTitle';

export function ProductModerationPage() {
  return (
    <div className="space-y-4">
      <PageTitle title="Kiểm duyệt sản phẩm" />
      <EmptyState
        title="Chưa bật kiểm duyệt"
        description="Quy trình phê duyệt sản phẩm chưa được cấu hình. Nhà bán hàng đăng sản phẩm trực tiếp; quản trị viên có thể xem sản phẩm và quản lý đánh giá từ trang chi tiết sản phẩm."
        icon="package"
      />
    </div>
  );
}
