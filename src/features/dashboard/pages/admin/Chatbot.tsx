import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { KnowledgeDialog } from "@/features/chatbot/components/admin/KnowledgeDialog";
import { KnowledgeFilters } from "@/features/chatbot/components/admin/KnowledgeFilters";
import { KnowledgeStats } from "@/features/chatbot/components/admin/KnowledgeStats";
import { KnowledgeTable } from "@/features/chatbot/components/admin/KnowledgeTable";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";
import { KnowledgeEntry, KnowledgeFormData } from "@/features/chatbot/types";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 10;

const AdminChatbot = () => {
  const { isLoading: guardLoading } = useAdminGuard();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [page, setPage] = useState(1);

  const {
    knowledge,
    totalCount,
    stats,
    isLoading,
    error,
    refetch,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    toggleActive,
    isCreating,
    isUpdating
  } = useChatbot(page, PAGE_SIZE, debouncedSearch, categoryFilter);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: KnowledgeFormData) => {
    if (editingEntry) {
      updateKnowledge({ id: editingEntry.id, data }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingEntry(null);
        }
      });
    } else {
      createKnowledge(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingEntry(null);
        }
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingEntry(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  if (guardLoading) {
    return (
      <AdminLayout title="Chatbot Knowledge Base" description="Manage FAQ entries and AI chatbot responses">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Basis Pengetahuan Chatbot"
      description="Kelola entri FAQ dan respons chatbot AI"
      actions={
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Entri
        </Button>
      }
    >
      <div className="space-y-6">
        <KnowledgeStats stats={stats} isLoading={isLoading} />

        <KnowledgeFilters
          searchQuery={searchTerm}
          onSearchChange={handleSearchChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={handleCategoryFilterChange}
        />

        <Card>
          <CardContent className="p-0">
            <KnowledgeTable
              data={knowledge}
              isLoading={isLoading}
              error={error}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onEdit={handleEdit}
              onToggleActive={(id, is_active) => toggleActive({ id, is_active })}
              onDelete={deleteKnowledge}
              onRetry={refetch}
            />
          </CardContent>
        </Card>

        <KnowledgeDialog
          open={isDialogOpen}
          onOpenChange={handleOpenChange}
          onSubmit={handleSubmit}
          initialData={editingEntry}
          isLoading={isCreating || isUpdating}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminChatbot;
