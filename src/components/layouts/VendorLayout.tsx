import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Wallet, 
  User,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Wrench,
  Package,
  ShoppingCart,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

const vendorMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/vendor' },
  { icon: Package, label: 'Products', href: '/vendor/products' },
  { icon: ShoppingCart, label: 'Orders', href: '/vendor/orders' },
  { icon: Briefcase, label: 'Jobs', href: '/vendor/jobs' },
  { icon: Wallet, label: 'Earnings', href: '/vendor/earnings' },
  { icon: Gift, label: 'Referrals', href: '/vendor/referrals' },
  { icon: User, label: 'Profile', href: '/vendor/profile' },
  { icon: Settings, label: 'Settings', href: '/vendor/settings' },
];

interface VendorLayoutProps {
  children: React.ReactNode;
}

export function VendorLayout({ children }: VendorLayoutProps) {
  const { signOut, profile, vendor } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
              <Wrench className="w-4 h-4 text-success-foreground" />
            </div>
            <span className="font-display font-semibold">SiHuni Vendor</span>
          </div>
        </div>
        <NotificationsDropdown />
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        'hidden lg:block',
        mobileOpen && 'block'
      )}>
        {/* Logo */}
        <div className={cn(
          'h-16 flex items-center border-b border-border px-4',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-success-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-foreground">SiHuni Vendor</span>
          )}
        </div>

        {/* Vendor Info */}
        {!collapsed && vendor && (
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium truncate">{vendor.business_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={vendor.verification_status === 'verified' ? 'default' : 'secondary'} className="text-xs">
                {vendor.verification_status}
              </Badge>
              {vendor.rating && (
                <Badge variant="outline" className="text-xs">
                  ⭐ {vendor.rating.toFixed(1)}
                </Badge>
              )}
            </div>
            {vendor.service_categories && vendor.service_categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {vendor.service_categories.slice(0, 2).map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs capitalize">
                    {cat}
                  </Badge>
                ))}
                {vendor.service_categories.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{vendor.service_categories.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {vendorMenuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
                collapsed && 'justify-center px-2'
              )}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-border">
          {!collapsed && profile && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium truncate">
                {profile.full_name || profile.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              'w-full text-muted-foreground hover:text-foreground hover:bg-muted',
              collapsed ? 'justify-center px-2' : 'justify-start'
            )}
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
          
          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-card border border-border hover:bg-muted"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'transition-all duration-300 pt-16 lg:pt-0',
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div>
            {/* Breadcrumb or page title can go here */}
          </div>
          <div className="flex items-center gap-4">
            <NotificationsDropdown />
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
