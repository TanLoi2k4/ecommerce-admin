import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AnalyticsPeriodQuery, TopProductDto, TopVendorWithShopName } from '../types/analytics';
import {
  getAdminDashboard,
  getAdminRevenueChart,
  getAdminRevenueReport,
  getProductsByCategory,
  getTopProducts,
  getTopVendors,
  getVendorDetailAnalytics,
} from '../api/analyticsApi';
import { productService } from '../services/productService';
import { vendorService } from '../services/vendorService';
import { formatVendorLabel } from '../utils/analyticsMappers';

export function useAdminDashboard(query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'dashboard', query.period, query.anchor],
    queryFn: () => getAdminDashboard(query),
    placeholderData: keepPreviousData,
  });
}

export function useAdminRevenueChart(query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'revenue', query.period, query.anchor],
    queryFn: () => getAdminRevenueChart(query),
    placeholderData: keepPreviousData,
  });
}

export function useAdminRevenueReport(query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'revenue-report', query.period, query.anchor],
    queryFn: () => getAdminRevenueReport(query),
    placeholderData: keepPreviousData,
  });
}

export function useTopVendors(limit = 10, query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'top-vendors', limit, query.period, query.anchor],
    queryFn: () => getTopVendors(limit, query),
    placeholderData: keepPreviousData,
  });
}

export function useTopVendorsWithNames(limit = 10, query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'top-vendors-with-names', limit, query.period, query.anchor],
    queryFn: async (): Promise<TopVendorWithShopName[]> => {
      const vendors = await getTopVendors(limit, query);
      const nameMap = await vendorService.fetchShopNamesByIds(vendors.map((vendor) => vendor.vendorId));
      return vendors.map((vendor) => ({
        ...vendor,
        shopName: nameMap.get(vendor.vendorId) ?? formatVendorLabel(vendor.vendorId),
      }));
    },
    placeholderData: keepPreviousData,
  });
}

export function useVendorDetailAnalytics(vendorKeycloakId?: string, query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'vendor-detail', vendorKeycloakId, query.period, query.anchor],
    queryFn: () => getVendorDetailAnalytics(vendorKeycloakId!, query),
    enabled: !!vendorKeycloakId,
    placeholderData: keepPreviousData,
  });
}

export function useTopProducts(limit = 20, query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'top-products', limit, query.period, query.anchor],
    queryFn: async (): Promise<TopProductDto[]> => {
      const products = await getTopProducts(limit, query);
      const missingIds = products.filter((product) => !product.imageUrl).map((product) => product.productId);
      if (missingIds.length === 0) return products;
      const imageMap = await productService.fetchImageUrlsByIds(missingIds);
      return products.map((product) =>
        product.imageUrl
          ? product
          : { ...product, imageUrl: imageMap.get(product.productId) || null },
      );
    },
    placeholderData: keepPreviousData,
  });
}

export function useProductsByCategory(query: AnalyticsPeriodQuery = {}) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'products-by-category', query.period, query.anchor],
    queryFn: () => getProductsByCategory(query),
    placeholderData: keepPreviousData,
  });
}
