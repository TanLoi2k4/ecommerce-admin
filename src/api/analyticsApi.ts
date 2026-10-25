import client from './client';
import type { ApiResponse } from '../types/api';
import type {
  AdminDashboardResponse,
  AnalyticsPeriodQuery,
  CategoryBreakdownDto,
  RevenueReportResponse,
  SalesAnalyticsResponse,
  TopProductDto,
  TopVendorDto,
  VendorDetailAnalyticsResponse,
} from '../types/analytics';
import {
  mapAdminDashboard,
  mapCategoryBreakdown,
  mapRevenueReport,
  mapSalesAnalytics,
  mapTopProduct,
  mapTopVendor,
  mapVendorDetailAnalytics,
} from '../utils/analyticsMappers';
import { toPeriodParams, todayAnchor } from '../utils/analyticsPeriod';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

function periodParams(query: AnalyticsPeriodQuery = {}) {
  return toPeriodParams(query.period ?? 'MONTH', query.anchor || todayAnchor());
}

export async function getAdminDashboard(
  query: AnalyticsPeriodQuery = {}
): Promise<AdminDashboardResponse> {
  const { data } = await client.get<ApiResponse<Record<string, unknown>>>('/analytics/admin/dashboard', {
    params: periodParams(query),
  });
  return mapAdminDashboard(unwrap(data) ?? {});
}

export async function getAdminRevenueChart(
  query: AnalyticsPeriodQuery = {}
): Promise<SalesAnalyticsResponse> {
  const { data } = await client.get<ApiResponse<Record<string, unknown>>>('/analytics/admin/revenue', {
    params: periodParams(query),
  });
  return mapSalesAnalytics(unwrap(data) ?? {});
}

export async function getAdminRevenueReport(
  query: AnalyticsPeriodQuery = {}
): Promise<RevenueReportResponse> {
  const { data } = await client.get<ApiResponse<Record<string, unknown>>>('/analytics/admin/revenue-report', {
    params: periodParams(query),
  });
  return mapRevenueReport(unwrap(data) ?? {});
}

export async function getTopVendors(
  limit = 10,
  query: AnalyticsPeriodQuery = {}
): Promise<TopVendorDto[]> {
  const { data } = await client.get<ApiResponse<Record<string, unknown>[]>>(`/analytics/admin/vendors/top`, {
    params: { limit, ...periodParams(query) },
  });
  const rows = unwrap(data);
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => mapTopVendor(item));
}

export async function getVendorDetailAnalytics(
  vendorId: string,
  query: AnalyticsPeriodQuery = {}
): Promise<VendorDetailAnalyticsResponse> {
  const { data } = await client.get<ApiResponse<Record<string, unknown>>>(
    `/analytics/admin/vendors/${encodeURIComponent(vendorId)}`,
    { params: periodParams(query) }
  );
  return mapVendorDetailAnalytics(unwrap(data) ?? {});
}

export async function getTopProducts(
  limit = 20,
  query: AnalyticsPeriodQuery = {}
): Promise<TopProductDto[]> {
  const { data } = await client.get<ApiResponse<Record<string, unknown>[]>>(`/analytics/admin/products/top`, {
    params: { limit, ...periodParams(query) },
  });
  const rows = unwrap(data);
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => mapTopProduct(item));
}

export async function getProductsByCategory(
  query: AnalyticsPeriodQuery = {}
): Promise<CategoryBreakdownDto[]> {
  const { data } = await client.get<ApiResponse<Record<string, unknown>[]>>(
    `/analytics/admin/products/by-category`,
    { params: periodParams(query) }
  );
  const rows = unwrap(data);
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => mapCategoryBreakdown(item));
}
