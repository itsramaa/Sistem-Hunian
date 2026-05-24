import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Progress } from "@/shared/components/ui/progress";
import { Separator } from "@/shared/components/ui/separator";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { format, differenceInDays } from "date-fns";
import { CheckCircle2, Circle, Clock, Calendar, AlertTriangle, FileText, ClipboardCheck, Home, Wallet, MapPin } from "lucide-react";
import { toast } from "sonner";

interface MoveOutDashboardProps {
  contractId: string;
}

const TIMELINE_STEPS = [
  { key: "notice_submitted", label: "Notice Submitted", icon: FileText },
  { key: "inspection_scheduled", label: "Inspection Scheduled", icon: Calendar },
  { key: "inspection_completed", label: "Inspection Completed", icon: ClipboardCheck },
  { key: "move_out_completed", label: "Move-Out Completed", icon: Home },
  { key: "deposit_returned", label: "Deposit Returned", icon: Wallet },
];

export function MoveOutDashboard({ contractId }: MoveOutDashboardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch move-out notice
  const { data: notice, isLoading: noticeLoading } = useQuery({
    queryKey: ["move-out-notice", contractId],
    queryFn: async () => {
      // TODO: implement Go endpoint — was: supabase.from('move_out_notices').select('*').eq('contract_id', contractId).eq('tenant_user_id', user?.id).maybeSingle()
      try {
        const r = await apiClient.get('/move-out-notices', { params: { contract_id: contractId, tenant_user_id: user?.id } });
        return (r.data.data?.[0] ?? null);
      } catch (err) { throw err as Error; }
    },
    enabled: !!contractId && !!user?.id,
  });

  // Fetch timeline
  const { data: timeline } = useQuery({
    queryKey: ["move-out-timeline", notice?.id],
    queryFn: async () => {
      // TODO: implement Go endpoint — was: supabase.from('move_out_timeline').select('*').eq('move_out_notice_id', notice?.id).order('created_at')
      try {
        const r = await apiClient.get('/move-out-timeline', { params: { move_out_notice_id: notice?.id } });
        return r.data.data ?? [];
      } catch (err) { throw err as Error; }
    },
    enabled: !!notice?.id,
  });

  // Fetch tasks
  const { data: tasks } = useQuery({
    queryKey: ["move-out-tasks", notice?.id],
    queryFn: async () => {
      // TODO: implement Go endpoint — was: supabase.from('move_out_tasks').select('*').eq('move_out_notice_id', notice?.id).order('order_index')
      try {
        const r = await apiClient.get('/move-out-tasks', { params: { move_out_notice_id: notice?.id } });
        return r.data.data ?? [];
      } catch (err) { throw err as Error; }
    },
    enabled: !!notice?.id,
  });

  // Fetch inspection
  const { data: inspection } = useQuery({
    queryKey: ["move-out-inspection", notice?.id],
    queryFn: async () => {
      // TODO: implement Go endpoint — was: supabase.from('move_out_inspections').select('*').eq('move_out_notice_id', notice?.id).maybeSingle()
      try {
        const r = await apiClient.get('/move-out-inspections', { params: { move_out_notice_id: notice?.id } });
        return r.data.data?.[0] ?? null;
      } catch (err) { throw err as Error; }
    },
    enabled: !!notice?.id,
  });

  // Fetch deposit refund
  const { data: depositRefund } = useQuery({
    queryKey: ["deposit-refund", contractId],
    queryFn: async () => {
      // TODO: implement Go endpoint — was: supabase.from('deposit_refunds').select('*').eq('contract_id', contractId).maybeSingle()
      try {
        const r = await apiClient.get('/deposit-refunds', { params: { contract_id: contractId } });
        return r.data.data?.[0] ?? null;
      } catch (err) { throw err as Error; }
    },
    enabled: !!contractId,
  });

  // Fetch early termination request if applicable
  const { data: earlyTermRequest } = useQuery({
    queryKey: ["early-termination-request", contractId],
    queryFn: async () => {
      // TODO: implement Go endpoint — was: supabase.from('early_termination_requests').select('*').eq('contract_id', contractId).eq('tenant_user_id', user?.id).maybeSingle()
      try {
        const r = await apiClient.get('/early-termination-requests', { params: { contract_id: contractId, tenant_user_id: user?.id } });
        return r.data.data?.[0] ?? null;
      } catch (err) { throw err as Error; }
    },
    enabled: !!contractId && !!user?.id,
  });

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await apiClient.put(`/move-out-tasks/${taskId}`, { completed, completed_at: completed ? new Date().toISOString() : null });
      queryClient.invalidateQueries({ queryKey: ["move-out-tasks"] });
      toast.success(completed ? "Task completed!" : "Task marked incomplete");
    } catch (error) { toast.error("Failed to update task"); }
  };

  const confirmInspection = async () => {
    if (!inspection?.id) return;
    try {
      await apiClient.put(`/move-out-inspections/${inspection.id}`, { tenant_confirmed: true });
      queryClient.invalidateQueries({ queryKey: ["move-out-inspection"] });
      toast.success("Inspection time confirmed!");
    } catch (error) { toast.error("Failed to confirm inspection"); }
  };

  if (noticeLoading) return <div className="animate-pulse h-48 bg-muted rounded-2xl" />;
  if (!notice) return null;

  const moveOutDate = new Date(notice.intended_move_out_date);
  const daysUntilMoveOut = differenceInDays(moveOutDate, new Date());
  const completedTasks = tasks?.filter((t) => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const completedSteps = timeline?.filter((t) => t.completed).length || 0;
  const timelineProgress = (completedSteps / TIMELINE_STEPS.length) * 100;

  return (
    <div className="space-y-6 mt-6">
      {/* Overview Card */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                Move-Out Dashboard
              </CardTitle>
              <CardDescription>Track your move-out progress</CardDescription>
            </div>
            <Badge variant={daysUntilMoveOut <= 7 ? "destructive" : "secondary"} className="rounded-full">
              {daysUntilMoveOut} days left
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, color: 'text-primary', bg: 'from-primary/20 to-primary/5', label: 'Move-Out Date', value: format(moveOutDate, "MMM dd, yyyy") },
              { icon: Clock, color: 'text-warning', bg: 'from-warning/20 to-warning/5', label: 'Days Remaining', value: String(daysUntilMoveOut) },
              { icon: ClipboardCheck, color: 'text-success', bg: 'from-success/20 to-success/5', label: 'Tasks Done', value: `${completedTasks}/${totalTasks}` },
              { icon: FileText, color: 'text-muted-foreground', bg: 'from-muted/40 to-muted/20', label: 'Status', value: notice.status },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 text-center">
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-semibold mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Early Termination */}
      {earlyTermRequest && (
        <Card className={`rounded-2xl border ${earlyTermRequest.status === "approved" ? "border-success/50" : "border-warning/50"} bg-card/90 backdrop-blur-sm`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" />Early Termination Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Penalty Amount</p>
                <p className="font-semibold">Rp {Number(earlyTermRequest.penalty_amount).toLocaleString("id-ID")}</p>
              </div>
              <Badge variant={earlyTermRequest.status === "approved" ? "default" : earlyTermRequest.status === "denied" ? "destructive" : "secondary"} className="rounded-full">
                {earlyTermRequest.status.replace("_", " ")}
              </Badge>
            </div>
            {earlyTermRequest.merchant_response && (
              <p className="mt-3 text-sm p-3 bg-muted/50 rounded-xl"><strong>Response:</strong> {earlyTermRequest.merchant_response}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline - Connected Dots Style */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Move-Out Timeline</CardTitle>
          <div className="mt-2">
            <Progress value={timelineProgress} className="h-2 rounded-full" />
            <p className="text-xs text-muted-foreground mt-1">{completedSteps} of {TIMELINE_STEPS.length} steps completed</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {TIMELINE_STEPS.map((step, index) => {
              const timelineEntry = timeline?.find((t) => t.step === step.key);
              const isCompleted = timelineEntry?.completed;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full border-2 transition-all duration-300 ${isCompleted ? "bg-success border-success text-success-foreground shadow-[0_0_12px_rgba(var(--success),0.3)]" : "bg-background border-border/50"}`}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-2 rounded-full ${isCompleted ? "bg-success" : "bg-border/50"}`} />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${isCompleted ? "text-success" : ""}`}>{step.label}</p>
                    {timelineEntry?.completed_at && (
                      <p className="text-xs text-muted-foreground">{format(new Date(timelineEntry.completed_at), "MMM dd, yyyy HH:mm")}</p>
                    )}
                    {timelineEntry?.notes && <p className="text-sm text-muted-foreground mt-1">{timelineEntry.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inspection */}
      {inspection && (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              Scheduled Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{format(new Date(inspection.scheduled_date), "MMMM dd, yyyy 'at' HH:mm")}</p>
                <p className="text-sm text-muted-foreground">Status: {inspection.status}</p>
              </div>
              {!inspection.tenant_confirmed && inspection.status === "scheduled" && (
                <Button onClick={confirmInspection} size="sm" className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md">Confirm Time</Button>
              )}
              {inspection.tenant_confirmed && (
                <Badge variant="outline" className="gap-1 rounded-full"><CheckCircle2 className="h-3 w-3" /> Confirmed</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deposit Refund */}
      {depositRefund && (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-success/20 to-success/5">
                <Wallet className="h-5 w-5 text-success" />
              </div>
              Deposit Refund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Original Deposit</span><span>Rp {Number(depositRefund.original_deposit).toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deductions</span><span className="text-destructive">- Rp {Number(depositRefund.deductions).toLocaleString("id-ID")}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Refund Amount</span><span className="text-success">Rp {Number(depositRefund.refund_amount).toLocaleString("id-ID")}</span></div>
              <div className="flex items-center justify-between pt-2">
                <Badge variant={depositRefund.status === "refunded" ? "default" : depositRefund.status === "disputed" ? "destructive" : "secondary"} className="rounded-full">
                  {depositRefund.status.replace("_", " ")}
                </Badge>
                {depositRefund.due_date && <span className="text-sm text-muted-foreground">Due by {format(new Date(depositRefund.due_date), "MMM dd, yyyy")}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Move-Out Checklist</CardTitle>
          <div className="mt-2">
            <Progress value={taskProgress} className="h-2 rounded-full" />
            <p className="text-xs text-muted-foreground mt-1">{completedTasks} of {totalTasks} tasks completed</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks?.map((task) => (
              <div key={task.id} className={`flex items-start gap-3 p-4 rounded-xl border border-border/40 transition-all duration-200 ${task.completed ? "bg-success/5 border-success/20" : "bg-card/80 backdrop-blur-sm hover:border-primary/20"}`}>
                <Checkbox checked={task.completed} onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)} />
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.task_name}</p>
                  {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                  {task.due_date && <p className="text-xs text-muted-foreground mt-1">Due: {format(new Date(task.due_date), "MMM dd, yyyy")}</p>}
                </div>
                {task.completed && task.completed_at && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
