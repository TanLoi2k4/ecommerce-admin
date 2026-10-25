export function formatCurrency(amount: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDate(date: string | Date | number | null | undefined) {
  const parsed = parseApiDate(date);
  if (!parsed) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_YEAR_MONTH = /^(\d{4})-(\d{2})$/;

/** Chart labels from APIs use ISO dates; show them as Vietnamese day/month/year. */
export function formatChartDateLabel(value: unknown): string {
  const label = typeof value === 'string' ? value : String(value ?? '');
  const dateMatch = ISO_DATE_ONLY.exec(label);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${day}/${month}/${year}`;
  }
  const monthMatch = ISO_YEAR_MONTH.exec(label);
  if (monthMatch) {
    const [, year, month] = monthMatch;
    return `${month}/${year}`;
  }
  return label;
}

export function formatDateTime(date: string | Date | number | null | undefined) {
  const parsed = parseApiDate(date);
  if (!parsed) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

/** Accept ISO strings, Date, or epoch seconds (legacy Jackson timestamps). */
function parseApiDate(date: string | Date | number | null | undefined): Date | null {
  if (date == null || date === '') return null;
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof date === 'number') {
    // Seconds vs milliseconds: values before year ~2001 as ms are almost certainly seconds.
    const parsed = new Date(date < 1e12 ? date * 1000 : date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof date !== 'string') return null;
  if (/^\d+(\.\d+)?$/.test(date.trim())) {
    const n = Number(date);
    const parsed = new Date(n < 1e12 ? n * 1000 : n);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(date: string | Date | null | undefined) {
  const then = parseApiDate(date);
  if (!then) return '—';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return formatDate(date);
}
