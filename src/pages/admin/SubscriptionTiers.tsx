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
            toast.success("Subscription tier updated successfully");
          },
          onError: (err) => toast.error(`Failed to update tier: ${err.message}`),
        }
      );
    } else {
      createTier(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast.success("Subscription tier created successfully");
        },
        onError: (err) => toast.error(`Failed to create tier: ${err.message}`),
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
          toast.success("Subscription tier deleted successfully");
        },
        onError: (err) => toast.error(`Failed to delete tier: ${err.message}`),
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
      title="Subscription Tiers"
      description="Manage merchant subscription packages and pricing"
      actions={
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Tier
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
        title="Delete Subscription Tier"
        description={`Are you sure you want to delete "${tierToDelete?.display_name}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Tier"}
        variant="destructive"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
