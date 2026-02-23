import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ExtractedField } from "@/shared/components/dss/ExtractedField";
import { ConfidenceBadge } from "@/shared/components/dss/ConfidenceBadge";
import { Upload, FileImage, Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/shared/utils/utils";

type UploadState = "idle" | "dragging" | "processing" | "completed" | "error";

interface OcrResult {
  fields: Array<{
    label: string;
    value: string;
    confidence: number;
    isVerified?: boolean;
    originalText?: string;
  }>;
  overallConfidence: number;
  documentType: string;
  matchStatus?: "match" | "mismatch" | "partial";
}

interface OcrUploadCardProps {
  title?: string;
  description?: string;
  acceptedTypes?: string[];
  onUpload?: (file: File) => Promise<OcrResult>;
  className?: string;
}

export function OcrUploadCard({
  title = "Upload Dokumen",
  description = "Drag & drop atau klik untuk upload dokumen",
  acceptedTypes = ["image/png", "image/jpeg", "application/pdf"],
  onUpload,
  className,
}: OcrUploadCardProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [result, setResult] = useState<OcrResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      setError("Tipe file tidak didukung");
      setState("error");
      return;
    }
    setFileName(file.name);
    setState("processing");
    setError("");

    try {
      if (onUpload) {
        const res = await onUpload(file);
        setResult(res);
      } else {
        await new Promise((r) => setTimeout(r, 2000));
        setResult({
          fields: [
            { label: "Nama", value: "Ahmad Rizki", confidence: 95, isVerified: true },
            { label: "NIK", value: "3201010101010001", confidence: 88 },
            { label: "Alamat", value: "Jl. Merdeka No. 10", confidence: 72, originalText: "Jl. Mrdeka No.10" },
            { label: "Tanggal Lahir", value: "01-01-1990", confidence: 91, isVerified: true },
          ],
          overallConfidence: 86,
          documentType: "KTP",
        });
      }
      setState("completed");
    } catch {
      setError("Gagal memproses dokumen");
      setState("error");
    }
  }, [acceptedTypes, onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("dragging");
  }, []);

  const onDragLeave = useCallback(() => setState("idle"), []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const reset = () => {
    setState("idle");
    setResult(null);
    setFileName("");
    setError("");
  };

  const matchConfig = {
    match: { label: "Cocok", className: "bg-success/15 text-success border-success/30 rounded-full" },
    mismatch: { label: "Tidak Cocok", className: "bg-destructive/15 text-destructive border-destructive/30 rounded-full" },
    partial: { label: "Sebagian Cocok", className: "bg-warning/15 text-warning border-warning/30 rounded-full" },
  };

  return (
    <Card className={cn("overflow-hidden rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {state === "completed" && result ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full">{result.documentType}</Badge>
                <ConfidenceBadge confidence={result.overallConfidence} size="sm" />
              </div>
              {result.matchStatus && (
                <Badge className={matchConfig[result.matchStatus].className}>
                  {matchConfig[result.matchStatus].label}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.fields.map((field) => (
                <ExtractedField key={field.label} {...field} />
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset} className="rounded-xl">Upload Lagi</Button>
              <Button size="sm" className="gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm">
                Lanjutkan <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              state === "dragging" ? "border-primary bg-primary/5 backdrop-blur-sm scale-[1.01]" : "border-border/40 hover:border-primary/50 bg-background/40 backdrop-blur-sm",
              state === "error" && "border-destructive/50 bg-destructive/5"
            )}
            onClick={() => {
              if (state !== "processing") document.getElementById("ocr-file-input")?.click();
            }}
          >
            <input
              id="ocr-file-input"
              type="file"
              accept={acceptedTypes.join(",")}
              className="hidden"
              onChange={onInputChange}
            />
            {state === "processing" ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold">Memproses {fileName}...</p>
                  <p className="text-xs text-muted-foreground mt-1">Mengekstrak data dengan OCR</p>
                </div>
              </div>
            ) : state === "error" ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-medium">{error}</p>
                <Button variant="outline" size="sm" onClick={reset} className="rounded-xl">Coba Lagi</Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Drag & drop file di sini</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, atau PDF (maks 10MB)</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
