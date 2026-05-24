import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { SubscriptionTierCard } from "@/features/subscriptions/components/admin/SubscriptionTierCard";
import { SubscriptionTierDialog } from "@/features/subscriptions/components/admin/SubscriptionTierDialog";
import { useSubscriptionStats } from "@/features/subscriptions/hooks/useSubscriptions";
import { useSubscriptionTiers } from "@/features/subscriptions/hooks/useSubscriptionTiers";
import { SubscriptionTier, SubscriptionTierInput } from "@/features/subscriptions/types/subscription-tier";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSubscriptionTiers() {
  const { isLoading: guardLoading } = useAdminGuard();
  const { tiers, isLoading, createTier, updateTier, deleteTier, isCreating, isUpdating, isDeleting } = useSubscriptionTiers();
  const { data: stats } = useSubscriptionStats();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<SubscriptionTier | null>(null);

  const handleOpenDialog = (tier?: SubscriptionTier) => {
    setEditingTier(tier || null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: SubscriptionTierInput) => {
    if (editingTier) {
      updateTier(
        { id: editingTier.id, data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingTier(null);
            toast.success("Tingkatan langganan berhasil diperbarui");
          },
          onError: (err) => toast.error(`Gagal memperbarui tingkatan: ${err.message}`),
        }
      );
    } else {
      createTier(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast.success("Tingkatan langganan berhasil dibuat");
        },
        onError: (err) => toast.error(`Gagal membuat tingkatan: ${err.message}`),
      });
    }
  };

  const handleDeleteClick = (tier: SubscriptionTier) => {
    setTierToDelete(tier);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tierToDelete) {
      deleteTier(tierToDelete.id, {
        onSuccess: () => {
          setDeleteConfirmOpen(false);
          setTierToDelete(null);
          toast.success("Tingkatan langganan berhasil dihapus");
        },
        onError: (err) => toast.error(`Gagal menghapus tingkatan: ${err.message}`),
      });
    }
  };

  if (guardLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Tingkatan Langganan"
      description="Kelola paket langganan merchant dan harga"
      actions={
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Tingkatan Baru
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers?.map((tier) => (
            <SubscriptionTierCard
              key={tier.id}
              tier={tier}
              activeCount={stats?.[tier.name.toLowerCase()] || 0}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </div>

      <SubscriptionTierDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        tier={editingTier}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Hapus Tingkatan Langganan"
        description={`Apakah Anda yakin ingin menghapus "${tierToDelete?.display_name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={isDeleting ? "Menghapus..." : "Hapus Tingkatan"}
        variant="destructive"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
