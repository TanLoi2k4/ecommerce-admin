import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export type MoneyFlowDirection = 'platform-to-vendor' | 'vendor-to-platform';

interface RelatedLink {
  label: string;
  to: string;
}

interface MoneyFlowBannerProps {
  direction: MoneyFlowDirection;
  description?: string;
  links?: RelatedLink[];
}

const COPY: Record<
  MoneyFlowDirection,
  { title: string; defaultDescription: string; tone: 'in' | 'out' }
> = {
  'platform-to-vendor': {
    title: 'Sàn trả tiền cho nhà bán',
    defaultDescription:
      'Doanh thu đơn đã hoàn tất được gom khi nhà bán yêu cầu rút. Duyệt lệnh chi trả để chuyển khoản.',
    tone: 'in',
  },
  'vendor-to-platform': {
    title: 'Nhà bán trả phí cho sàn',
    defaultDescription:
      'Phí hoa hồng được ghi theo đơn, rồi gom thành hóa đơn. Nhà bán thanh toán qua VNPay trên cổng nhà bán.',
    tone: 'out',
  },
};

export function MoneyFlowBanner({ direction, description, links }: MoneyFlowBannerProps) {
  const copy = COPY[direction];
  const Icon = copy.tone === 'in' ? ArrowDownLeft : ArrowUpRight;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center',
        copy.tone === 'in'
          ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20'
          : 'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20'
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          copy.tone === 'in'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{copy.title}</p>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
          {description ?? copy.defaultDescription}
        </p>
      </div>
      {links && links.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
