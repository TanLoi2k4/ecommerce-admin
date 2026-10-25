import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Star, Tag, Trash2 } from 'lucide-react';
import { useDeleteReview, useProduct, useProductReviews } from '../../hooks/useProducts';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageTitle } from '../../components/ui/PageTitle';
import { formatCurrency, formatDate } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';

type Tab = 'info' | 'reviews';

export function ProductDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('info');
  const [reviewPage, setReviewPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: product, isLoading, error } = useProduct(id);
  const { data: reviewsData, isLoading: reviewsLoading } = useProductReviews(id, reviewPage);
  const deleteReviewMutation = useDeleteReview(id);

  const queryError = error ? extractApiError(error, 'Không thể tải thông tin sản phẩm') : null;

  const handleDeleteReview = async (reviewId: number) => {
    setActionError(null);
    try {
      await deleteReviewMutation.mutateAsync(reviewId);
    } catch (err) {
      setActionError(extractApiError(err, 'Không thể xóa đánh giá'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/products')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {queryError}
        </div>
      </div>
    );
  }

  if (!product) return null;

  const reviews = reviewsData?.data ?? [];
  const reviewPagination = {
    page: reviewsData?.page ?? 1,
    totalPages: reviewsData?.totalPages ?? 1,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PageTitle title={product.name} subtitle={product.vendorName} />
      </div>

      {(actionError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {actionError}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {([
          { id: 'info' as Tab, label: 'Thông tin' },
          { id: 'reviews' as Tab, label: 'Đánh giá' },
        ]).map(({ id: t, label }) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center text-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-24 w-24 rounded-xl object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-100 text-3xl font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {product.name.charAt(0)}
                </div>
              )}
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">{product.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{product.vendorName}</p>
              <div className="mt-3">
                <StatusBadge status={product.status} />
              </div>
              {product.flashSale && (
                <span className="mt-2 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  Flash Sale
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Giá</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(product.price)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tồn kho</span>
                </div>
                <p
                  className={`mt-2 text-2xl font-bold ${
                    product.stock <= 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {product.stock}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Đánh giá</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {product.rating.toFixed(1)}
                </p>
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hình ảnh</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {product.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.imageUrl}
                      alt=""
                      className={`h-20 w-20 rounded-lg object-cover ${img.main ? 'ring-2 ring-primary-500' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Thông tin sản phẩm</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mã sản phẩm</label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{product.id}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Danh mục</label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{product.category}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nhà bán hàng</label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{product.vendorName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mã công khai</label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{product.publicId}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mô tả</label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{product.description || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-4">
          {reviewsLoading ? (
            <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ) : reviews.length === 0 ? (
            <EmptyState title="Chưa có đánh giá" description="Sản phẩm này chưa có đánh giá từ khách hàng." icon="inbox" />
          ) : (
            <>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
                            <Star className="h-4 w-4 fill-current" />
                            {review.rating}/5
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{review.comment || '—'}</p>
                        {review.vendorReply && (
                          <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
                            <span className="font-medium">Phản hồi nhà bán hàng:</span> {review.vendorReply}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deleteReviewMutation.isPending}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        title="Xóa đánh giá"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {reviewPagination.totalPages > 1 && (
                <Pagination
                  currentPage={reviewPagination.page}
                  totalPages={reviewPagination.totalPages}
                  onPageChange={setReviewPage}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
