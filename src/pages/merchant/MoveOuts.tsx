import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MerchantLayout } from "@/components/layouts/MerchantLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, differenceInDays } from "date-fns";
import { 
  Home, Calendar, ClipboardCheck, AlertTriangle, Clock, 
  Users, Wallet, CheckCircle2, ArrowRight, Eye
} from "lucide-react";
import { ScheduleInspectionDialog } from "@/components/merchant/ScheduleInspectionDialog";
import { MoveOutInspectionForm } from "@/components/merchant/MoveOutInspectionForm";
import { VacancyDashboard } from "@/components/merchant/VacancyDashboard";
import { EarlyTerminationReviewDialog } from "@/components/merchant/EarlyTerminationReviewDialog";

const MerchantMoveOuts = () => {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [inspectionFormOpen, setInspectionFormOpen] = useState(false);
  const [earlyTermDialogOpen, setEarlyTermDialogOpen] = useState(false);
  const [selectedEarlyTerm, setSelectedEarlyTerm] = useState<any>(null);

  // Fetch move-out notices for merchant's contracts
  const { data: moveOutNotices, isLoading } = useQuery({
    queryKey: ["merchant-move-outs", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("move_out_notices")
        .select(`
          *,
          contract:contracts!inner (
            id,
            rent_amount,
            deposit_amount,
            merchant_id,
            tenant_user_id,
            unit:units (
              unit_number,
              property:properties (name, address)
            )
          )
        `)
        .eq("contract.merchant_id", merchant?.id)
        .order("intended_move_out_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch inspections
  const { data: inspections } = useQuery({
    queryKey: ["merchant-inspections", merchant?.id],
    queryFn: async () => {
      const noticeIds = moveOutNotices?.map((n) => n.id) || [];
      if (noticeIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("move_out_inspections")
        .select("*")
        .in("move_out_notice_id", noticeIds);
      if (error) throw error;
      return data;
    },
    enabled: !!moveOutNotices?.length,
  });

  // Fetch early termination requests
  const { data: earlyTermRequests } = useQuery({
    queryKey: ["merchant-early-terminations", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("early_termination_requests")
        .select(`
          *,
          contract:contracts!inner (
            id,
            rent_amount,
            merchant_id,
            unit:units (
              unit_number,
              property:properties (name)
            )
          )
        `)
        .eq("contract.merchant_id", merchant?.id)
        .eq("status", "pending_approval");
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch tenant profiles
  const { data: tenantProfiles } = useQuery({
    queryKey: ["tenant-profiles", moveOutNotices],
    queryFn: async () => {
      const tenantIds = moveOutNotices?.map((n) => n.tenant_user_id) || [];
      if (tenantIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", tenantIds);
      if (error) throw error;
      
      return data?.reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>) || {};
    },
    enabled: !!moveOutNotices?.length,
  });

  const getInspectionForNotice = (noticeId: string) => {
    return inspections?.find((i) => i.move_out_notice_id === noticeId);
  };

  const upcomingMoveOuts = moveOutNotices?.filter(
    (n) => n.status !== "completed" && differenceInDays(new Date(n.intended_move_out_date), new Date()) >= 0
  ) || [];

  const completedMoveOuts = moveOutNotices?.filter(
    (n) => n.status === "completed"
  ) || [];

  const getStatusBadge = (notice: any) => {
    const inspection = getInspectionForNotice(notice.id);
    const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());

    if (notice.status === "completed") {
      return <Badge className="bg-success text-success-foreground">Completed</Badge>;
    }
    if (inspection?.status === "completed") {
      return <Badge variant="secondary">Inspection Done</Badge>;
    }
    if (inspection?.status === "scheduled") {
      return <Badge variant="outline">Inspection Scheduled</Badge>;
    }
    if (daysUntil <= 7) {
      return <Badge variant="destructive">Urgent - {daysUntil} days</Badge>;
    }
    return <Badge variant="secondary">{daysUntil} days left</Badge>;
  };

  return (
    <MerchantLayout title="Move-Outs" description="Manage tenant move-outs and vacancies">
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingMoveOuts.length})
          </TabsTrigger>
          <TabsTrigger value="pending-approval" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pending Approval ({earlyTermRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedMoveOuts.length})
          </TabsTrigger>
          <TabsTrigger value="vacancies" className="gap-2">
            <Home className="h-4 w-4" />
            Vacancies
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Move-Outs */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMoveOuts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Move-Outs</h3>
                <p className="text-muted-foreground">All tenants are staying put!</p>
              </CardContent>
            </Card>
          ) : (
            upcomingMoveOuts.map((notice) => {
              const inspection = getInspectionForNotice(notice.id);
              const tenant = tenantProfiles?.[notice.tenant_user_id];
              const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());
              
              return (
                <Card key={notice.id} className={daysUntil <= 7 ? "border-destructive" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Home className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {notice.contract?.unit?.property?.name} - Unit {notice.contract?.unit?.unit_number}
                          </CardTitle>
                          <CardDescription>
                            {tenant?.full_name || "Tenant"} • {tenant?.email}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(notice)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Move-Out Date</span>
                        </div>
                        <p className="font-semibold">
                          {format(new Date(notice.intended_move_out_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Days Left</span>
                        </div>
                        <p className={`font-semibold ${daysUntil <= 7 ? "text-destructive" : ""}`}>
                          {daysUntil} days
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Wallet className="h-4 w-4" />
                          <span className="text-sm">Deposit</span>
                        </div>
                        <p className="font-semibold">
                          Rp {Number(notice.contract?.deposit_amount || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <ClipboardCheck className="h-4 w-4" />
                          <span className="text-sm">Inspection</span>
                        </div>
                        <p className="font-semibold">
                          {inspection?.status === "scheduled" 
                            ? format(new Date(inspection.scheduled_date), "MMM dd")
                            : inspection?.status === "completed"
                            ? "Done"
                            : "Not scheduled"}
                        </p>
                      </div>
                    </div>

                    {notice.is_early_termination && (
                      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
                        <div className="flex items-center gap-2 text-warning">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Early Termination</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Reason: {notice.reason || "Not specified"}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {!inspection && (
                        <Button 
                          onClick={() => {
                            setSelectedNotice(notice);
                            setScheduleDialogOpen(true);
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Inspection
                        </Button>
                      )}
                      {inspection?.status === "scheduled" && (
                        <Button 
                          onClick={() => {
                            setSelectedNotice(notice);
                            setInspectionFormOpen(true);
                          }}
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Conduct Inspection
                        </Button>
                      )}
                      {inspection?.status === "completed" && (
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Pending Early Termination Approvals */}
        <TabsContent value="pending-approval" className="space-y-4">
          {(!earlyTermRequests || earlyTermRequests.length === 0) ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground">All early termination requests have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            earlyTermRequests.map((request) => (
              <Card key={request.id} className="border-warning">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        Early Termination Request
                      </CardTitle>
                      <CardDescription>
                        {request.contract?.unit?.property?.name} - Unit {request.contract?.unit?.unit_number}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Pending Approval</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Requested Date</p>
                      <p className="font-semibold">{format(new Date(request.requested_date), "MMM dd, yyyy")}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Penalty Amount</p>
                      <p className="font-semibold text-destructive">
                        Rp {Number(request.penalty_amount).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="font-semibold">{request.reason || "Not specified"}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedEarlyTerm(request);
                      setEarlyTermDialogOpen(true);
                    }}
                  >
                    Review Request
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Completed Move-Outs */}
        <TabsContent value="completed" className="space-y-4">
          {completedMoveOuts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Completed Move-Outs</h3>
                <p className="text-muted-foreground">Completed move-outs will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            completedMoveOuts.map((notice) => {
              const tenant = tenantProfiles?.[notice.tenant_user_id];
              return (
                <Card key={notice.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {notice.contract?.unit?.property?.name} - Unit {notice.contract?.unit?.unit_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tenant?.full_name} • Moved out {format(new Date(notice.intended_move_out_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">Completed</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Vacancy Dashboard */}
        <TabsContent value="vacancies">
          <VacancyDashboard />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ScheduleInspectionDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        notice={selectedNotice}
        onScheduled={() => {
          queryClient.invalidateQueries({ queryKey: ["merchant-inspections"] });
          setScheduleDialogOpen(false);
        }}
      />

      <MoveOutInspectionForm
        open={inspectionFormOpen}
        onOpenChange={setInspectionFormOpen}
        notice={selectedNotice}
        onCompleted={() => {
          queryClient.invalidateQueries({ queryKey: ["merchant-inspections"] });
          queryClient.invalidateQueries({ queryKey: ["merchant-move-outs"] });
          setInspectionFormOpen(false);
        }}
      />

      <EarlyTerminationReviewDialog
        open={earlyTermDialogOpen}
        onOpenChange={setEarlyTermDialogOpen}
        request={selectedEarlyTerm}
        onReviewed={() => {
          queryClient.invalidateQueries({ queryKey: ["merchant-early-terminations"] });
          setEarlyTermDialogOpen(false);
        }}
      />
    </MerchantLayout>
  );
};

export default MerchantMoveOuts;
