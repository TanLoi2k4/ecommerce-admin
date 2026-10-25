import {
  addMonths,
  addWeeks,
  addYears,
  endOfISOWeek,
  endOfMonth,
  endOfYear,
  format,
  getISOWeek,
  getISOWeekYear,
  isAfter,
  parseISO,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import type { AnalyticsPeriod } from '../types/analytics';

export const ANALYTICS_PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'WEEK', label: 'Theo tuần' },
  { value: 'MONTH', label: 'Theo tháng' },
  { value: 'YEAR', label: 'Theo năm' },
];

export function todayAnchor(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function shiftAnchor(anchor: string, period: AnalyticsPeriod, delta: number): string {
  const date = parseISO(anchor);
  if (period === 'WEEK') return format(addWeeks(date, delta), 'yyyy-MM-dd');
  if (period === 'MONTH') return format(addMonths(startOfMonth(date), delta), 'yyyy-MM-dd');
  if (period === 'YEAR') return format(addYears(startOfYear(date), delta), 'yyyy-MM-dd');
  return anchor;
}

export function canGoForward(anchor: string, period: AnalyticsPeriod): boolean {
  if (period === 'ALL') return false;
  const next = parseISO(shiftAnchor(anchor, period, 1));
  const today = new Date();
  if (period === 'WEEK') return !isAfter(startOfISOWeek(next), startOfISOWeek(today));
  if (period === 'MONTH') return !isAfter(startOfMonth(next), startOfMonth(today));
  return !isAfter(startOfYear(next), startOfYear(today));
}

export function monthInputValue(anchor: string): string {
  return format(parseISO(anchor), 'yyyy-MM');
}

export function yearInputValue(anchor: string): string {
  return format(parseISO(anchor), 'yyyy');
}

export function formatPeriodLabel(period: AnalyticsPeriod, anchor: string): string {
  if (period === 'ALL') return 'Tất cả thời gian';
  const date = parseISO(anchor);
  if (period === 'WEEK') {
    const start = startOfISOWeek(date);
    const end = endOfISOWeek(date);
    return `Tuần ${getISOWeek(start)}/${getISOWeekYear(start)} (${format(start, 'dd/MM')} – ${format(end, 'dd/MM/yyyy')})`;
  }
  if (period === 'MONTH') {
    return `Tháng ${format(date, 'M')}/${format(date, 'yyyy')}`;
  }
  return `Năm ${format(date, 'yyyy')}`;
}

export function formatGrowthLabel(period: AnalyticsPeriod): string {
  if (period === 'WEEK') return 'so với tuần trước';
  if (period === 'MONTH') return 'so với tháng trước';
  if (period === 'YEAR') return 'so với năm trước';
  return 'so với kỳ trước';
}

export function periodBounds(
  period: AnalyticsPeriod,
  anchor: string
): { from: string | null; to: string | null } {
  if (period === 'ALL') return { from: null, to: null };
  const date = parseISO(anchor);
  if (period === 'WEEK') {
    return {
      from: format(startOfISOWeek(date), 'yyyy-MM-dd'),
      to: format(endOfISOWeek(date), 'yyyy-MM-dd'),
    };
  }
  if (period === 'MONTH') {
    return {
      from: format(startOfMonth(date), 'yyyy-MM-dd'),
      to: format(endOfMonth(date), 'yyyy-MM-dd'),
    };
  }
  return {
    from: format(startOfYear(date), 'yyyy-MM-dd'),
    to: format(endOfYear(date), 'yyyy-MM-dd'),
  };
}

export function toPeriodParams(period: AnalyticsPeriod, anchor: string) {
  return {
    period,
    ...(period !== 'ALL' ? { anchor } : {}),
  };
}
