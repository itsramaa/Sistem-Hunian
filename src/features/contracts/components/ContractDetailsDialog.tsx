import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { Download, Edit, FileText } from 'lucide-react';
import { Contract } from '../types';
import { ContractDocumentUpload } from './ContractDocumentUpload';
import { ContractStatusBadge } from './ContractStatusBadge';

interface ContractDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  tenantName: string;
  onEditTerms: () => void;
  onUploadComplete: () => void;
}

export function ContractDetailsDialog({
  open,
  onOpenChange,
  contract,
  tenantName,
  onEditTerms,
  onUploadComplete,
}: ContractDetailsDialogProps) {
  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contract Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-lg">
                {contract.unit?.property?.name} - Unit {contract.unit?.unit_number}
              </p>
              <p className="text-muted-foreground">
                {contract.unit?.property?.address}, {contract.unit?.property?.city}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Tenant</p>
              <p className="font-medium">{tenantName}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1"><ContractStatusBadge status={contract.status} /></div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(contract.start_date), 'MMMM dd, yyyy')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{format(new Date(contract.end_date), 'MMMM dd, yyyy')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Monthly Rent</p>
              <p className="font-medium">{formatCurrency(contract.rent_amount)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Deposit</p>
              <p className="font-medium">{formatCurrency(contract.deposit_amount || 0)}</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Signatures</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tenant Signature</p>
                {contract.tenant_signature_url ? (
                  <div className="border rounded-lg p-3 bg-white">
                    <img 
                      src={contract.tenant_signature_url} 
                      alt="Tenant signature"
                      className="max-h-16 object-contain"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Signed: {contract.tenant_signed_at && format(new Date(contract.tenant_signed_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">Not signed yet</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Merchant Signature (You)</p>
                {contract.merchant_signature_url ? (
                  <div className="border rounded-lg p-3 bg-white">
                    <img 
                      src={contract.merchant_signature_url} 
                      alt="Merchant signature"
                      className="max-h-16 object-contain"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Signed: {contract.merchant_signed_at && format(new Date(contract.merchant_signed_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">Not signed yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract Document Upload */}
          <div className="border rounded-lg p-4">
            <ContractDocumentUpload
              contractId={contract.id}
              currentDocumentUrl={contract.contract_document_url}
              onUploadComplete={onUploadComplete}
            />
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Terms & Conditions</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onEditTerms}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Terms
              </Button>
            </div>
            {contract.terms ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.terms}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No terms specified. Click "Edit Terms" to add.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {contract.contract_document_url && (
             <Button variant="default" asChild>
               <a href={contract.contract_document_url} target="_blank" rel="noopener noreferrer">
                 <Download className="h-4 w-4 mr-2" />
                 Download Contract
               </a>
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
