import { useAuditLogs } from '@/features/audit-logs/hooks/useAuditLogs';
import { AuditLogWithProfile } from '@/features/audit-logs/types/audit-log';
import { useAdminGuard } from '@/features/auth/hooks/useAdminGuard';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { DateRangePicker } from '@/shared/components/ui/date-range-picker';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { logExport } from '@/shared/utils/auditLog';
import { format } from 'date-fns';
import { Copy, Database, Download, Eye, Loader2, Search, Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

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

  const { logsData, isLoading, error, refetch, profilesMap } = useAuditLogs({
    searchQuery,
    action: actionFilter,
    entityType: entityFilter,
    dateRange: dateRange ? { from: dateRange.from, to: dateRange.to } : undefined,
    page,
    pageSize: PAGE_SIZE,
  }, isAdmin);

  const handleExport = () => {
    // Mock export function
    toast.success("Export started");
    logExport(null, "audit_logs", "csv");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track and monitor all system activities and changes
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>
              Filter and search through system audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="merchant">Merchant</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Filter by date"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : logsData?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No logs found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logsData?.data?.map((log: AuditLogWithProfile) => {
                      const profile = log.user_id ? profilesMap?.get(log.user_id) : null;
                      const userName = profile?.full_name || log.user_email || 'System';
                      
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{userName}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {profile?.email || log.user_id?.substring(0, 8)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`border-0 ${actionColors[log.action] || 'bg-gray-100'}`}>
                              {log.action.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {entityIcons[log.entity_type] || entityIcons.default}
                              <span className="capitalize">{log.entity_type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.ip_address || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Audit Log Details</DialogTitle>
                                  <DialogDescription>
                                    Transaction ID: {log.id}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">User</h4>
                                    <p className="text-sm">{userName}</p>
                                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Timestamp</h4>
                                    <p className="text-sm">{format(new Date(log.created_at), 'PPP pp')}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Action</h4>
                                    <p className="text-sm capitalize">{log.action}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Entity</h4>
                                    <p className="text-sm capitalize">{log.entity_type} ({log.entity_id})</p>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">IP Address</h4>
                                    <p className="text-sm font-mono">{log.ip_address || 'N/A'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">User Agent</h4>
                                    <p className="text-xs truncate" title={log.user_agent || ''}>
                                      {log.user_agent || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="mt-6 space-y-4">
                                  {log.old_data && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium">Previous Data</h4>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(log.old_data, null, 2))}>
                                          <Copy className="h-3 w-3 mr-1" /> Copy
                                        </Button>
                                      </div>
                                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">
                                        {JSON.stringify(log.old_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {log.new_data && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium">New Data</h4>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(log.new_data, null, 2))}>
                                          <Copy className="h-3 w-3 mr-1" /> Copy
                                        </Button>
                                      </div>
                                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">
                                        {JSON.stringify(log.new_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {!log.old_data && !log.new_data && log.metadata && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium">Metadata</h4>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(log.metadata, null, 2))}>
                                          <Copy className="h-3 w-3 mr-1" /> Copy
                                        </Button>
                                      </div>
                                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!logsData?.data || logsData.data.length < PAGE_SIZE || isLoading}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
