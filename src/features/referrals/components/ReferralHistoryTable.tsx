import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

interface ReferralHistoryTableProps {
  referrals: any[]; // Using any for now as the type was defined locally in Dashboard
  loading: boolean;
  page: number;
  totalPages: number;
  totalReferrals: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function ReferralHistoryTable({
  referrals,
  loading,
  page,
  totalPages,
  totalReferrals,
  onPageChange,
  itemsPerPage
}: ReferralHistoryTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Belum ada yang mendaftar menggunakan kode Anda.</p>
        <p className="text-sm mt-1">Bagikan link referral untuk mulai mengundang!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell className="font-medium">
                  {(ref.profiles as any)?.full_name || 'Pengguna Baru'}
                </TableCell>
                <TableCell className="capitalize">
                  {ref.referee_role || 'User'}
                </TableCell>
                <TableCell>
                  {format(new Date(ref.created_at), 'd MMM yyyy', { locale: id })}
                </TableCell>
                <TableCell>
                  <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'}>
                    {ref.status === 'completed' ? 'Selesai' : 
                     ref.status === 'pending' ? 'Menunggu' : ref.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalReferrals)} of {totalReferrals} referrals
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
