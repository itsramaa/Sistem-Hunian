import { AdminUser } from "@/features/users/types/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/utils/utils";
import { Mail, MoreHorizontal, Trash2 } from "lucide-react";

export interface AdminUsersTableProps {
  users: AdminUser[];
  onDelete: (id: string) => void;
  onEmail: (email: string) => void;
}

export function AdminUsersTable({ users, onDelete, onEmail }: AdminUsersTableProps) {
  const getRoleBadge = (role: string, className?: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className={cn("bg-purple-500 hover:bg-purple-600", className)}>Super Admin</Badge>;
      case "admin":
        return <Badge variant="default" className={className}>Admin</Badge>;
      case "moderator":
        return <Badge variant="secondary" className={cn("bg-blue-100 text-blue-800 hover:bg-blue-200", className)}>Moderator</Badge>;
      case "support":
        return <Badge variant="outline" className={className}>Support</Badge>;
      default:
        return <Badge variant="outline" className={className}>{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      active: "bg-success/10 text-success border-success/20",
      inactive: "bg-destructive/10 text-destructive border-destructive/20",
      suspended: "bg-warning/10 text-warning border-warning/20",
      pending: "bg-muted text-muted-foreground",
    };

    return (
      <Badge 
        variant="outline" 
        className={cn(statusStyles[status] || "bg-muted text-muted-foreground")}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden sm:table-cell">Role</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
             <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No admin users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${admin.email}`} />
                      <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{admin.name}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{admin.email}</span>
                      {/* Mobile fallbacks */}
                      <div className="flex gap-1 mt-1 sm:hidden">
                        {getRoleBadge(admin.role, "h-5 px-1.5 text-[10px]")}
                        <div className="h-5 px-1.5 text-[10px]">
                          {getStatusBadge(admin.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{getRoleBadge(admin.role)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {getStatusBadge(admin.status)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{admin.lastLogin}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEmail(admin.email)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive" 
                        onClick={() => onDelete(admin.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
