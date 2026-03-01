import { FileText, Home, Wallet, ScrollText, ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useMoveOutWizardData } from "./useMoveOutWizardData";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { useState } from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface StateMachineTrackerProps {
  data: ReturnType<typeof useMoveOutWizardData>;
}

interface MachineRow {
  label: string;
  icon: React.ElementType;
  states: { key: string; label: string }[];
  currentIndex: number;
}

function deriveNoticeStates(status: string | undefined): { states: { key: string; label: string }[]; currentIndex: number } {
  const states = [
    { key: "submitted", label: "Diajukan" },
    { key: "acknowledged", label: "Dikonfirmasi" },
    { key: "in_progress", label: "Diproses" },
    { key: "completed", label: "Selesai" },
  ];
  const map: Record<string, number> = { submitted: 0, acknowledged: 1, in_progress: 2, completed: 3 };
  return { states, currentIndex: map[status || "submitted"] ?? 0 };
}

function deriveUnitStates(contractStatus: string | null | undefined): { states: { key: string; label: string }[]; currentIndex: number } {
  const states = [
    { key: "occupied", label: "Terisi" },
    { key: "vacating", label: "Akan Kosong" },
    { key: "available", label: "Tersedia" },
  ];
  if (contractStatus === "terminated" || contractStatus === "terminated_early") return { states, currentIndex: 2 };
  if (contractStatus === "active") return { states, currentIndex: 0 };
  return { states, currentIndex: 1 };
}

function deriveDepositStates(status: string | null | undefined): { states: { key: string; label: string }[]; currentIndex: number } {
  const states = [
    { key: "none", label: "Belum Ada" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Disetujui" },
    { key: "processing", label: "Diproses" },
    { key: "completed", label: "Selesai" },
  ];
  if (!status) return { states, currentIndex: 0 };
  const map: Record<string, number> = { pending_processing: 1, pending: 1, approved: 2, processing: 3, completed: 4 };
  return { states, currentIndex: map[status] ?? 0 };
}

function deriveContractStates(status: string | null | undefined): { states: { key: string; label: string }[]; currentIndex: number } {
  const states = [
    { key: "active", label: "Aktif" },
    { key: "terminated", label: "Diterminasi" },
  ];
  if (status === "terminated" || status === "terminated_early") return { states, currentIndex: 1 };
  return { states, currentIndex: 0 };
}

function StateProgressRow({ row }: { row: MachineRow }) {
  const Icon = row.icon;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-foreground">{row.label}</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {row.states.map((state, idx) => {
          const isCompleted = idx < row.currentIndex;
          const isCurrent = idx === row.currentIndex;
          return (
            <div key={state.key} className="flex items-center gap-1">
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors",
                  isCompleted && "bg-success/15 text-success",
                  isCurrent && "bg-primary/15 text-primary ring-1 ring-primary/30 animate-pulse",
                  !isCompleted && !isCurrent && "bg-muted/50 text-muted-foreground"
                )}
              >
                {state.label}
              </span>
              {idx < row.states.length - 1 && (
                <span className={cn("text-[10px]", isCompleted ? "text-success" : "text-muted-foreground/40")}>→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StateMachineTracker({ data }: StateMachineTrackerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const noticeRow = deriveNoticeStates(data.notice?.status);
  const unitRow = deriveUnitStates(data.notice?.contract?.status);
  const depositRow = deriveDepositStates(data.depositRefund?.status);
  const contractRow = deriveContractStates(data.notice?.contract?.status);

  const machines: MachineRow[] = [
    { label: "Pemberitahuan", icon: FileText, ...noticeRow },
    { label: "Unit", icon: Home, ...unitRow },
    { label: "Deposit", icon: Wallet, ...depositRow },
    { label: "Kontrak", icon: ScrollText, ...contractRow },
  ];

  const content = (
    <div className="space-y-4">
      {machines.map((m) => (
        <StateProgressRow key={m.label} row={m} />
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <span className="text-sm font-semibold">Status State Machine</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            {content}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4 sticky top-6">
      <h3 className="text-sm font-semibold mb-4">Status State Machine</h3>
      {content}
    </div>
  );
}
