import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Referral } from "../../types";
import { format } from "date-fns";
import { CheckCircle, ChevronLeft, ChevronRight, Gift, Loader2 } from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";

interface AdminReferralsTableProps {
  referrals: Referral[];
  isLoading?: boolean;
  totalReferrals: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPayout: (referral: Referral) => void;
  getProfileName: (userId: string | null) => string;
  rewardAmount: number;
}

export function AdminReferralsTable({
  referrals,
  isLoading,
  totalReferrals,
  currentPage,
  totalPages,
  onPageChange,
  onPayout,
  getProfileName,
  rewardAmount,
}: AdminReferralsTableProps) {
  const getStatusBadge = (status: string, rewardPaid: boolean) => {
    if (status === 'completed' && rewardPaid) {
      return <Badge className="bg-success/10 text-success border-success/20">Paid</Badge>;
    }
    if (status === 'completed') {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Payout</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Referrals</CardTitle>
        <CardDescription>View and manage referral submissions ({totalReferrals} total)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead className="hidden md:table-cell">Referee</TableHead>
                <TableHead className="hidden lg:table-cell">Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No referrals found
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-mono text-sm">{referral.referral_code}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{getProfileName(referral.referrer_user_id)}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          to {getProfileName(referral.referee_user_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{getProfileName(referral.referee_user_id)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="capitalize">{referral.referrer_role}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.status, referral.reward_paid)}</TableCell>
                    <TableCell>{formatCurrency(referral.reward_amount || rewardAmount)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {format(new Date(referral.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {referral.status === 'completed' && !referral.reward_paid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPayout(referral)}
                          className="h-8"
                        >
                          <Gift className="h-3.5 w-3.5 mr-1" />
                          Payout
                        </Button>
                      )}
                      {referral.reward_paid && (
                        <span className="text-sm text-success flex items-center gap-1 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Paid
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
