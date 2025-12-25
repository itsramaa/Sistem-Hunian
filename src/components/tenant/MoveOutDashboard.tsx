import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, differenceInDays } from "date-fns";
import { 
  CheckCircle2, Circle, Clock, Calendar, AlertTriangle, 
  FileText, ClipboardCheck, Home, Wallet, MapPin
} from "lucide-react";
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
      const { data, error } = await supabase
        .from("move_out_notices")
        .select("*")
        .eq("contract_id", contractId)
        .eq("tenant_user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!contractId && !!user?.id,
  });

  // Fetch timeline
  const { data: timeline } = useQuery({
    queryKey: ["move-out-timeline", notice?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("move_out_timeline")
        .select("*")
        .eq("move_out_notice_id", notice?.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!notice?.id,
  });

  // Fetch tasks
  const { data: tasks } = useQuery({
    queryKey: ["move-out-tasks", notice?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("move_out_tasks")
        .select("*")
        .eq("move_out_notice_id", notice?.id)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!notice?.id,
  });

  // Fetch inspection
  const { data: inspection } = useQuery({
    queryKey: ["move-out-inspection", notice?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("move_out_inspections")
        .select("*")
        .eq("move_out_notice_id", notice?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!notice?.id,
  });

  // Fetch deposit refund
  const { data: depositRefund } = useQuery({
    queryKey: ["deposit-refund", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposit_refunds")
        .select("*")
        .eq("contract_id", contractId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });

  // Fetch early termination request if applicable
  const { data: earlyTermRequest } = useQuery({
    queryKey: ["early-termination-request", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("early_termination_requests")
        .select("*")
        .eq("contract_id", contractId)
        .eq("tenant_user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!contractId && !!user?.id,
  });

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await supabase
        .from("move_out_tasks")
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", taskId);
      
      queryClient.invalidateQueries({ queryKey: ["move-out-tasks"] });
      toast.success(completed ? "Task completed!" : "Task marked incomplete");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const confirmInspection = async () => {
    if (!inspection?.id) return;
    try {
      await supabase
        .from("move_out_inspections")
        .update({ tenant_confirmed: true })
        .eq("id", inspection.id);
      
      queryClient.invalidateQueries({ queryKey: ["move-out-inspection"] });
      toast.success("Inspection time confirmed!");
    } catch (error) {
      toast.error("Failed to confirm inspection");
    }
  };

  if (noticeLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  if (!notice) {
    return null;
  }

  const moveOutDate = new Date(notice.intended_move_out_date);
  const daysUntilMoveOut = differenceInDays(moveOutDate, new Date());
  const completedTasks = tasks?.filter((t) => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const completedSteps = timeline?.filter((t) => t.completed).length || 0;
  const timelineProgress = (completedSteps / TIMELINE_STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Move-Out Dashboard
              </CardTitle>
              <CardDescription>Track your move-out progress</CardDescription>
            </div>
            <Badge variant={daysUntilMoveOut <= 7 ? "destructive" : "secondary"}>
              {daysUntilMoveOut} days left
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Move-Out Date</p>
              <p className="font-semibold">{format(moveOutDate, "MMM dd, yyyy")}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-warning" />
              <p className="text-sm text-muted-foreground">Days Remaining</p>
              <p className="font-semibold">{daysUntilMoveOut}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-success" />
              <p className="text-sm text-muted-foreground">Tasks Done</p>
              <p className="font-semibold">{completedTasks}/{totalTasks}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline" className="mt-1">{notice.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Early Termination Request Status */}
      {earlyTermRequest && (
        <Card className={earlyTermRequest.status === "approved" ? "border-success" : "border-warning"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" />
              Early Termination Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Penalty Amount</p>
                <p className="font-semibold">Rp {Number(earlyTermRequest.penalty_amount).toLocaleString("id-ID")}</p>
              </div>
              <Badge variant={
                earlyTermRequest.status === "approved" ? "default" :
                earlyTermRequest.status === "denied" ? "destructive" : "secondary"
              }>
                {earlyTermRequest.status.replace("_", " ")}
              </Badge>
            </div>
            {earlyTermRequest.merchant_response && (
              <p className="mt-3 text-sm p-3 bg-muted rounded-lg">
                <strong>Response:</strong> {earlyTermRequest.merchant_response}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Move-Out Timeline</CardTitle>
          <div className="mt-2">
            <Progress value={timelineProgress} className="h-2" />
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
                    <div className={`
                      p-2 rounded-full border-2
                      ${isCompleted ? "bg-success border-success text-success-foreground" : "bg-background border-muted-foreground/30"}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-2 ${isCompleted ? "bg-success" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${isCompleted ? "text-success" : ""}`}>
                      {step.label}
                    </p>
                    {timelineEntry?.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(timelineEntry.completed_at), "MMM dd, yyyy HH:mm")}
                      </p>
                    )}
                    {timelineEntry?.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{timelineEntry.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inspection Info */}
      {inspection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Scheduled Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {format(new Date(inspection.scheduled_date), "MMMM dd, yyyy 'at' HH:mm")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {inspection.status}
                </p>
              </div>
              {!inspection.tenant_confirmed && inspection.status === "scheduled" && (
                <Button onClick={confirmInspection} size="sm">
                  Confirm Time
                </Button>
              )}
              {inspection.tenant_confirmed && (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Confirmed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deposit Refund Status */}
      {depositRefund && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Deposit Refund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Deposit</span>
                <span>Rp {Number(depositRefund.original_deposit).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deductions</span>
                <span className="text-destructive">- Rp {Number(depositRefund.deductions).toLocaleString("id-ID")}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Refund Amount</span>
                <span className="text-success">Rp {Number(depositRefund.refund_amount).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Badge variant={
                  depositRefund.status === "refunded" ? "default" :
                  depositRefund.status === "disputed" ? "destructive" : "secondary"
                }>
                  {depositRefund.status.replace("_", " ")}
                </Badge>
                {depositRefund.due_date && (
                  <span className="text-sm text-muted-foreground">
                    Due by {format(new Date(depositRefund.due_date), "MMM dd, yyyy")}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Move-Out Checklist</CardTitle>
          <div className="mt-2">
            <Progress value={taskProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{completedTasks} of {totalTasks} tasks completed</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks?.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border ${task.completed ? "bg-success/5 border-success/20" : ""}`}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                />
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.task_name}
                  </p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {format(new Date(task.due_date), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
                {task.completed && task.completed_at && (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
