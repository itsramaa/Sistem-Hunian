import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { ConfidenceBadge } from "@/shared/components/dss/ConfidenceBadge";
import { RotateCcw, Check, X, Save } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { toast } from "sonner";

interface OcrResultEditorProps {
  extractedData: Record<string, unknown> | null;
  originalData: Record<string, unknown> | null;
  reviewNotes: string | null;
  status: string;
  onSave: (data: {
    extracted_data: Record<string, unknown>;
    status: string;
    review_notes: string;
  }) => void;
  saving?: boolean;
}

export function OcrResultEditor({
  extractedData,
  originalData,
  reviewNotes,
  status,
  onSave,
  saving,
}: OcrResultEditorProps) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(reviewNotes || "");
  const [currentStatus, setCurrentStatus] = useState(status);

  const confidences: Record<string, number> =
    (extractedData?.field_confidences as Record<string, number>) || {};

  // Extract editable fields (exclude metadata keys)
  const metaKeys = ["field_confidences", "confidence", "raw_text"];

  useEffect(() => {
    if (!extractedData) return;
    const editable: Record<string, string> = {};
    Object.entries(extractedData).forEach(([key, val]) => {
      if (!metaKeys.includes(key) && typeof val !== "object") {
        editable[key] = String(val ?? "");
      }
    });
    setFields(editable);
  }, [extractedData]);

  const resetField = (key: string) => {
    if (!originalData || !(key in originalData)) return;
    setFields((prev) => ({ ...prev, [key]: String(originalData[key] ?? "") }));
  };

  const handleSave = () => {
    const updatedData = { ...extractedData } as Record<string, unknown>;
    Object.entries(fields).forEach(([k, v]) => {
      updatedData[k] = v;
    });
    onSave({
      extracted_data: updatedData,
      status: currentStatus,
      review_notes: notes,
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-success/10 border-success/30";
    if (score >= 60) return "bg-warning/10 border-warning/30";
    return "bg-destructive/10 border-destructive/30";
  };

  if (!extractedData || Object.keys(fields).length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Tidak ada data yang bisa diedit
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status selector */}
      <div className="flex gap-2">
        <Button
          variant={currentStatus === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentStatus("completed")}
        >
          <Check className="h-4 w-4 mr-1" /> Approve
        </Button>
        <Button
          variant={currentStatus === "rejected" ? "destructive" : "outline"}
          size="sm"
          onClick={() => setCurrentStatus("rejected")}
        >
          <X className="h-4 w-4 mr-1" /> Reject
        </Button>
      </div>

      {/* Editable fields */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {Object.entries(fields).map(([key, value]) => {
          const conf = confidences[key];
          return (
            <div
              key={key}
              className={cn(
                "rounded-lg border p-3 space-y-1.5",
                conf !== undefined ? getConfidenceColor(conf) : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium capitalize">
                  {key.replace(/_/g, " ")}
                </Label>
                <div className="flex items-center gap-1.5">
                  {conf !== undefined && (
                    <ConfidenceBadge confidence={conf} size="sm" showLabel={false} />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => resetField(key)}
                    title="Reset ke nilai asli"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Input
                value={value}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="h-8 text-sm"
              />
            </div>
          );
        })}
      </div>

      {/* Review notes */}
      <div className="space-y-1.5">
        <Label className="text-xs">Catatan Review</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tambahkan catatan review..."
          rows={3}
        />
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </div>
  );
}
