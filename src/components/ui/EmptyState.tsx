import { Package, Search, Inbox, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { common } from '../../i18n/common';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'package' | 'search' | 'inbox' | 'alert';
  action?: React.ReactNode;
  className?: string;
}

const iconMap = {
  package: Package,
  search: Search,
  inbox: Inbox,
  alert: AlertCircle,
};

export function EmptyState({
  title = common.noData,
  description = common.noDataDesc,
  icon = 'inbox',
  action,
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
