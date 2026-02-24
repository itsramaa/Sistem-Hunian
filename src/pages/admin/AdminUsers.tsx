import { AdminUserFilters } from "@/features/users/components/admin/AdminUserFilters";
import { AdminUserStats } from "@/features/users/components/admin/AdminUserStats";
import { AdminUsersTable } from "@/features/users/components/admin/AdminUsersTable";
import { InviteAdminDialog } from "@/features/users/components/admin/InviteAdminDialog";
import { useAdminUsers } from "@/features/users/hooks/useAdminUsers";
import { AdminUser } from "@/features/users/types/admin";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUsers() {
  const { data: admins = [], isLoading } = useAdminUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      admin.email.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesRole = roleFilter === "all" || admin.role === roleFilter;
    const matchesStatus = statusFilter === "all" || admin.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const handleAddAdmin = (newAdminData: Omit<AdminUser, "id" | "status" | "lastLogin">) => {
    // In a real app, this would call a mutation to invite the user via Supabase Auth
    toast.info("Untuk menambahkan admin baru, silakan gunakan Dashboard Supabase atau implementasikan Edge Function untuk undangan yang aman.");
    setIsDialogOpen(false);
  };

  const handleDeleteAdmin = (id: string) => {
    // In a real app, this would call a mutation to remove the admin role
    toast.info("Untuk menghapus admin, silakan gunakan Dashboard Supabase atau implementasikan Edge Function untuk manajemen peran yang aman.");
  };

  const handleEmailUser = (email: string) => {
    toast.info(`Membuka klien email untuk ${email}`);
    window.location.href = `mailto:${email}`;
  };

  if (isLoading) {
    return (
      <AdminLayout
        title="Manajemen Admin"
        description="Kelola akses dan izin tim internal."
      >
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Manajemen Admin"
      description="Kelola akses dan izin tim internal."
      actions={
        <>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Undang Admin
          </Button>
          <InviteAdminDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen} 
            onInvite={handleAddAdmin} 
          />
        </>
      }
    >
      <div className="space-y-6">
        <AdminUserStats users={admins} />

        <div className="space-y-4">
          <AdminUserFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onResetFilters={handleResetFilters}
          />

          <AdminUsersTable
            users={filteredAdmins}
            onDelete={handleDeleteAdmin}
            onEmail={handleEmailUser}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
