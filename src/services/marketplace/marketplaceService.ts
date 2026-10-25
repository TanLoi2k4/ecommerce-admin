import { emptyList } from './helpers';

export const MARKETPLACE_API_ENABLED = import.meta.env.VITE_MARKETPLACE_API_ENABLED === 'true';

export class MarketplaceApiUnavailableError extends Error {
  constructor() {
    super('Marketplace API is not connected yet');
    this.name = 'MarketplaceApiUnavailableError';
  }
}

function unavailableList<T>(): T[] {
  if (MARKETPLACE_API_ENABLED) {
    throw new MarketplaceApiUnavailableError();
  }
  return emptyList<T>();
}

function unavailableRecord<T extends Record<string, unknown>>(fallback: T): T {
  if (MARKETPLACE_API_ENABLED) {
    throw new MarketplaceApiUnavailableError();
  }
  return fallback;
}

export const marketplaceService = {
  isEnabled: () => MARKETPLACE_API_ENABLED,

  getDashboardStats: async () =>
    unavailableRecord({
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      openTickets: 0,
      revenueGrowth: 0,
      userGrowth: 0,
      orderGrowth: 0,
    }),

  getRevenueChart: async () => unavailableList<{ name: string; revenue: number }>(),

  getUserGrowthChart: async () => unavailableList<{ name: string; users: number; vendors: number }>(),

  getVendorAnalytics: async (_id: string) =>
    unavailableRecord({
      revenue: [],
      orders: [],
      topProducts: [],
    }),

  getRevenueReport: async () =>
    unavailableRecord({
      summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, commissionEarned: 0 },
      chartData: [],
    }),

  getVendorReport: async () =>
    unavailableRecord({
      topVendors: [],
      newVendors: 0,
      activeVendors: 0,
      suspendedVendors: 0,
    }),

  getFlashSales: async () => unavailableList(),

  getVouchers: async () => unavailableList(),

  getCampaigns: async () => unavailableList(),
};
