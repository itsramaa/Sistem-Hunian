import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Progress } from "@/shared/components/ui/progress";
import {
  FileText,
  CheckCircle,
  PenTool,
  Eye,
  Download,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { SignaturePad } from "@/features/signature/components/SignaturePad";

interface ContractSection {
  id: string;
  title: string;
  content: string;
  required: boolean;
  acknowledged: boolean;
}

interface ContractSigningFlowProps {
  contractId: string;
  contractTitle: string;
  sections: ContractSection[];
  onSign: (signatureData: string) => Promise<void>;
  onDownload?: () => void;
}

type Step = "review" | "acknowledge" | "sign" | "complete";

export function ContractSigningFlow({
  contractId,
  contractTitle,
  sections,
  onSign,
  onDownload,
}: ContractSigningFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>("review");
  const [acknowledgedSections, setAcknowledgedSections] = useState<Set<string>>(new Set());
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "review", label: "Review", icon: <Eye className="h-4 w-4" /> },
    { id: "acknowledge", label: "Setujui", icon: <CheckCircle className="h-4 w-4" /> },
    { id: "sign", label: "Tanda Tangan", icon: <PenTool className="h-4 w-4" /> },
    { id: "complete", label: "Selesai", icon: <FileText className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const requiredSections = sections.filter((s) => s.required);
  const allRequiredAcknowledged = requiredSections.every((s) =>
    acknowledgedSections.has(s.id)
  );

  const toggleAcknowledge = (sectionId: string) => {
    setAcknowledgedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSign = async () => {
    if (!signatureData) return;

    setIsSubmitting(true);
    try {
      await onSign(signatureData);
      setCurrentStep("complete");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "review":
        return true;
      case "acknowledge":
        return allRequiredAcknowledged;
      case "sign":
        return !!signatureData;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {contractTitle}
            </CardTitle>
            <CardDescription>ID: {contractId}</CardDescription>
          </div>
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Unduh PDF
            </Button>
          )}
        </div>

        {/* Progress stepper */}
        <div className="mt-6">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center gap-1",
                  index <= currentStepIndex
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    index < currentStepIndex && "bg-primary border-primary text-primary-foreground",
                    index === currentStepIndex && "border-primary",
                    index > currentStepIndex && "border-muted-foreground/30"
                  )}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className="text-xs font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Review Step */}
        {currentStep === "review" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
              <p className="text-sm">
                Baca dan pahami semua bagian kontrak sebelum melanjutkan.
              </p>
            </div>

            <ScrollArea className="h-[400px] rounded-lg border p-4">
              {sections.map((section, index) => (
                <div key={section.id} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{section.title}</h3>
                    {section.required && (
                      <Badge variant="destructive" className="text-xs">
                        Wajib
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {section.content}
                  </p>
                  {index < sections.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Acknowledge Step */}
        {currentStep === "acknowledge" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm">
                Centang semua bagian yang wajib untuk melanjutkan ke tanda tangan.
              </p>
            </div>

            <div className="space-y-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border transition-colors",
                    acknowledgedSections.has(section.id) && "bg-primary/5 border-primary"
                  )}
                >
                  <Checkbox
                    id={section.id}
                    checked={acknowledgedSections.has(section.id)}
                    onCheckedChange={() => toggleAcknowledge(section.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={section.id}
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      {section.title}
                      {section.required && (
                        <Badge variant="destructive" className="text-xs">
                          Wajib
                        </Badge>
                      )}
                    </label>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {section.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              {acknowledgedSections.size} dari {requiredSections.length} bagian wajib disetujui
            </div>
          </div>
        )}

        {/* Sign Step */}
        {currentStep === "sign" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
              <PenTool className="h-5 w-5 text-primary" />
              <p className="text-sm">
                Buat tanda tangan digital Anda di kotak di bawah ini.
              </p>
            </div>

            <SignaturePad
              onSave={(data) => setSignatureData(data)}
            />

            {signatureData && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Tanda tangan tersimpan
              </div>
            )}
          </div>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Kontrak Berhasil Ditandatangani!</h3>
            <p className="text-muted-foreground">
              Kontrak Anda telah berhasil ditandatangani dan disimpan.
              Anda akan menerima salinan via email.
            </p>
            {onDownload && (
              <Button onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Unduh Salinan Kontrak
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        {currentStep !== "complete" && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>

            {currentStep === "sign" ? (
              <Button
                onClick={handleSign}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? "Memproses..." : "Tanda Tangani Kontrak"}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Lanjutkan
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
