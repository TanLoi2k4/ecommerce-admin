import { cn } from '../../utils/cn';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  type?: 'card' | 'table' | 'text' | 'avatar';
}

export function SkeletonLoader({ className, count = 1, type = 'text' }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={cn('animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700 p-6', className)}>
            <div className="h-4 w-1/3 rounded bg-gray-300 dark:bg-gray-600 mb-4" />
            <div className="h-8 w-1/2 rounded bg-gray-300 dark:bg-gray-600 mb-2" />
            <div className="h-4 w-2/3 rounded bg-gray-300 dark:bg-gray-600" />
          </div>
        );
      case 'table':
        return (
          <div className={cn('animate-pulse', className)}>
            <div className="h-10 rounded-t-lg bg-gray-200 dark:bg-gray-700 mb-2" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 mb-1" />
            ))}
          </div>
        );
      case 'avatar':
        return (
          <div className={cn('animate-pulse rounded-full bg-gray-200 dark:bg-gray-700', className)} />
        );
      default:
        return (
          <div className={cn('animate-pulse rounded bg-gray-200 dark:bg-gray-700', className)} />
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  );
}
