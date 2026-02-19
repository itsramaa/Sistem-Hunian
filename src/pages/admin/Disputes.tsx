import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDisputes } from "@/features/disputes/hooks/useDisputes";
import { Dispute } from "@/features/disputes/types";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";
import { format } from "date-fns";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Eye, Loader2, MessageSquare, Search } from "lucide-react";
import { useState } from "react";

const AdminDisputes = () => {
  const { user } = useAuth();
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const {
    disputes,
    totalCount,
    hasMore,
    isLoading,
    error,
    refetch,
    resolveDispute
  } = useDisputes(page, PAGE_SIZE, isAdmin);

  const handleResolve = (status: string, resolutionText: string) => {
    if (!selectedDispute || !user) return;
    
    resolveDispute.mutate({
      params: {
        id: selectedDispute.id,
        status,
        resolution: resolutionText,
        resolved_by: user.id
      },
      currentStatus: selectedDispute.status || 'open'
    }, {
      onSuccess: () => {
        setShowResolveDialog(false);
        setSelectedDispute(null);
        setResolution("");
      }
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</Badge>;
      case 'open':
        return <Badge variant="secondary" className="bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" /> Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-info/10 text-info"><MessageSquare className="h-3 w-3 mr-1" /> In Progress</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="animate-pulse">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority || 'Medium'}</Badge>;
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = disputes.filter(d => d.status === 'open').length;
  const inProgressCount = disputes.filter(d => d.status === 'in_progress').length;
  const urgentCount = disputes.filter(d => d.priority === 'urgent' || d.priority === 'high').length;

  if (guardLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Disputes</h1>
          <p className="text-muted-foreground">Manage and resolve disputes between parties</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Disputes</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <MessageSquare className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={urgentCount > 0 ? 'border-destructive/50 bg-destructive/5' : ''}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${urgentCount > 0 ? 'bg-destructive/20' : 'bg-muted'}`}>
                <AlertCircle className={`h-6 w-6 ${urgentCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent/High</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{disputes.filter(d => d.status === 'resolved').length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <CardTitle>All Disputes</CardTitle>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search disputes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive mb-4">Failed to load disputes</p>
                <Button variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDisputes.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dispute.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{dispute.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dispute.contract?.unit?.property?.name || '-'} - {dispute.contract?.unit?.unit_number || ''}
                        </TableCell>
                        <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                        <TableCell>{format(new Date(dispute.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowResolveDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMore}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No disputes found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolve Dialog */}
        <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Dispute</DialogTitle>
              <DialogDescription>
                Review dispute details and provide a resolution
              </DialogDescription>
            </DialogHeader>
            {selectedDispute && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <p className="font-medium">{selectedDispute.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedDispute.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Priority</Label>
                    <div>{getPriorityBadge(selectedDispute.priority)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div>{getStatusBadge(selectedDispute.status)}</div>
                  </div>
                </div>
                
                {selectedDispute.status !== 'resolved' && (
                  <div className="space-y-2">
                    <Label>Resolution <span className="text-destructive">*</span></Label>
                    <Textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Describe how this dispute was resolved... (minimum 10 characters)"
                      rows={4}
                    />
                    {resolution.length > 0 && resolution.length < 10 && (
                      <p className="text-xs text-destructive">Resolution must be at least 10 characters</p>
                    )}
                  </div>
                )}

                {selectedDispute.resolution && (
                  <div>
                    <Label className="text-muted-foreground">Resolution</Label>
                    <p className="text-sm p-3 bg-muted/50 rounded-lg">{selectedDispute.resolution}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                Cancel
              </Button>
              {selectedDispute?.status !== 'resolved' && (
                <>
                  {selectedDispute?.status === 'open' && (
                    <Button
                      variant="secondary"
                      onClick={() => handleResolve('in_progress', '')}
                      disabled={resolveDispute.isPending}
                    >
                      Mark In Progress
                    </Button>
                  )}
                  <Button
                    onClick={() => handleResolve('resolved', resolution)}
                    disabled={resolveDispute.isPending || resolution.length < 10}
                  >
                    {resolveDispute.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Resolve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDisputes;
