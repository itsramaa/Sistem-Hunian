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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { differenceInDays } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Home
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ITEMS_PER_PAGE = 10;

const MerchantMoveOuts = () => {
  const { merchant } = useAuth();
  const [selectedNotice, setSelectedNotice] = useState<MoveOutNotice | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [inspectionFormOpen, setInspectionFormOpen] = useState(false);
  const [earlyTermDialogOpen, setEarlyTermDialogOpen] = useState(false);
  const [selectedEarlyTerm, setSelectedEarlyTerm] = useState<EarlyTerminationRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Pagination state
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);

  // Reset pagination on search change
  useEffect(() => {
    setUpcomingPage(1);
    setCompletedPage(1);
  }, [debouncedSearch]);

  const { 
    moveOutNotices, 
    inspections, 
    earlyTermRequests, 
    tenantProfiles,
    isLoading,
    refetch
  } = useMerchantMoveOuts(merchant?.id);

  const upcomingMoveOuts = useMemo(() => moveOutNotices?.filter(
    (n) => n.status !== "completed" && differenceInDays(new Date(n.intended_move_out_date), new Date()) >= 0
  ) || [], [moveOutNotices]);

  const completedMoveOuts = useMemo(() => moveOutNotices?.filter(
    (n) => n.status === "completed"
  ) || [], [moveOutNotices]);

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

  const handleScheduleInspection = (notice: MoveOutNotice) => {
    setSelectedNotice(notice);
    setScheduleDialogOpen(true);
  };

  const handleConductInspection = (notice: MoveOutNotice) => {
    setSelectedNotice(notice);
    setInspectionFormOpen(true);
  };

  const handleReviewEarlyTerm = (request: EarlyTerminationRequest) => {
    setSelectedEarlyTerm(request);
    setEarlyTermDialogOpen(true);
  };

  return (
    <>
      <div className="mb-6">
        <MoveOutsFilters
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({filteredUpcoming.length})
          </TabsTrigger>
          <TabsTrigger value="pending-approval" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pending Approval ({earlyTermRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({filteredCompleted.length})
          </TabsTrigger>
          <TabsTrigger value="vacancies" className="gap-2">
            <Home className="h-4 w-4" />
            Vacancies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <MoveOutsTable 
            type="upcoming"
            notices={paginatedUpcoming}
            inspections={inspections}
            tenantProfiles={tenantProfiles}
            onScheduleInspection={handleScheduleInspection}
            onConductInspection={handleConductInspection}
            page={upcomingPage}
            totalPages={Math.ceil(filteredUpcoming.length / ITEMS_PER_PAGE)}
            totalNotices={filteredUpcoming.length}
            onPageChange={setUpcomingPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </TabsContent>

        <TabsContent value="pending-approval" className="space-y-4">
          <EarlyTerminationsList 
            requests={earlyTermRequests || []}
            onReview={handleReviewEarlyTerm}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <MoveOutsTable 
            type="completed"
            notices={paginatedCompleted}
            inspections={inspections}
            tenantProfiles={tenantProfiles}
            onScheduleInspection={handleScheduleInspection}
            onConductInspection={handleConductInspection}
            page={completedPage}
            totalPages={Math.ceil(filteredCompleted.length / ITEMS_PER_PAGE)}
            totalNotices={filteredCompleted.length}
            onPageChange={setCompletedPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </TabsContent>

        <TabsContent value="vacancies">
          <VacancyDashboard />
        </TabsContent>
      </Tabs>

      <ScheduleInspectionDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        notice={selectedNotice}
        onScheduled={() => {
          refetch();
          setScheduleDialogOpen(false);
        }}
      />

      <MoveOutInspectionForm
        open={inspectionFormOpen}
        onOpenChange={setInspectionFormOpen}
        notice={selectedNotice}
        onCompleted={() => {
          refetch();
          setInspectionFormOpen(false);
        }}
      />

      <EarlyTerminationReviewDialog
        open={earlyTermDialogOpen}
        onOpenChange={setEarlyTermDialogOpen}
        request={selectedEarlyTerm}
        onReviewed={() => {
          refetch();
          setEarlyTermDialogOpen(false);
        }}
      />
    </>
  );
};

export default MerchantMoveOuts;
