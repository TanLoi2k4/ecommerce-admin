import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  FolderTree,
  ShoppingCart,
  Truck,
  CreditCard,
  Tag,
  BarChart3,
  MessageSquare,
  Shield,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

interface NavChild {
  label: string;
  path: string;
  superAdminOnly?: boolean;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', icon: LayoutDashboard, path: '/' },
  { label: 'Người dùng', icon: Users, path: '/users' },
  { label: 'Nhà bán', icon: Store, path: '/vendors' },
  { label: 'Sản phẩm', icon: Package, path: '/products' },
  { label: 'Danh mục', icon: FolderTree, path: '/categories' },
  {
    label: 'Đơn hàng',
    icon: ShoppingCart,
    children: [
      { label: 'Tổng quan đơn hàng', path: '/orders' },
      { label: 'Danh sách đơn hàng', path: '/orders/list' },
      { label: 'Trả hàng & hoàn tiền', path: '/orders/refunds' },
    ],
  },
  {
    label: 'Vận chuyển',
    icon: Truck,
    children: [
      { label: 'Danh sách vận đơn', path: '/shipments' },
      { label: 'Cấu hình đơn vị VC', path: '/shipments/carriers', superAdminOnly: true },
    ],
  },
  {
    label: 'Thanh toán',
    icon: CreditCard,
    children: [
      { label: 'Giao dịch khách', path: '/payments/transactions' },
      { label: 'Chi trả nhà bán', path: '/payments/payout-approvals' },
      { label: 'Công nợ hai chiều', path: '/payments/payables' },
      { label: 'Xác minh ngân hàng', path: '/payments/payouts' },
    ],
  },
  { label: 'Khuyến mãi', icon: Tag, path: '/promotions/vouchers' },
  {
    label: 'Phân tích',
    icon: BarChart3,
    children: [
      { label: 'Phân tích doanh thu', path: '/reports/revenue' },
      { label: 'Phân tích nhà bán', path: '/reports/vendors' },
      { label: 'Phân tích sản phẩm', path: '/reports/products' },
    ],
  },
  {
    label: 'Liên lạc',
    icon: MessageSquare,
    children: [
      { label: 'Thông báo', path: '/communication/notifications' },
      { label: 'Báo cáo', path: '/reports/complaints' },
    ],
  },
  {
    label: 'Bảo mật',
    icon: Shield,
    children: [
      { label: 'Nhật ký', path: '/security/logs' },
      { label: 'Quản trị viên', path: '/security/admin-users', superAdminOnly: true },
    ],
  },
];

function getActiveChildPath(children: NavChild[], pathname: string): string | null {
  let bestMatch: string | null = null;
  for (const { path } of children) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      if (!bestMatch || path.length > bestMatch.length) {
        bestMatch = path;
      }
    }
  }
  return bestMatch;
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Đơn hàng']);
  const location = useLocation();

  const visibleNavItems = navItems
    .map((item) => {
      if (!item.children) return item;
      const children = item.children.filter((child) => !child.superAdminOnly || user?.isSuperAdmin);
      if (children.length === 0) return null;
      if (children.length === 1) {
        return { ...item, path: children[0].path, children: undefined };
      }
      return { ...item, children };
    })
    .filter((item): item is NavItem => item !== null);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <>
      {!sidebarCollapsed && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800',
          sidebarCollapsed ? 'w-20' : 'w-72'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          {!sidebarCollapsed ? (
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center group-hover:shadow-lg transition-shadow">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent leading-tight">
                  Avora
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  Cổng Quản Trị
                </span>
              </div>
            </Link>
          ) : (
            <Link to="/" className="mx-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center hover:shadow-lg transition-shadow">
                <Store className="w-6 h-6 text-white" />
              </div>
            </Link>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
        >
          {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.label);
            const hasChildren = !!item.children;
            const activeChildPath = item.children
              ? getActiveChildPath(item.children, location.pathname)
              : null;

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className="sidebar-link w-full"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm">{item.label}</span>
                        <ChevronDown
                          className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={item.path!}
                    end={item.path === '/'}
                    className={({ isActive: navActive }) =>
                      cn('sidebar-link text-sm', navActive && 'active')
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                )}

                {hasChildren && isExpanded && !sidebarCollapsed && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
                    {item.children!.map((child) => {
                      const isChildActive = activeChildPath === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                            isChildActive
                              ? 'text-primary-600 dark:text-primary-400 font-medium'
                              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                          )}
                        >
                          {child.superAdminOnly && <UserCog className="h-3.5 w-3.5" />}
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!sidebarCollapsed && user && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                {user.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name || 'Quản trị viên'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
