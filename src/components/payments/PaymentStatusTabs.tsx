import { cn } from '../../utils/cn';

interface PaymentStatusTab<T extends string> {
  id: T;
  label: string;
}

interface PaymentStatusTabsProps<T extends string> {
  tabs: PaymentStatusTab<T>[];
  value: T;
  onChange: (id: T) => void;
}

export function PaymentStatusTabs<T extends string>({
  tabs,
  value,
  onChange,
}: PaymentStatusTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            value === tab.id
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
