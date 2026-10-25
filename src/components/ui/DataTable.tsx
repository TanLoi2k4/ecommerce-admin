import { cn } from '../../utils/cn';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  className,
  onRowClick,
  isLoading,
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-10 rounded-t-lg bg-gray-200 dark:bg-gray-700" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-semibold"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'bg-white transition-colors dark:bg-gray-800',
                onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-900 dark:text-gray-100">
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
