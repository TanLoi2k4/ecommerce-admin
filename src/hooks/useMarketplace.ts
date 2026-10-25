import { useQuery } from '@tanstack/react-query';
import {
  getAdminDashboard,
  getAdminRevenueChart,
  getAdminRevenueReport,
  getTopVendors,
  getVendorDetailAnalytics,
} from '../api/analyticsApi';
import { chartPointsToSeries, formatVendorLabel } from '../utils/analyticsMappers';
import { marketplaceService } from '../services/marketplace/marketplaceService';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics', 'admin', 'dashboard'],
    queryFn: async () => {
      const dashboard = await getAdminDashboard();
      return {
        totalUsers: dashboard.totalUsers,
        totalOrders: dashboard.totalOrders,
        totalRevenue: dashboard.gmv,
        openTickets: 0,
        revenueGrowth: dashboard.gmvGrowth,
        userGrowth: dashboard.userGrowth,
        orderGrowth: dashboard.ordersGrowth,
        commissionEarned: dashboard.commissionEarned,
        totalVendors: dashboard.totalVendors,
      };
    },
  });
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ['analytics', 'admin', 'revenue', '30d'],
    queryFn: async () => {
      const response = await getAdminRevenueChart({ period: 'MONTH' });
      return chartPointsToSeries(response.chartData);
    },
  });
}

export function useUserGrowthChart() {
  return useQuery({
    queryKey: ['analytics', 'admin', 'top-vendors', 7],
    queryFn: async () => {
      const vendors = await getTopVendors(7);
      return vendors.map((vendor) => ({
        name: formatVendorLabel(vendor.vendorId),
        users: vendor.orders,
        vendors: vendor.revenue,
      }));
    },
  });
}

export function useVendorAnalytics(vendorKeycloakId: string) {
  return useQuery({
    queryKey: ['analytics', 'admin', 'vendor-detail', vendorKeycloakId],
    queryFn: async () => {
      const detail = await getVendorDetailAnalytics(vendorKeycloakId);
      return {
        revenue: detail.revenue.map((point) => ({
          name: point.name ?? point.date ?? '—',
          value: point.revenue,
        })),
        orders: detail.orders.map((point) => ({
          name: point.name ?? point.date ?? '—',
          value: point.orders,
        })),
        topProducts: detail.topProducts.map((product) => ({
          name: product.name,
          sales: product.sales,
          revenue: product.revenue,
        })),
        summary: detail.summary,
      };
    },
    enabled: !!vendorKeycloakId,
  });
}

export function useRevenueReport() {
  return useQuery({
    queryKey: ['analytics', 'admin', 'revenue-report'],
    queryFn: () => getAdminRevenueReport(),
  });
}

export function useVendorReport() {
  return useQuery({
    queryKey: ['analytics', 'admin', 'top-vendors', 10],
    queryFn: async () => {
      const topVendors = await getTopVendors(10);
      return {
        topVendors: topVendors.map((vendor) => ({
          id: vendor.vendorId,
          name: formatVendorLabel(vendor.vendorId),
          revenue: vendor.revenue,
          orders: vendor.orders,
          products: vendor.itemsSold,
          rating: '—',
        })),
        newVendors: 0,
        activeVendors: 0,
        suspendedVendors: 0,
      };
    },
  });
}

export function useFlashSales() {
  return useQuery({
    queryKey: ['marketplace', 'flash-sales'],
    queryFn: () => marketplaceService.getFlashSales(),
  });
}

export function useVouchers() {
  return useQuery({
    queryKey: ['marketplace', 'vouchers'],
    queryFn: () => marketplaceService.getVouchers(),
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['marketplace', 'campaigns'],
    queryFn: () => marketplaceService.getCampaigns(),
  });
}
