import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Search, CheckCircle, Clock, Eye, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const AdminDisputes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("");

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          contract:contracts (
            id,
            unit:units (
              unit_number,
              property:properties (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resolveDispute = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution: string }) => {
      const { error } = await supabase
        .from('disputes')
        .update({
          status,
          resolution,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Dispute resolved');
      setShowResolveDialog(false);
      setSelectedDispute(null);
      setResolution("");
    },
    onError: () => toast.error('Failed to resolve dispute'),
  });

  const getStatusBadge = (status: string) => {
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredDisputes = disputes?.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const openCount = disputes?.filter(d => d.status === 'open').length || 0;
  const inProgressCount = disputes?.filter(d => d.status === 'in_progress').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Disputes</h1>
          <p className="text-muted-foreground">Manage and resolve disputes between parties</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Disputes</p>
                <p className="text-2xl font-bold">{disputes?.length || 0}</p>
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
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{disputes?.filter(d => d.status === 'resolved').length || 0}</p>
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
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDisputes.length > 0 ? (
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
                      <TableCell>{getPriorityBadge(dispute.priority || 'medium')}</TableCell>
                      <TableCell>{getStatusBadge(dispute.status || 'open')}</TableCell>
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
                    <Label>Resolution</Label>
                    <Textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Describe how this dispute was resolved..."
                      rows={4}
                    />
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
                      onClick={() => resolveDispute.mutate({ id: selectedDispute.id, status: 'in_progress', resolution: '' })}
                      disabled={resolveDispute.isPending}
                    >
                      Mark In Progress
                    </Button>
                  )}
                  <Button
                    onClick={() => resolveDispute.mutate({ id: selectedDispute.id, status: 'resolved', resolution })}
                    disabled={resolveDispute.isPending || !resolution}
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
