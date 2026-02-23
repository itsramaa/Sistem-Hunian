import { useAuth } from '@/features/auth/hooks/useAuth';
import { AppRole } from '@/features/auth/types/auth';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Badge } from '@/shared/components/ui/badge';
import { Building2, ChevronDown, Store, User, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const roleConfig: Record<AppRole, { label: string; icon: typeof Building2; path: string; color: string }> = {
  merchant: { label: 'Merchant', icon: Building2, path: '/merchant', color: 'bg-primary/10 text-primary' },
  vendor: { label: 'Vendor', icon: Wrench, path: '/vendor', color: 'bg-success/10 text-success' },
  tenant: { label: 'Tenant', icon: Store, path: '/tenant', color: 'bg-accent/10 text-accent-foreground' },
  admin: { label: 'Admin', icon: User, path: '/admin', color: 'bg-destructive/10 text-destructive' },
};

export function RoleSwitcher() {
  const { roles, activeRole, switchRole } = useAuth();
  const navigate = useNavigate();

  if (roles.length <= 1) return null;

  const current = activeRole ? roleConfig[activeRole] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
          {current && <current.icon className="h-4 w-4" />}
          <span className="text-xs">{current?.label || 'Role'}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl w-48">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Switch Role</div>
        <DropdownMenuSeparator />
        {roles.map(r => {
          const config = roleConfig[r];
          const isActive = r === activeRole;
          return (
            <DropdownMenuItem
              key={r}
              className="gap-2 rounded-lg"
              onClick={() => {
                switchRole(r);
                navigate(config.path);
              }}
            >
              <config.icon className="h-4 w-4" />
              <span>{config.label}</span>
              {isActive && <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">Aktif</Badge>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
