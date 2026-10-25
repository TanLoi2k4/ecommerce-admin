import type {
  ProductDetail,
  ProductDocument,
  ProductListItem,
  ProductResponse,
  ProductStatus,
} from '../../types/product';

export function deriveProductStatus(deleted: boolean, stock: number): ProductStatus {
  if (deleted) return 'deleted';
  if (stock <= 0) return 'out_of_stock';
  return 'active';
}

function isDeletedFlag(doc: ProductDocument): boolean {
  return Boolean(doc.deleted ?? doc.isDeleted);
}

function isFlashSaleFlag(doc: ProductDocument): boolean {
  return Boolean(doc.flashSale ?? doc.isFlashSale);
}

export function toProductListItem(
  doc: ProductDocument,
  vendorName = 'Unknown vendor',
): ProductListItem {
  return {
    id: String(doc.id),
    name: doc.name,
    description: doc.description ?? '',
    category: doc.category ?? '',
    price: doc.price,
    stock: doc.stock,
    rating: doc.rating ?? 0,
    imageUrl: doc.imageUrl ?? '',
    keycloakId: doc.keycloakId,
    vendorName,
    status: deriveProductStatus(isDeletedFlag(doc), doc.stock),
    flashSale: isFlashSaleFlag(doc),
  };
}

export function toProductDetail(
  product: ProductResponse,
  vendorName = 'Unknown vendor',
): ProductDetail {
  return {
    id: String(product.id),
    name: product.name,
    description: product.description ?? '',
    category: product.category?.name ?? '',
    categoryId: product.category?.id,
    price: product.price,
    stock: product.stock,
    rating: product.rating ?? 0,
    keycloakId: product.keycloakId,
    vendorName,
    imageUrl: product.imageUrl ?? '',
    images: product.images ?? [],
    status: deriveProductStatus(product.deleted, product.stock),
    flashSale: product.flashSale,
    flashSaleEndTime: product.flashSaleEndTime,
    originalPriceBeforeFs: product.originalPriceBeforeFs,
    publicId: product.publicId,
  };
}

export function filterByStatus<T extends { status: ProductStatus }>(
  items: T[],
  status?: ProductStatus,
): T[] {
  if (!status) return items;
  return items.filter((item) => item.status === status);
}
