import { useAuth } from '@/features/auth/hooks/useAuth';
import { SLABadge } from '@/features/maintenance/components/SLABadge';
import { useMerchantMaintenanceRequests, useUpdateMaintenanceRequest, useVerifiedVendors } from '@/features/maintenance/hooks/useMaintenance';
import { MaintenanceRequest } from '@/features/maintenance/types';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { format } from 'date-fns';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Search, Wrench, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export default function MerchantMaintenance() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompletionWarning, setShowCompletionWarning] = useState(false);

  // Fetch maintenance requests
  const { data: requests = [], isLoading } = useMerchantMaintenanceRequests(merchant?.id);

  // Fetch verified vendors
  const { data: vendors = [] } = useVerifiedVendors();

  // Update mutation
  const updateMutation = useUpdateMaintenanceRequest();

  // Filter vendors by selected request's category
  const filteredVendors = selectedRequest 
    ? vendors.filter(v => 
        !v.service_categories || 
        v.service_categories.length === 0 || 
        v.service_categories.includes(selectedRequest.category)
      )
    : vendors;

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Wrench className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  // Get available statuses based on current status
  const getAvailableStatuses = (currentStatus: string) => {
    const transitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    return [currentStatus, ...transitions];
  };

  const handleUpdate = () => {
    if (!selectedRequest || !updateStatus) return;

    // Require completion notes when marking as completed
    if (updateStatus === 'completed' && !completionNotes.trim()) {
      setShowCompletionWarning(true);
      return;
    }

    // Validate agreed price if vendor is selected
    if (selectedVendorId && agreedPrice && parseFloat(agreedPrice) < 0) {
      toast({ title: 'Invalid price', description: 'Agreed price cannot be negative', variant: 'destructive' });
      return;
    }

    // Validate vendor category if assigning
    if (selectedVendorId) {
      const vendor = vendors.find(v => v.id === selectedVendorId);
      if (vendor?.service_categories && vendor.service_categories.length > 0) {
        if (!vendor.service_categories.includes(selectedRequest.category)) {
          toast({ title: 'Invalid vendor', description: `Vendor does not service ${selectedRequest.category} category`, variant: 'destructive' });
          return;
        }
      }
    }

    updateMutation.mutate({
      id: selectedRequest.id,
      status: updateStatus,
      assigned_vendor_id: selectedVendorId || undefined,
      agreed_price: agreedPrice ? parseFloat(agreedPrice) : undefined,
      notes: completionNotes || undefined,
      merchant_id: merchant?.id,
    }, {
      onSuccess: () => {
        toast({ title: 'Request updated successfully' });
        setSelectedRequest(null);
        setSelectedVendorId('');
        setAgreedPrice('');
        setCompletionNotes('');
        setShowCompletionWarning(false);
      },
      onError: (error: Error) => {
        toast({ title: 'Failed to update request', description: error.message, variant: 'destructive' });
      }
    });
  };

  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground">Manage maintenance requests from tenants</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{stats.completed}</p></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search requests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No maintenance requests found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const relevantContract = getRelevantContract(request.unit?.contracts, request.tenant_user_id);
                    
                    const isNotice = relevantContract?.status === 'notice';
                    const isTerminated = relevantContract?.status === 'terminated' || relevantContract?.status === 'expired';
                    
                    return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.unit?.unit_number}
                        {isNotice && (
                          <span title="Tenant in notice period" className="ml-2 text-yellow-600 inline-flex items-center">
                            <AlertTriangle className="h-3 w-3" />
                          </span>
                        )}
                        {isTerminated && (
                          <span title="Contract terminated/expired" className="ml-2 text-destructive inline-flex items-center">
                            <XCircle className="h-3 w-3" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{request.tenant?.full_name}</TableCell>
                      <TableCell className="font-medium">{request.title}</TableCell>
                      <TableCell className="capitalize">{request.category}</TableCell>
                      <TableCell><Badge variant={getPriorityColor(request.priority) as "default" | "secondary" | "destructive" | "outline"}>{request.priority}</Badge></TableCell>
                      <TableCell><Badge variant={getStatusColor(request.status) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">{getStatusIcon(request.status)}{request.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><SLABadge slaDeadline={request.sla_deadline} status={request.status} /></TableCell>
                      <TableCell>{request.assigned_to || '-'}</TableCell>
                      <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/merchant/maintenance/${request.id}`}>View</Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedRequest(request); setUpdateStatus(request.status); setSelectedVendorId(''); setAgreedPrice(''); }}>Update</Button>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => { setSelectedRequest(null); setShowCompletionWarning(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Maintenance Request</DialogTitle>
            <DialogDescription>Update status and assign vendor</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getPriorityColor(selectedRequest.priority) as any}>{selectedRequest.priority}</Badge>
                  <Badge variant="outline">{selectedRequest.category}</Badge>
                </div>
                <p className="font-medium">{selectedRequest.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedRequest.description || 'No description'}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={updateStatus} onValueChange={(value) => { setUpdateStatus(value); setShowCompletionWarning(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getAvailableStatuses(selectedRequest.status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {updateStatus === 'completed' && (
                <div className="space-y-2">
                  <Label>Completion Notes *</Label>
                  <Textarea 
                    value={completionNotes} 
                    onChange={(e) => { setCompletionNotes(e.target.value); setShowCompletionWarning(false); }}
                    placeholder="Describe what was done to resolve the issue..."
                    rows={3}
                  />
                  {showCompletionWarning && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Please provide completion notes before marking as completed</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Assign to Vendor</Label>
                {selectedRequest.assigned_vendor_id && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Currently assigned: {selectedRequest.assigned_to}
                  </p>
                )}
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No vendor</SelectItem>
                    {filteredVendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.business_name}
                        {vendor.service_categories?.length ? ` (${vendor.service_categories.join(', ')})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filteredVendors.length === 0 && (
                  <p className="text-sm text-warning">No verified vendors available for {selectedRequest.category} category</p>
                )}
              </div>

              {selectedVendorId && (
                <div className="space-y-2">
                  <Label>Agreed Price (IDR)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={agreedPrice} 
                    onChange={(e) => setAgreedPrice(e.target.value)} 
                    placeholder="Enter agreed price" 
                  />
                  {agreedPrice && parseFloat(agreedPrice) < 0 && (
                    <p className="text-sm text-destructive">Price cannot be negative</p>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => { setSelectedRequest(null); setShowCompletionWarning(false); }}>Cancel</Button>
                <Button 
                  onClick={handleUpdate} 
                  disabled={updateMutation.isPending || (selectedVendorId && agreedPrice && parseFloat(agreedPrice) < 0)}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}
