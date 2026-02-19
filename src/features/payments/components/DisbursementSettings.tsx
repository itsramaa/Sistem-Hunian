import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { toast } from "sonner";
import { Save, Loader2, Calendar, Wallet } from "lucide-react";
import { format } from "date-fns";
import {
  formatFeePercentage,
  MINIMUM_PAYOUT_AMOUNT,
  PAYOUT_SCHEDULE,
} from "@/constants/platformFees";

interface DisbursementSettingsProps {
  vendorId: string;
}

export const DisbursementSettings = ({ vendorId }: DisbursementSettingsProps) => {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState(PAYOUT_SCHEDULE);
  const [minThreshold, setMinThreshold] = useState(String(MINIMUM_PAYOUT_AMOUNT));

  // Fetch current vendor settings
  const { data: vendor } = useQuery({
    queryKey: ["vendor-disbursement-settings", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("disbursement_schedule, min_payout_threshold")
        .eq("id", vendorId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  // Fetch disbursement history
  const { data: disbursements = [] } = useQuery({
    queryKey: ["vendor-disbursement-history", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disbursements")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  useEffect(() => {
    if (vendor) {
      setSchedule(vendor.disbursement_schedule || PAYOUT_SCHEDULE);
      setMinThreshold(String(vendor.min_payout_threshold || MINIMUM_PAYOUT_AMOUNT));
    }
  }, [vendor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("vendors")
        .update({
          disbursement_schedule: schedule,
          min_payout_threshold: parseFloat(minThreshold),
        })
        .eq("id", vendorId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Disbursement settings saved");
      queryClient.invalidateQueries({ queryKey: ["vendor-disbursement-settings"] });
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="text-success border-success">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "processing":
        return <Badge variant="default">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Disbursement Schedule
          </CardTitle>
          <CardDescription>
            Configure how and when you receive your payouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schedule">Payout Frequency</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger id="schedule">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (Every Friday)</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often you want to receive payouts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Minimum Payout (IDR)</Label>
              <Input
                id="threshold"
                type="number"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                placeholder={String(MINIMUM_PAYOUT_AMOUNT)}
                min={String(MINIMUM_PAYOUT_AMOUNT)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum balance required to trigger payout
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Payout Information</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Payouts are processed automatically based on your schedule</li>
              <li>• A {formatFeePercentage()} platform fee is deducted from each payout</li>
              <li>• Funds are sent to your registered bank account</li>
              <li>• Processing time is typically 1-2 business days</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disbursement History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Disbursement History
          </CardTitle>
          <CardDescription>
            Recent payouts to your bank account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disbursements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disbursements.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {format(new Date(d.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>{formatCurrency(d.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      -{formatCurrency(d.fee_amount || 0)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(d.net_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(d.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No disbursements yet</p>
              <p className="text-sm">Your payout history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
