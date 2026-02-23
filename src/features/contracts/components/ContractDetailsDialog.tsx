import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
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

export function ContractDetailsDialog({ open, onOpenChange, contract, tenantName, onEditTerms, onUploadComplete }: ContractDetailsDialogProps) {
  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Contract Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="gradient-icon-box w-12 h-12">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-lg">{contract.unit?.property?.name} - Unit {contract.unit?.unit_number}</p>
              <p className="text-muted-foreground">{contract.unit?.property?.address}, {contract.unit?.property?.city}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Tenant', value: tenantName },
              { label: 'Status', value: <div className="mt-1"><ContractStatusBadge status={contract.status} /></div> },
              { label: 'Start Date', value: format(new Date(contract.start_date), 'MMMM dd, yyyy') },
              { label: 'End Date', value: format(new Date(contract.end_date), 'MMMM dd, yyyy') },
              { label: 'Monthly Rent', value: formatCurrency(contract.rent_amount) },
              { label: 'Deposit', value: formatCurrency(contract.deposit_amount || 0) },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                {typeof item.value === 'string' ? <p className="font-medium">{item.value}</p> : item.value}
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="border border-border/40 rounded-2xl p-4 space-y-4 bg-card/80 backdrop-blur-sm">
            <h4 className="font-medium">Signatures</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Tenant Signature', url: contract.tenant_signature_url, date: contract.tenant_signed_at, alt: 'Tenant signature' },
                { label: 'Merchant Signature (You)', url: contract.merchant_signature_url, date: contract.merchant_signed_at, alt: 'Merchant signature' },
              ].map((sig, i) => (
                <div key={i}>
                  <p className="text-sm text-muted-foreground mb-2">{sig.label}</p>
                  {sig.url ? (
                    <div className="border border-border/40 rounded-xl p-3 bg-background">
                      <img src={sig.url} alt={sig.alt} className="max-h-16 object-contain" />
                      <p className="text-xs text-muted-foreground mt-2">Signed: {sig.date && format(new Date(sig.date), 'MMM dd, yyyy h:mm a')}</p>
                    </div>
                  ) : (
                    <div className="border border-border/40 rounded-xl p-3 bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground">Not signed yet</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Document Upload */}
          <div className="border border-border/40 rounded-2xl p-4 bg-card/80 backdrop-blur-sm">
            <ContractDocumentUpload contractId={contract.id} currentDocumentUrl={contract.contract_document_url} onUploadComplete={onUploadComplete} />
          </div>

          <div className="border border-border/40 rounded-2xl p-4 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Terms & Conditions</h4>
              <Button variant="outline" size="sm" onClick={onEditTerms} className="rounded-xl"><Edit className="h-3 w-3 mr-1" />Edit Terms</Button>
            </div>
            {contract.terms ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.terms}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No terms specified. Click "Edit Terms" to add.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Close</Button>
          {contract.contract_document_url && (
            <Button variant="default" asChild className="gradient-cta text-primary-foreground rounded-xl">
              <a href={contract.contract_document_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 mr-2" />Download Contract</a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
