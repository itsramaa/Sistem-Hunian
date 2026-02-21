import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MaintenanceRequest, UpdateMaintenanceStatusPayload } from '../types';

interface Vendor {
  id: string;
  business_name: string;
  service_categories?: string[];
}

interface UpdateMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: MaintenanceRequest | null;
  vendors: Vendor[];
  onSubmit: (data: UpdateMaintenanceStatusPayload) => void;
  loading: boolean;
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function UpdateMaintenanceDialog({
  open,
  onOpenChange,
  request,
  vendors,
  onSubmit,
  loading,
}: UpdateMaintenanceDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showCompletionWarning, setShowCompletionWarning] = useState(false);

  useEffect(() => {
    if (open && request) {
      setStatus(request.status);
      setVendorId(request.assigned_vendor_id || '');
      setPrice(''); // Reset price for new update
      setNotes('');
      setShowCompletionWarning(false);
    }
  }, [open, request]);

  if (!request) return null;

  const availableStatuses = [
    request.status,
    ...(VALID_STATUS_TRANSITIONS[request.status] || []),
  ];

  // Filter vendors based on category
  const filteredVendors = vendors.filter(v => 
    !v.service_categories || 
    v.service_categories.length === 0 || 
    v.service_categories.includes(request.category)
  );

  const handleSubmit = () => {
    // Validate status change
    if (status === request.status && !vendorId && !notes) {
      onOpenChange(false);
      return;
    }

    // Require completion notes when marking as completed
    if (status === 'completed' && !notes.trim()) {
      setShowCompletionWarning(true);
      return;
    }

    // Validate agreed price
    if (vendorId && price && parseFloat(price) < 0) {
      toast({ 
        title: 'Invalid price', 
        description: 'Agreed price cannot be negative', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate vendor category if assigning
    if (vendorId) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor?.service_categories && vendor.service_categories.length > 0) {
        if (!vendor.service_categories.includes(request.category)) {
          toast({ 
            title: 'Invalid vendor', 
            description: `Vendor does not service ${request.category} category`, 
            variant: 'destructive' 
          });
          return;
        }
      }
    }

    onSubmit({
      id: request.id,
      status,
      assigned_vendor_id: vendorId || undefined,
      agreed_price: price ? parseFloat(price) : undefined,
      notes: notes || undefined,
      merchant_id: request.merchant_id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Request Status</DialogTitle>
          <DialogDescription>
            Update status, assign vendor, or add notes for request #{request.title}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vendor">Assign Vendor (Optional)</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No Vendor</SelectItem>
                {filteredVendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {vendorId && vendorId !== 'unassigned' && (
            <div className="grid gap-2">
              <Label htmlFor="price">Agreed Price (Optional)</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter amount"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">
              Notes
              {status === 'completed' && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={status === 'completed' 
                ? "Please describe the work done..." 
                : "Add any updates or notes..."
              }
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (e.target.value.trim()) setShowCompletionWarning(false);
              }}
              className={showCompletionWarning ? 'border-destructive' : ''}
            />
            {showCompletionWarning && (
              <p className="text-xs text-destructive">
                Completion notes are required when marking a request as completed.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
