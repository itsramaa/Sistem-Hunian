import { AuditLogWithProfile } from "@/features/audit-logs/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { format } from "date-fns";
import { Copy, Database, Eye, Loader2, Settings, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface AuditLogTableProps {
  logs: AuditLogWithProfile[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  login: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  approve: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  reject: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  export: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
};

const entityIcons: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  merchant: <Shield className="h-4 w-4" />,
  vendor: <Shield className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  default: <Database className="h-4 w-4" />,
};

export function AuditLogTable({
  logs,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: AuditLogTableProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md text-muted-foreground">
        No audit logs found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Entity</TableHead>
              <TableHead className="hidden lg:table-cell">Changes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap font-medium">
                  {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {log.user_name || "System/Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {log.user_email || log.user_id || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant="outline"
                      className={`${
                        actionColors[log.action] ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      } border-0 w-fit`}
                    >
                      {log.action.toUpperCase()}
                    </Badge>
                    <div className="md:hidden text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <span className="capitalize">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id.substring(0, 4)}` : ""}
                      </span>
                    </div>
                    {log.new_data && Object.keys(log.new_data).length > 0 && (
                      <div className="lg:hidden text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                        Changes: {Object.keys(log.new_data).join(", ")}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    {entityIcons[log.entity_type] || entityIcons.default}
                    <span className="capitalize">{log.entity_type}</span>
                    {log.entity_id && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ({log.entity_id.substring(0, 8)}...)
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {log.new_data
                      ? JSON.stringify(log.new_data)
                      : "No changes recorded"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                          ID: {log.id} • {format(new Date(log.created_at), "PPP p")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">User Info</h4>
                            <div className="text-sm space-y-1 bg-muted p-3 rounded-md">
                              <p>User: {log.user_name || "N/A"}</p>
                              <p>Email: {log.user_email || "N/A"}</p>
                              <p>ID: {log.user_id}</p>
                              <p>IP: {log.ip_address || "Unknown"}</p>
                              <p>Agent: {log.user_agent || "Unknown"}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Action Info</h4>
                            <div className="text-sm space-y-1 bg-muted p-3 rounded-md">
                              <p>Action: {log.action}</p>
                              <p>Entity: {log.entity_type}</p>
                              <p>Entity ID: {log.entity_id}</p>
                            </div>
                          </div>
                        </div>

                        {log.old_data && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Old Data</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(JSON.stringify(log.old_data, null, 2))
                                }
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
                              {JSON.stringify(log.old_data, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.new_data && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">New Data</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(JSON.stringify(log.new_data, null, 2))
                                }
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
                              {JSON.stringify(log.new_data, null, 2)}
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
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1 || isLoading}
        >
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
