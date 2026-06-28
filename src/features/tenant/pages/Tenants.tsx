import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProperties } from "@/features/properties/hooks/useProperties";
import { DataCard } from "@/shared/components/DataCard";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useToast } from "@/shared/hooks/use-toast";
import { useIsMobile } from "@/shared/hooks/useBreakpoint";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckoutForm } from "../components/CheckoutForm";
import { TenantForm } from "../components/TenantForm";
import {
  useActiveTenants,
  useCheckoutTenant,
  useCreateTenant,
  useTenantHistory,
  useUpdateTenant,
} from "../hooks/useTenants";
import { Tenant } from "../types";

export default function TenantsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isOperator = role === "operator";
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active");
  const [page, setPage] = useState(1);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [confirmTenantPayload, setConfirmTenantPayload] = useState<any>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const debouncedSearch = useDebounce(search, 300);

  const limit = 20;
  const { data: activeData, isLoading: activeLoading } = useActiveTenants(
    page,
    limit,
    propertyFilter || undefined,
  );
  const { data: historyData, isLoading: historyLoading } = useTenantHistory(
    page,
    limit,
    propertyFilter || undefined,
  );
  const { data: propsData } = useProperties("", 1, 100);

  const createMutation = useCreateTenant();
  const updateMutation = useUpdateTenant();
  const checkoutMutation = useCheckoutTenant();

  const isActive = tab === "active";
  const rawData = isActive ? activeData : historyData;
  const isLoading = isActive ? activeLoading : historyLoading;
  const allTenants: Tenant[] = rawData?.tenants ?? [];
  const tenants = debouncedSearch
    ? allTenants.filter(
        (t) =>
          t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          t.room_number?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : allTenants;
  const total = rawData?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const properties = propsData?.properties ?? [];

  const handleCreate = async (payload: any) => {
    // Tahan payload — tampilkan konfirmasi dulu
    setConfirmTenantPayload(payload);
    setFormOpen(false);
  };

  const handleConfirmCreate = async () => {
    if (!confirmTenantPayload) return;
    try {
      await createMutation.mutateAsync(confirmTenantPayload);
      setConfirmTenantPayload(null);
      toast({
        title: "Penghuni berhasil ditambahkan",
        description: "Data penghuni baru telah disimpan ke sistem.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menambahkan penghuni",
        description: getApiErrorMessage(err),
      });
      setConfirmTenantPayload(null);
    }
  };
  const handleCheckout = async (check_out_date: string) => {
    if (!selectedTenant) return;
    try {
      await checkoutMutation.mutateAsync({
        id: selectedTenant.id,
        check_out_date,
      });
      setCheckoutOpen(false);
      setSelectedTenant(null);
      toast({
        title: "Checkout berhasil",
        description: `${selectedTenant.name} telah berhasil di-checkout.`,
      });
    } catch (err) {
      const msg = getApiErrorMessage(err);
      // Deteksi pesan tunggakan dari backend untuk tampilkan pesan yang lebih jelas
      const isTunggakan =
        msg.toLowerCase().includes("tunggak") ||
        msg.toLowerCase().includes("unpaid") ||
        msg.toLowerCase().includes("belum lunas") ||
        msg.toLowerCase().includes("outstanding");
      toast({
        variant: "destructive",
        title: "Gagal melakukan checkout",
        description: isTunggakan
          ? "Penghuni masih memiliki tunggakan pembayaran yang belum lunas. Selesaikan seluruh pembayaran sebelum checkout."
          : msg,
      });
    }
  };

  const handleUpdate = async (payload: any) => {
    if (!selectedTenant) return;
    try {
      await updateMutation.mutateAsync({ id: selectedTenant.id, payload });
      setEditOpen(false);
      setSelectedTenant(null);
      toast({ title: "Data penghuni berhasil diperbarui" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui penghuni",
        description: getApiErrorMessage(err),
      });
    }
  };

  const fmt = (d: string) => {
    try {
      return format(new Date(d), "dd MMM yyyy", { locale: localeId });
    } catch {
      return d;
    }
  };

  const getDaysRemaining = (check_in_date: string, rental_duration: number) => {
    const masuk = new Date(check_in_date);
    const berakhir = new Date(masuk);
    berakhir.setMonth(berakhir.getMonth() + rental_duration);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    berakhir.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (berakhir.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  };

  const getContractBadge = (t: Tenant) => {
    if (t.status !== "active") return null;
    const days = getDaysRemaining(t.check_in_date, t.rental_duration);
    if (days <= 0) {
      return (
        <Badge variant="destructive" className="rounded-full text-xs ml-1">
          Kontrak Habis
        </Badge>
      );
    }
    if (days <= 30) {
      return (
        <Badge className="rounded-full text-xs ml-1 bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400">
          Habis {days} hari
        </Badge>
      );
    }
    return null;
  };

  const Pagination = () =>
    totalPages > 1 ? (
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <span>
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs">
            {page}/{totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-5 w-full max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Penghuni</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Data penghuni dan histori hunian
          </p>
        </div>
        {isOperator && (
          <Button
            onClick={() => setFormOpen(true)}
            className="shrink-0 gap-2 rounded-xl min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Tambah Penghuni
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-filter-bar space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama atau kamar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-xl h-11 w-full"
          />
        </div>
        <Select
          value={propertyFilter}
          onValueChange={(v) => {
            setPropertyFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="rounded-xl h-10 w-full">
            <SelectValue placeholder="Semua properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Semua properti</SelectItem>
            {properties.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.property_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(1);
        }}
      >
        <TabsList className="rounded-xl">
          <TabsTrigger value="active" className="rounded-lg gap-2">
            <Users className="h-4 w-4" /> Penghuni Aktif
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2">
            <History className="h-4 w-4" /> Histori
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Memuat...</span>
            </div>
          ) : tenants.length === 0 ? (
            <EmptyState
              icon={Users}
              title={
                isActive
                  ? "Belum ada penghuni aktif"
                  : "Belum ada histori penghuni"
              }
              description={
                isActive
                  ? "Tambah penghuni untuk kamar yang tersedia."
                  : "Histori penghuni akan muncul setelah ada yang checkout."
              }
              action={
                isActive
                  ? {
                      label: "Tambah Penghuni",
                      onClick: () => setFormOpen(true),
                      icon: Plus,
                    }
                  : undefined
              }
            />
          ) : isMobile ? (
            <div className="space-y-3">
              {tenants.map((t) => (
                <DataCard
                  key={t.id}
                  onClick={() => navigate(`/dashboard/tenants/${t.id}`)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1">
                          <p className="font-semibold text-sm truncate">
                            {t.name}
                          </p>
                          {getContractBadge(t)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Kamar {t.room_number} · {t.property_name}
                        </p>
                      </div>
                      <Badge
                        variant={
                          t.status === "active" ? "default" : "secondary"
                        }
                        className="rounded-full shrink-0 text-xs"
                      >
                        {t.status === "active" ? "Aktif" : "Checkout"}
                      </Badge>
                    </div>
                  }
                  fields={[
                    ...(!isActive && t.check_out_date
                      ? [
                          {
                            label: "Tanggal Keluar",
                            value: fmt(t.check_out_date),
                          },
                        ]
                      : []),
                  ]}
                />
              ))}
              <Pagination />
            </div>
          ) : (
            <>
              <div className="glass-table overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                      <TableHead className="font-semibold text-xs uppercase">
                        Nama
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase">
                        Kamar
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase">
                        Properti
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase">
                        Tanggal Masuk
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase text-right">
                        Durasi
                      </TableHead>
                      {!isActive && (
                        <TableHead className="font-semibold text-xs uppercase">
                          Tanggal Keluar
                        </TableHead>
                      )}
                      <TableHead className="font-semibold text-xs uppercase text-right">
                        Status
                      </TableHead>
                      {isActive && (
                        <TableHead className="font-semibold text-xs uppercase text-right">
                          Aksi
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((t) => (
                      <TableRow
                        key={t.id}
                        className="group hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => navigate(`/dashboard/tenants/${t.id}`)}
                      >
                        <TableCell className="text-sm font-medium">
                          <div className="flex items-center flex-wrap gap-1">
                            {t.name}
                            {getContractBadge(t)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.room_number}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.property_name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {fmt(t.check_in_date)}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {t.rental_duration} bln
                        </TableCell>
                        {!isActive && (
                          <TableCell className="text-sm">
                            {t.check_out_date ? fmt(t.check_out_date) : "—"}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              t.status === "active" ? "default" : "secondary"
                            }
                            className="rounded-full"
                          >
                            {t.status === "active" ? "Aktif" : "Checkout"}
                          </Badge>
                        </TableCell>
                        {isActive && isOperator && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTenant(t);
                                  setEditOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTenant(t);
                                  setCheckoutOpen(true);
                                }}
                              >
                                <LogOut className="h-3.5 w-3.5" /> Checkout
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination />
            </>
          )}
        </TabsContent>
      </Tabs>

      {formOpen && (
        <TenantForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}
      {editOpen && selectedTenant && (
        <TenantForm
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setSelectedTenant(null);
          }}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          initialData={{
            name: selectedTenant.name,
            identity_number: selectedTenant.identity_number,
            phone_number: selectedTenant.phone_number,
            check_in_date: selectedTenant.check_in_date.split("T")[0],
            rental_duration: selectedTenant.rental_duration,
          }}
        />
      )}
      {checkoutOpen && selectedTenant && (
        <CheckoutForm
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          tenantName={selectedTenant.name}
          roomNumber={selectedTenant.room_number}
          onSubmit={handleCheckout}
          isLoading={checkoutMutation.isPending}
        />
      )}

      {/* Konfirmasi tambah penghuni */}
      <Dialog
        open={!!confirmTenantPayload}
        onOpenChange={(v) => !v && setConfirmTenantPayload(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Tambah Penghuni</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Konfirmasi penambahan penghuni baru. Status kamar akan berubah
                  menjadi <strong>Terisi</strong>.
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmTenantPayload(null)}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmCreate}
              disabled={createMutation.isPending}
              className="gap-2 rounded-xl"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Ya, Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
