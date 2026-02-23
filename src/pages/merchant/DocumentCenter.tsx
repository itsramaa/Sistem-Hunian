import { useState, useMemo } from "react";
import { FileSearch, Eye } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ConfidenceBadge } from "@/shared/components/dss/ConfidenceBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOcrResults, useUpdateOcrResult } from "@/features/dss/hooks/useOcrDocuments";
import { OcrDocumentViewer } from "@/features/dss/components/OcrDocumentViewer";
import { OcrResultEditor } from "@/features/dss/components/OcrResultEditor";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const DOC_TYPE_LABELS: Record<string, string> = {
  ktp: "KTP",
  payment_proof: "Bukti Bayar",
  business_doc: "Dok. Bisnis",
  compliance_doc: "Dok. Kepatuhan",
  maintenance_receipt: "Nota Maintenance",
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Selesai", variant: "default" },
  requires_review: { label: "Perlu Review", variant: "secondary" },
  processing: { label: "Proses", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
  rejected: { label: "Ditolak", variant: "destructive" },
};

export default function DocumentCenter() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = useMemo(() => {
    const f: Record<string, string | boolean> = {};
    if (typeFilter !== "all") f.documentType = typeFilter;
    if (statusFilter !== "all") f.status = statusFilter;
    return Object.keys(f).length ? f : undefined;
  }, [typeFilter, statusFilter]);

  const { data: results, isLoading } = useOcrResults(merchantId, filters as any);
  const updateMutation = useUpdateOcrResult();

  const selectedResult = results?.find((r) => r.id === selectedId);

  const handleSave = (data: {
    extracted_data: Record<string, unknown>;
    status: string;
    review_notes: string;
  }) => {
    if (!selectedId || !merchantId) return;
    updateMutation.mutate(
      {
        id: selectedId,
        updates: {
          extracted_data: data.extracted_data,
          status: data.status,
          review_notes: data.review_notes,
          reviewed_at: new Date().toISOString(),
          requires_review: false,
        },
      },
      {
        onSuccess: () => {
          toast.success("Dokumen berhasil diperbarui");
          setSelectedId(null);
        },
        onError: () => toast.error("Gagal memperbarui dokumen"),
      }
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader icon={FileSearch} title="Pusat Dokumen" description="Kelola dan review hasil OCR dokumen" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipe Dokumen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Memuat data...</div>
      ) : !results?.length ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Belum ada dokumen OCR</div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipe Dokumen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Tanggal Upload</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row) => {
                const st = STATUS_LABELS[row.status] || { label: row.status, variant: "outline" as const };
                return (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelectedId(row.id)}>
                    <TableCell className="font-medium">
                      {DOC_TYPE_LABELS[row.document_type] || row.document_type}
                      {row.requires_review && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Review</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.confidence_score != null ? (
                        <ConfidenceBadge confidence={row.confidence_score} size="sm" />
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(row.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Detail Dokumen —{" "}
              {selectedResult
                ? DOC_TYPE_LABELS[selectedResult.document_type] || selectedResult.document_type
                : ""}
            </SheetTitle>
          </SheetHeader>

          {selectedResult && (
            <div className="mt-6 space-y-6">
              {/* Document preview */}
              <OcrDocumentViewer
                documentUrl={selectedResult.document_url}
                extractedFields={selectedResult.extracted_data as Record<string, unknown> | undefined}
              />

              {/* Editor */}
              <OcrResultEditor
                extractedData={selectedResult.extracted_data as Record<string, unknown> | null}
                originalData={selectedResult.extracted_data as Record<string, unknown> | null}
                reviewNotes={selectedResult.review_notes}
                status={selectedResult.status}
                onSave={handleSave}
                saving={updateMutation.isPending}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
