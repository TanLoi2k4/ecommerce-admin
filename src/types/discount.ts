export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type DiscountStatus = 'scheduled' | 'active' | 'expired' | 'exhausted';

export interface Discount {
  id: number;
  code: string;
  description?: string | null;
  type: DiscountType;
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount?: number | null;
}

export interface DiscountRequest {
  code: string;
  description?: string;
  type: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
}

export interface DiscountListParams {
  page?: number;
  size?: number;
}
