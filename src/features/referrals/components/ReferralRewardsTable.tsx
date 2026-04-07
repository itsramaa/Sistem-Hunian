import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";

interface ReferralReward {
  id: string;
  user_id: string;
  referral_id: string | null;
  type: string;
  amount: number;
  status: string;
  credited_at: string | null;
  created_at: string;
}

interface ReferralRewardsTableProps {
  rewards: ReferralReward[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalRewards: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function ReferralRewardsTable({
  rewards,
  loading,
  page,
  totalPages,
  totalRewards,
  onPageChange,
  itemsPerPage
}: ReferralRewardsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Belum ada reward yang diperoleh.</p>
        <p className="text-sm mt-1">Reward akan muncul di sini setelah referral Anda memenuhi syarat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipe</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.map((reward) => (
              <TableRow key={reward.id}>
                <TableCell className="font-medium capitalize">
                  {reward.type === 'commission' ? 'Komisi Referral' : 
                   reward.type === 'bonus' ? 'Bonus Pencapaian' : reward.type}
                </TableCell>
                <TableCell>
                  {format(new Date(reward.created_at), 'd MMM yyyy', { locale: id })}
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(reward.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={reward.status === 'credited' ? 'default' : 'secondary'}>
                    {reward.status === 'credited' ? 'Diterima' : reward.status}
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
            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalRewards)} of {totalRewards} rewards
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
