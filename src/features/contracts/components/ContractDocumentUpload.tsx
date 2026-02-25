import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Download, FileText, Loader2, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { contractService } from '../services/contractService';

interface ContractDocumentUploadProps {
  contractId: string;
  currentDocumentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

export function ContractDocumentUpload({
  contractId, currentDocumentUrl, onUploadComplete, disabled = false,
}: ContractDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Silakan unggah file PDF'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Ukuran file harus kurang dari 10MB'); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error('Silakan pilih file terlebih dahulu'); return; }
    setIsUploading(true);
    try {
      const publicUrl = await contractService.uploadContractDocument(contractId, selectedFile);
      onUploadComplete(publicUrl);
      setSelectedFile(null);
      toast.success('Dokumen kontrak berhasil diunggah');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengunggah dokumen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveSelected = () => { setSelectedFile(null); };

  return (
    <div className="space-y-3">
      <Label htmlFor="contract-upload">Dokumen Kontrak (PDF)</Label>
      
      {currentDocumentUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40" role="status">
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Dokumen Kontrak</p>
            <p className="text-xs text-muted-foreground">PDF telah diunggah</p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <a href={currentDocumentUrl} target="_blank" rel="noopener noreferrer" aria-label="Lihat dokumen kontrak yang sudah diunggah">
              <Download className="h-4 w-4 mr-1" aria-hidden="true" />Lihat
            </a>
          </Button>
        </div>
      ) : null}

      {!disabled && (
        <div className="space-y-2">
          {selectedFile ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20" role="status">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveSelected} disabled={isUploading} className="rounded-full" aria-label="Hapus file terpilih">
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="relative rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all p-4 text-center cursor-pointer">
              <Input
                id="contract-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={disabled}
                aria-label="Unggah dokumen kontrak dalam format PDF"
              />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Klik untuk unggah PDF</p>
            </div>
          )}

          {selectedFile && (
            <Button onClick={handleUpload} disabled={isUploading} className="w-full gradient-cta rounded-xl">
              {isUploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />Mengunggah...</>) : (<><Upload className="h-4 w-4 mr-2" aria-hidden="true" />Unggah Dokumen</>)}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {currentDocumentUrl ? 'Unggah file baru untuk mengganti dokumen yang ada' : 'Unggah dokumen kontrak PDF (maks 10MB)'}
          </p>
        </div>
      )}
    </div>
  );
}
