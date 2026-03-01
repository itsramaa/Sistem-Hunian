import { useState, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, DoorOpen, FileText, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/shared/utils/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useMoveOutWizardData } from "./useMoveOutWizardData";
import { WizardStepNoticeReview } from "./WizardStepNoticeReview";
import { WizardStepInspection } from "./WizardStepInspection";
import { WizardStepDeposit } from "./WizardStepDeposit";
import { WizardStepConfirmation } from "./WizardStepConfirmation";
import { StateMachineTracker } from "./StateMachineTracker";

const STEPS = [
  { id: 1, label: "Pemberitahuan", icon: FileText },
  { id: 2, label: "Inspeksi", icon: ClipboardCheck },
  { id: 3, label: "Deposit & Kontrak", icon: Wallet },
  { id: 4, label: "Konfirmasi", icon: Check },
];

interface MoveOutWizardProps {
  noticeId: string;
}

export function MoveOutWizard({ noticeId }: MoveOutWizardProps) {
  const navigate = useNavigate();
  const data = useMoveOutWizardData(noticeId);
  const [activeStep, setActiveStep] = useState(1);

  // Determine which step we should auto-navigate to based on DB state
  const currentDbStep = useMemo(() => {
    if (data.step3Complete) return 4;
    if (data.inspectionCompleted) return 3;
    if (data.noticeAcknowledged) return 2;
    return 1;
  }, [data.noticeAcknowledged, data.inspectionCompleted, data.step3Complete]);

  const canNavigateToStep = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return data.noticeAcknowledged;
    if (step === 3) return data.inspectionCompleted;
    if (step === 4) return data.step3Complete;
    return false;
  };

  const stepStatus = (step: number): "completed" | "active" | "pending" => {
    if (step === 1 && data.noticeAcknowledged) return "completed";
    if (step === 2 && data.inspectionCompleted) return "completed";
    if (step === 3 && data.step3Complete) return "completed";
    if (step === 4 && data.step3Complete) return "completed";
    if (step === activeStep) return "active";
    return "pending";
  };

  if (data.isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Memuat wizard pindah keluar">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!data.notice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/merchant/move-outs")} className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <div className="text-center py-16" role="alert">
          <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Pemberitahuan tidak ditemukan</h2>
        </div>
      </div>
    );
  }

  const unit = data.notice.contract?.unit;
  const property = unit?.property;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/merchant/move-outs")} className="rounded-xl" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="gradient-icon-box w-12 h-12" aria-hidden="true">
            <DoorOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Proses Pindah Keluar</h1>
            <p className="text-sm text-muted-foreground">{property?.name} — Unit {unit?.unit_number}</p>
          </div>
        </div>
      </div>

      {/* Step Tracker */}
      <nav className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4" aria-label="Langkah wizard">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((step, idx) => {
            const status = stepStatus(step.id);
            const StepIcon = step.icon;
            const navigable = canNavigateToStep(step.id);
            return (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => navigable && setActiveStep(step.id)}
                  disabled={!navigable}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
                    status === "completed" && "bg-primary/10 text-primary",
                    status === "active" && "bg-primary text-primary-foreground",
                    status === "pending" && "bg-muted/40 text-muted-foreground",
                    navigable && status !== "active" && "hover:bg-primary/20 cursor-pointer",
                    !navigable && "cursor-not-allowed opacity-50"
                  )}
                  aria-current={status === "active" ? "step" : undefined}
                >
                  {status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 min-w-4", status === "completed" ? "bg-primary/40" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Step Content + State Machine Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[400px]">
        {/* Mobile: collapsible tracker above content */}
        <div className="lg:hidden">
          <StateMachineTracker data={data} />
        </div>

        <div className="lg:col-span-3">
          {activeStep === 1 && (
            <WizardStepNoticeReview
              data={data}
              onNext={() => setActiveStep(2)}
            />
          )}
          {activeStep === 2 && (
            <WizardStepInspection
              data={data}
              onNext={() => setActiveStep(3)}
              onBack={() => setActiveStep(1)}
            />
          )}
          {activeStep === 3 && (
            <WizardStepDeposit
              data={data}
              onNext={() => setActiveStep(4)}
              onBack={() => setActiveStep(2)}
            />
          )}
          {activeStep === 4 && (
            <WizardStepConfirmation
              data={data}
              onBack={() => setActiveStep(3)}
            />
          )}
        </div>

        {/* Desktop: persistent sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          <StateMachineTracker data={data} />
        </aside>
      </div>
    </div>
  );
}
