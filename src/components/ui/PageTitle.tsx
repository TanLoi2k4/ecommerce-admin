import { DemoDataBadge } from './DemoDataBadge';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  demo?: boolean;
  children?: React.ReactNode;
}

export function PageTitle({ title, subtitle, demo = false, children }: PageTitleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {demo && <DemoDataBadge />}
        </div>
        {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
