import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, Eye, Shield, AlertTriangle, User, Database, Settings, Download, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { logExport } from '@/lib/auditLog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

type AuditLogWithProfile = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: unknown;
  new_data: unknown;
  ip_address: string | null;
  user_agent: string | null;
  metadata: unknown;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  login: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  logout: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  approve: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  reject: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  export: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
};

const entityIcons: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  merchant: <Shield className="h-4 w-4" />,
  vendor: <Shield className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  default: <Database className="h-4 w-4" />,
};

const PAGE_SIZE = 50;

export default function AuditLogs() {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<AuditLogWithProfile | null>(null);
  const [page, setPage] = useState(1);

  // Fetch profiles for user name lookup
  const { data: profilesMap } = useQuery({
    queryKey: ['profiles-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');
      if (error) throw error;
      const map = new Map<string, { full_name: string | null; email: string | null }>();
      (data || []).forEach(p => {
        map.set(p.user_id, { full_name: p.full_name, email: p.email });
      });
      return map;
    },
    enabled: isAdmin,
  });

  const { data: logsData, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', actionFilter, entityFilter, dateRange, page],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data || [], total: count || 0 };
    },
    enabled: isAdmin,
  });

  // Enrich logs with profile data
  const logs: AuditLogWithProfile[] = (logsData?.logs || []).map(log => {
    const profile = log.user_id ? profilesMap?.get(log.user_id) : null;
    return {
      ...log,
      user_name: profile?.full_name || null,
      user_email: profile?.email || null,
    };
  });

  const totalCount = logsData?.total || 0;
  const hasMore = page * PAGE_SIZE < totalCount;

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search) ||
      log.entity_id?.toLowerCase().includes(search) ||
      log.user_id?.toLowerCase().includes(search) ||
      log.user_name?.toLowerCase().includes(search) ||
      log.user_email?.toLowerCase().includes(search)
    );
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueEntities = [...new Set(logs.map((l) => l.entity_type))];

  const stats = {
    total: totalCount,
    today: logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
    security: logs.filter((l) => ['login', 'logout', 'password_change', '2fa_enabled'].includes(l.action)).length,
    critical: logs.filter((l) => ['delete', 'reject'].includes(l.action)).length,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const escapeCSV = (value: string | null | undefined) => {
    if (!value) return '';
    const escaped = value.replace(/"/g, '""');
    return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
      ? `"${escaped}"`
      : escaped;
  };

  const exportLogs = async () => {
    const csv = [
      ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User ID', 'User Name', 'IP Address'],
      ...filteredLogs.map((log) => [
        escapeCSV(log.created_at),
        escapeCSV(log.action),
        escapeCSV(log.entity_type),
        escapeCSV(log.entity_id),
        escapeCSV(log.user_id),
        escapeCSV(log.user_name || log.user_email || ''),
        escapeCSV(log.ip_address),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    await logExport('audit_log', 'csv', filteredLogs.length, {
      action_filter: actionFilter,
      entity_filter: entityFilter,
      date_range: dateRange,
    });
    toast.success(`Exported ${filteredLogs.length} audit logs`);
  };

  const getUserDisplay = (log: AuditLogWithProfile) => {
    if (log.user_name) return log.user_name;
    if (log.user_email) return log.user_email;
    if (log.user_id) return `${log.user_id.slice(0, 8)}...`;
    return '-';
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">Track all system actions and security events</p>
          </div>
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.security}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <DateRangePicker
                value={dateRange}
                onChange={(range) => { setDateRange(range); setPage(1); }}
                placeholder="Filter by date"
              />
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {uniqueEntities.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {totalCount} logs (Page {page})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive">Failed to load audit logs: {(error as Error).message}</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading audit logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entityIcons[log.entity_type] || entityIcons.default}
                            <span>{log.entity_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm truncate max-w-[120px]">
                                    {getUserDisplay(log)}
                                  </span>
                                  {log.user_id && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => copyToClipboard(log.user_id!)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{log.user_id || 'No user'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.ip_address || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Audit Log Details</DialogTitle>
                                <DialogDescription>
                                  {format(new Date(log.created_at), 'PPpp')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Action</label>
                                    <p className="mt-1">
                                      <Badge className={actionColors[log.action] || 'bg-gray-100'}>
                                        {log.action}
                                      </Badge>
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
                                    <p className="mt-1">{log.entity_type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Entity ID</label>
                                    <div className="mt-1 flex items-center gap-1">
                                      <span className="font-mono text-sm">{log.entity_id || '-'}</span>
                                      {log.entity_id && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => copyToClipboard(log.entity_id!)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">User</label>
                                    <div className="mt-1 flex items-center gap-1">
                                      <span className="text-sm">{getUserDisplay(log)}</span>
                                      {log.user_id && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => copyToClipboard(log.user_id!)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                                    <p className="mt-1 font-mono text-sm">{log.ip_address || '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                                    <p className="mt-1 text-xs truncate">{log.user_agent || '-'}</p>
                                  </div>
                                </div>
                                {log.old_data && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Previous Data</label>
                                    <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
                                      {JSON.stringify(log.old_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_data && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">New Data</label>
                                    <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
                                      {JSON.stringify(log.new_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                                    <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(totalCount / PAGE_SIZE)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
