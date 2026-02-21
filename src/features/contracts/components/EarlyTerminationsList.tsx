import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { EarlyTerminationRequest } from "../types";
import { formatCurrency } from "@/shared/utils/currency";

interface EarlyTerminationsListProps {
  requests: EarlyTerminationRequest[];
  onReview: (request: EarlyTerminationRequest) => void;
}

export const EarlyTerminationsList = ({ requests, onReview }: EarlyTerminationsListProps) => {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
          <p className="text-muted-foreground">All early termination requests have been processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="border-warning">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Early Termination Request
                </CardTitle>
                <CardDescription>
                  {request.contract?.unit?.property?.name} - Unit {request.contract?.unit?.unit_number}
                </CardDescription>
              </div>
              <Badge variant="secondary">Pending Approval</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Requested Date</p>
                <p className="font-semibold">{format(new Date(request.requested_date), "MMM dd, yyyy")}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Penalty Amount</p>
                <p className="font-semibold text-destructive">
                  {formatCurrency(request.penalty_amount)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="font-semibold">{request.reason || "Not specified"}</p>
              </div>
            </div>
            <Button 
              onClick={() => onReview(request)}
            >
              Review Request
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
