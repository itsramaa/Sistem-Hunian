import { useState, useCallback } from "react";
import { z } from "zod";
import { apiClient } from "@/shared/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Upload, Download, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ColumnMapper, MappingField } from "@/shared/components/ColumnMapper";

const propertySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  property_type: z.enum(["kost", "kontrakan", "apartemen", "rumah", "lainnya"]).default("kost"),
  address: z.string().min(1, "Alamat wajib diisi"),
  city: z.string().min(1, "Kota wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
  postal_code: z.string().optional(),
  description: z.string().optional(),
});

const PROPERTY_FIELDS: MappingField[] = [
  { key: 'name', label: 'Nama Properti', required: true },
  { key: 'property_type', label: 'Tipe Properti', required: false },
  { key: 'address', label: 'Alamat', required: true },
  { key: 'city', label: 'Kota', required: true },
  { key: 'province', label: 'Provinsi', required: true },
  { key: 'postal_code', label: 'Kode Pos', required: false },
  { key: 'description', label: 'Deskripsi', required: false },
];

type ParsedRow = {
  data: Record<string, string>;
  valid: boolean;
  errors: string[];
  index: number;
};

interface PropertyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/['"]/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += char; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
  return { headers, rows };
}

function applyMapping(rows: Record<string, string>[], mapping: Record<string, string>): Record<string, string>[] {
  return rows.map(row => {
    const mapped: Record<string, string> = {};
    for (const [fieldKey, csvHeader] of Object.entries(mapping)) {
      if (csvHeader) mapped[fieldKey] = row[csvHeader] || "";
    }
    return mapped;
  });
}

export function PropertyImportDialog({ open, onOpenChange, onSuccess }: PropertyImportDialogProps) {
  const { merchant } = useAuth();
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "done">("upload");
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const [dragOver, setDragOver] = useState(false);

  const reset = () => { setStep("upload"); setRawRows([]); setCsvHeaders([]); setParsedRows([]); setImportProgress(0); setImportResults({ success: 0, failed: 0, errors: [] }); };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) { toast.error("Hanya file CSV yang didukung"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) { toast.error("File CSV kosong atau format tidak valid"); return; }
      setCsvHeaders(headers);
      setRawRows(rows);
      setStep("mapping");
    };
    reader.readAsText(file);
  }, []);

  const handleMappingConfirm = (mapping: Record<string, string>) => {
    const mappedRows = applyMapping(rawRows, mapping);
    const validated = mappedRows.map((data, index) => {
      const result = propertySchema.safeParse(data);
      return { data, valid: result.success, errors: result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`), index };
    });
    setParsedRows(validated);
    setStep("preview");
  };

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }, [handleFile]);

  const handleImport = async () => {
    if (!merchant?.id) return;
    setStep("importing");
    const validRows = parsedRows.filter((r) => r.valid);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const parsed = propertySchema.parse(row.data);

        // TODO: Go endpoint not yet implemented — was: supabase.from('addresses').insert(...)
        // TODO: Go endpoint not yet implemented — was: supabase.from('properties').insert(...)
        void parsed;
        success++;
      } catch (err) { failed++; errors.push(`Baris ${row.index + 2}: ${(err as Error).message}`); }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults({ success, failed, errors });
    setStep("done");
    if (success > 0) onSuccess?.();
  };

  const downloadTemplate = () => {
    const template = "name,property_type,address,city,province,postal_code,description\nKosan ABC,kost,Jl. Sudirman 123,Jakarta Selatan,DKI Jakarta,12345,Kosan nyaman dekat kampus\nKontrakan XYZ,kontrakan,Jl. Gatot Subroto 45,Bandung,Jawa Barat,40123,Kontrakan 2 lantai";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_properti.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import Properti dari CSV</DialogTitle>
          <DialogDescription>Upload file CSV untuk import data properti secara massal</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".csv"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); }; input.click(); }}
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drag & drop file CSV atau klik untuk memilih</p>
              <p className="text-xs text-muted-foreground mt-1">Format: name, property_type, address, city, province, postal_code, description</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4 mr-2" /> Download Template CSV</Button>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Petakan kolom CSV ke field yang sesuai. Kolom yang cocok otomatis terpilih.</p>
            <ColumnMapper
              csvHeaders={csvHeaders}
              requiredFields={PROPERTY_FIELDS}
              onConfirm={handleMappingConfirm}
              onCancel={reset}
            />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-success border-success/30">{validCount} valid</Badge>
              {invalidCount > 0 && <Badge variant="outline" className="text-destructive border-destructive/30">{invalidCount} error</Badge>}
            </div>
            <div className="overflow-x-auto max-h-60 border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Nama</th>
                    <th className="p-2 text-left">Tipe</th>
                    <th className="p-2 text-left">Kota</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr key={row.index} className={`border-t ${!row.valid ? "bg-destructive/5" : ""}`}>
                      <td className="p-2">{row.index + 2}</td>
                      <td className="p-2">{row.data.name || "-"}</td>
                      <td className="p-2">{row.data.property_type || "-"}</td>
                      <td className="p-2">{row.data.city || "-"}</td>
                      <td className="p-2">
                        {row.valid ? <CheckCircle2 className="h-4 w-4 text-success" /> : (
                          <span className="text-destructive" title={row.errors.join(", ")}><XCircle className="h-4 w-4 inline" /> {row.errors[0]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep("mapping")}>Kembali</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>Import {validCount} Properti</Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Mengimport properti...</p>
            <Progress value={importProgress} />
            <p className="text-xs text-muted-foreground">{importProgress}%</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <p className="font-semibold">Import Selesai</p>
              <div className="flex justify-center gap-4 text-sm">
                <span className="text-success font-medium">{importResults.success} berhasil</span>
                {importResults.failed > 0 && <span className="text-destructive font-medium">{importResults.failed} gagal</span>}
              </div>
            </div>
            {importResults.errors.length > 0 && (
              <div className="bg-destructive/5 rounded-lg p-3 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-destructive mb-1">Error Detail:</p>
                {importResults.errors.map((e, i) => <p key={i} className="text-xs text-destructive/80">{e}</p>)}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => { reset(); onOpenChange(false); }}>Tutup</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
