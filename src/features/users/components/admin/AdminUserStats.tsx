
import { AdminUser } from "@/features/users/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface AdminUserStatsProps {
  users: AdminUser[];
  className?: string;
}

export function AdminUserStats({ users, className }: AdminUserStatsProps) {
  const activeAdmins = users.filter(a => a.status === "active").length;
  // In a real app, security alerts would come from a different source or be a property of the user/audit log
  const securityAlerts = 0; 

  return (
    <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-3", className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{users.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          <ShieldCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {activeAdmins}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
          <ShieldAlert className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{securityAlerts}</div>
          <p className="text-xs text-muted-foreground">
            {securityAlerts === 0 ? "No recent security incidents" : `${securityAlerts} incidents detected`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
