import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
  iconColor?: string;
  iconBgColor?: string;
  comparison?: string;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  iconColor,
  iconBgColor,
  comparison,
}: DashboardCardProps) {
  const isPositive = trend && trend > 0;
  const useBrandIcon = !iconColor && !iconBgColor;

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-400 dark:text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
          {comparison && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{comparison}</p>
          )}
        </div>
        <div
          className={cn(
            'rounded-xl p-3',
            useBrandIcon
              ? 'bg-gradient-to-br from-primary-500/10 to-secondary-500/10 text-primary-500 dark:text-primary-400'
              : cn(iconBgColor, iconColor)
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
