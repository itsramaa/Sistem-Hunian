import { useAuth } from "@/features/auth/hooks/useAuth";
import { EarlyTerminationReviewDialog } from "@/features/contracts/components/EarlyTerminationReviewDialog";
import { EarlyTerminationsList } from "@/features/contracts/components/EarlyTerminationsList";
import { MoveOutsFilters } from "@/features/contracts/components/MoveOutsFilters";
import { MoveOutsTable } from "@/features/contracts/components/MoveOutsTable";
import { useMerchantMoveOuts } from "@/features/contracts/hooks/useMerchantMoveOuts";
import { EarlyTerminationRequest, MoveOutNotice } from "@/features/contracts/types";
import { VacancyDashboard } from "@/features/dashboard/components/VacancyDashboard";
import { MoveOutInspectionForm } from "@/features/properties/components/MoveOutInspectionForm";
import { ScheduleInspectionDialog } from "@/features/properties/components/ScheduleInspectionDialog";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
import { TabsPageSkeleton } from "@/shared/components/ui/PageSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { differenceInDays } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, DoorOpen, Home, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 10;

const MerchantMoveOuts = () => {
  const { merchant } = useAuth();
  const navigate = useNavigate();
  const [selectedNotice, setSelectedNotice] = useState<MoveOutNotice | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [inspectionFormOpen, setInspectionFormOpen] = useState(false);
  const [earlyTermDialogOpen, setEarlyTermDialogOpen] = useState(false);
  const [selectedEarlyTerm, setSelectedEarlyTerm] = useState<EarlyTerminationRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { setUpcomingPage(1); setCompletedPage(1); }, [debouncedSearch]);

  const { moveOutNotices, inspections, earlyTermRequests, tenantProfiles, isLoading, refetch } = useMerchantMoveOuts(merchant?.id);

  const upcomingMoveOuts = useMemo(() => moveOutNotices?.filter(
    (n) => n.status !== "completed" && differenceInDays(new Date(n.intended_move_out_date), new Date()) >= 0
  ) || [], [moveOutNotices]);

  const completedMoveOuts = useMemo(() => moveOutNotices?.filter((n) => n.status === "completed") || [], [moveOutNotices]);

  const filteredUpcoming = useMemo(() => upcomingMoveOuts.filter(n => 
    n.contract?.unit?.unit_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    n.contract?.unit?.property?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    tenantProfiles?.[n.tenant_user_id]?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [upcomingMoveOuts, debouncedSearch, tenantProfiles]);

  const paginatedUpcoming = useMemo(() => {
    const start = (upcomingPage - 1) * ITEMS_PER_PAGE;
    return filteredUpcoming.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUpcoming, upcomingPage]);

  const filteredCompleted = useMemo(() => completedMoveOuts.filter(n => 
    n.contract?.unit?.unit_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    n.contract?.unit?.property?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    tenantProfiles?.[n.tenant_user_id]?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [completedMoveOuts, debouncedSearch, tenantProfiles]);

  const paginatedCompleted = useMemo(() => {
    const start = (completedPage - 1) * ITEMS_PER_PAGE;
    return filteredCompleted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCompleted, completedPage]);

  const handleScheduleInspection = (notice: MoveOutNotice) => { setSelectedNotice(notice); setScheduleDialogOpen(true); };
  const handleConductInspection = (notice: MoveOutNotice) => { setSelectedNotice(notice); setInspectionFormOpen(true); };
  const handleReviewEarlyTerm = (request: EarlyTerminationRequest) => { setSelectedEarlyTerm(request); setEarlyTermDialogOpen(true); };

  const handleBulkProcess = () => {
    const ids = Array.from(selectedIds).join(',');
    navigate(`/merchant/move-outs/bulk?ids=${ids}`);
  };

  if (isLoading) return <TabsPageSkeleton statsCount={4} />;

  return (
    <div className="space-y-6">
      <PageHeader icon={DoorOpen} title="Pindah Keluar" description="Kelola pemberitahuan pindah keluar dan unit kosong" />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} title="Mendatang" value={upcomingMoveOuts.length} accentColor="hsl(var(--warning))" index={0} />
        <StatCard icon={AlertTriangle} title="Perlu Persetujuan" value={earlyTermRequests?.length || 0} accentColor="hsl(var(--destructive))" index={1} />
        <StatCard icon={CheckCircle2} title="Selesai" value={completedMoveOuts.length} accentColor="hsl(var(--success))" index={2} />
        <StatCard icon={Users} title="Total Pemberitahuan" value={moveOutNotices?.length || 0} accentColor="hsl(var(--primary))" index={3} />
      </div>

      <MoveOutsFilters searchTerm={searchQuery} onSearchChange={setSearchQuery} />

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="bg-muted/50 backdrop-blur-sm rounded-full p-1 border border-border/40">
          <TabsTrigger value="upcoming" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4" />Mendatang ({filteredUpcoming.length})
          </TabsTrigger>
          <TabsTrigger value="pending-approval" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <AlertTriangle className="h-4 w-4" />Persetujuan ({earlyTermRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CheckCircle2 className="h-4 w-4" />Selesai ({filteredCompleted.length})
          </TabsTrigger>
          <TabsTrigger value="vacancies" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Home className="h-4 w-4" />Unit Kosong
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <MoveOutsTable type="upcoming" notices={paginatedUpcoming} inspections={inspections} tenantProfiles={tenantProfiles} onScheduleInspection={handleScheduleInspection} onConductInspection={handleConductInspection} page={upcomingPage} totalPages={Math.ceil(filteredUpcoming.length / ITEMS_PER_PAGE)} totalNotices={filteredUpcoming.length} onPageChange={setUpcomingPage} itemsPerPage={ITEMS_PER_PAGE} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
        </TabsContent>

        <TabsContent value="pending-approval" className="space-y-4">
          <EarlyTerminationsList requests={earlyTermRequests || []} onReview={handleReviewEarlyTerm} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <MoveOutsTable type="completed" notices={paginatedCompleted} inspections={inspections} tenantProfiles={tenantProfiles} onScheduleInspection={handleScheduleInspection} onConductInspection={handleConductInspection} page={completedPage} totalPages={Math.ceil(filteredCompleted.length / ITEMS_PER_PAGE)} totalNotices={filteredCompleted.length} onPageChange={setCompletedPage} itemsPerPage={ITEMS_PER_PAGE} />
        </TabsContent>

        <TabsContent value="vacancies"><VacancyDashboard /></TabsContent>
      </Tabs>

      {/* Bulk Action Bar */}
      {selectedIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-full px-6 py-3">
          <span className="text-sm font-medium">{selectedIds.size} dipilih</span>
          <Button size="sm" onClick={handleBulkProcess} className="rounded-full">
            <DoorOpen className="h-4 w-4 mr-2" />
            Proses Pindah Keluar ({selectedIds.size})
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="rounded-full">
            <X className="h-4 w-4 mr-1" />
            Batal
          </Button>
        </div>
      )}

      <ScheduleInspectionDialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen} notice={selectedNotice} onScheduled={() => { refetch(); setScheduleDialogOpen(false); }} />
      <MoveOutInspectionForm open={inspectionFormOpen} onOpenChange={setInspectionFormOpen} notice={selectedNotice} onCompleted={() => { refetch(); setInspectionFormOpen(false); }} />
      <EarlyTerminationReviewDialog open={earlyTermDialogOpen} onOpenChange={setEarlyTermDialogOpen} request={selectedEarlyTerm} onReviewed={() => { refetch(); setEarlyTermDialogOpen(false); }} />
    </div>
  );
};

export default MerchantMoveOuts;
