import type { CategoryResponse } from './category';

export type ProductStatus = 'active' | 'out_of_stock' | 'deleted';

export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  publicId: string;
  main: boolean;
}

export interface ProductDocument {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  imageUrl: string;
  keycloakId: string;
  isDeleted?: boolean;
  deleted?: boolean;
  originalPriceBeforeFs?: number;
  isFlashSale?: boolean;
  flashSale?: boolean;
  flashSaleEndTime?: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  category: CategoryResponse;
  price: number;
  stock: number;
  rating: number;
  keycloakId: string;
  publicId: string;
  imageUrl: string;
  images: ProductImageResponse[];
  deleted: boolean;
  version: number;
  originalPriceBeforeFs?: number;
  flashSale: boolean;
  flashSaleEndTime?: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  imageUrl: string;
  keycloakId: string;
  vendorName: string;
  status: ProductStatus;
  flashSale: boolean;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId?: number;
  price: number;
  stock: number;
  rating: number;
  keycloakId: string;
  vendorName: string;
  imageUrl: string;
  images: ProductImageResponse[];
  status: ProductStatus;
  flashSale: boolean;
  flashSaleEndTime?: string;
  originalPriceBeforeFs?: number;
  publicId: string;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: ProductStatus;
}

export interface ReviewResponse {
  id: number;
  productId: number;
  customerId: string;
  rating: number;
  comment: string;
  images: string[];
  vendorReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicVendorProfile {
  id: number;
  keycloakId: string;
  shopName: string;
  logoUrl?: string;
  status: string;
  rating?: number;
  reviewCount?: number;
}
