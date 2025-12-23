import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Download, Loader2, X } from 'lucide-react';

interface ContractDocumentUploadProps {
  contractId: string;
  currentDocumentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

export function ContractDocumentUpload({
  contractId,
  currentDocumentUrl,
  onUploadComplete,
  disabled = false,
}: ContractDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${contractId}/${Date.now()}_${selectedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(fileName, selectedFile, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contract-documents')
        .getPublicUrl(fileName);

      // Update contract with document URL
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ contract_document_url: publicUrl })
        .eq('id', contractId);

      if (updateError) throw updateError;

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

  const handleRemoveSelected = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-3">
      <Label>Contract Document (PDF)</Label>
      
      {currentDocumentUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Contract Document</p>
            <p className="text-xs text-muted-foreground">PDF uploaded</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={currentDocumentUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" />
              View
            </a>
          </Button>
        </div>
      ) : null}

      {!disabled && (
        <div className="space-y-2">
          {selectedFile ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveSelected}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="cursor-pointer"
                disabled={disabled}
              />
            </div>
          )}

          {selectedFile && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {currentDocumentUrl 
              ? 'Upload a new file to replace the existing document' 
              : 'Upload a PDF contract document (max 10MB)'}
          </p>
        </div>
      )}
    </div>
  );
}
