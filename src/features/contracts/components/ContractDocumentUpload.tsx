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
    if (file.type !== 'application/pdf') { toast.error('Please upload a PDF file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be less than 10MB'); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error('Please select a file first'); return; }
    setIsUploading(true);
    try {
      const publicUrl = await contractService.uploadContractDocument(contractId, selectedFile);
      onUploadComplete(publicUrl);
      setSelectedFile(null);
      toast.success('Contract document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveSelected = () => { setSelectedFile(null); };

  return (
    <div className="space-y-3">
      <Label>Contract Document (PDF)</Label>
      
      {currentDocumentUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Contract Document</p>
            <p className="text-xs text-muted-foreground">PDF uploaded</p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <a href={currentDocumentUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" />View
            </a>
          </Button>
        </div>
      ) : null}

      {!disabled && (
        <div className="space-y-2">
          {selectedFile ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveSelected} disabled={isUploading} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all p-4 text-center cursor-pointer">
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={disabled}
              />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload PDF</p>
            </div>
          )}

          {selectedFile && (
            <Button onClick={handleUpload} disabled={isUploading} className="w-full gradient-cta rounded-xl">
              {isUploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>) : (<><Upload className="h-4 w-4 mr-2" />Upload Document</>)}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {currentDocumentUrl ? 'Upload a new file to replace the existing document' : 'Upload a PDF contract document (max 10MB)'}
          </p>
        </div>
      )}
    </div>
  );
}
