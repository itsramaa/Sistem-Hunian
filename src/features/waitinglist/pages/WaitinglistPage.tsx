import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { waitinglistApi } from '@/features/waitinglist/api/waitinglistApi';
import { WaitinglistTable } from '@/features/waitinglist/components/WaitinglistTable';
import { AddToWaitinglistModal } from '@/features/waitinglist/components/AddToWaitinglistModal';
import { Waitinglist, CreateWaitinglistRequest } from '@/features/waitinglist/types/waitinglist';

export default function WaitinglistPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Waitinglist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await waitinglistApi.listWaitinglist();
      setItems(response.data ?? []);
    } catch (err) {
      console.error('Failed to fetch waiting list:', err);
      toast({
        title: 'Gagal memuat data',
        description: 'Tidak dapat mengambil data waiting list. Coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCreate = async (data: CreateWaitinglistRequest) => {
    setIsSubmitting(true);
    try {
      await waitinglistApi.createWaitinglist(data);
      toast({
        title: 'Berhasil ditambahkan',
        description: 'Tenant berhasil ditambahkan ke waiting list.',
      });
      setShowModal(false);
      await fetchList();
    } catch (err) {
      console.error('Failed to create waiting list entry:', err);
      toast({
        title: 'Gagal menambahkan',
        description: 'Tidak dapat menambahkan ke waiting list. Coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await waitinglistApi.deleteWaitinglist(id);
      toast({
        title: 'Berhasil dihapus',
        description: 'Data waiting list berhasil dihapus.',
      });
      await fetchList();
    } catch (err) {
      console.error('Failed to delete waiting list entry:', err);
      toast({
        title: 'Gagal menghapus',
        description: 'Tidak dapat menghapus data waiting list. Coba lagi.',
        variant: 'destructive',
      });
    }
  };

  const tenantId = user?.id ?? '';

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={ClipboardList}
        title="Waiting List"
        description="Kelola daftar tunggu tenant untuk properti yang belum tersedia."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchList}
          disabled={isLoading}
          className="rounded-xl gap-2"
          aria-label="Refresh waiting list"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className="rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
          aria-label="Tambah ke waiting list"
        >
          <Plus className="h-4 w-4" />
          Tambah ke Waiting List
        </Button>
      </PageHeader>

      <WaitinglistTable
        items={items}
        isLoading={isLoading}
        onDelete={handleDelete}
      />

      <AddToWaitinglistModal
        open={showModal}
        onOpenChange={setShowModal}
        tenantId={tenantId}
        onSubmit={handleCreate}
        isLoading={isSubmitting}
      />
    </div>
  );
}
