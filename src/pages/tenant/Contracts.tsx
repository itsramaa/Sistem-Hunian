import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Calendar, Home, Download, DollarSign, PenLine, CheckCircle, LogOut, AlertTriangle } from "lucide-react";
import { ContractCardSkeleton } from "@/components/ui/skeletons";
import { format, differenceInDays } from "date-fns";
import { MoveOutNoticeDialog } from "@/components/tenant/MoveOutNoticeDialog";
import { MoveOutDashboard } from "@/components/tenant/MoveOutDashboard";

const TenantContracts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [moveOutDialogOpen, setMoveOutDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const { data: contracts, isLoading, refetch } = useQuery({
    queryKey: ['tenant-contracts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          unit:units (
            unit_number,
            property:properties (
              name,
              address,
              city
            )
          )
        `)
        .eq('tenant_user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getSignatureStatusBadge = (contract: typeof activeContract) => {
    if (!contract) return null;
    if (contract.signature_status === 'fully_signed') {
      return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle className="h-3 w-3" /> Fully Signed</Badge>;
    }
    if (contract.tenant_signature_url) {
      return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> You Signed</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><PenLine className="h-3 w-3" /> Pending Signature</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <TenantLayout title="My Contracts">
        <ContractCardSkeleton />
      </TenantLayout>
    );
  }

  const activeContract = contracts?.find(c => c.status === 'active');
  const pastContracts = contracts?.filter(c => c.status !== 'active') || [];

  return (
    <TenantLayout 
      title="My Contracts"
      description="View your rental agreements"
    >
      {activeContract && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Current Contract</h2>
          <Card className="border-primary/20">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {activeContract.unit?.property?.name} - Unit {activeContract.unit?.unit_number}
                    </CardTitle>
                    <CardDescription>
                      {activeContract.unit?.property?.address}, {activeContract.unit?.property?.city}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(activeContract.status || 'active')}
                  {getSignatureStatusBadge(activeContract)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Start Date</span>
                  </div>
                  <p className="font-semibold">{format(new Date(activeContract.start_date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">End Date</span>
                  </div>
                  <p className="font-semibold">{format(new Date(activeContract.end_date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Monthly Rent</span>
                  </div>
                  <p className="font-semibold">R {Number(activeContract.rent_amount).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Deposit</span>
                  </div>
                  <p className="font-semibold">R {Number(activeContract.deposit_amount || 0).toLocaleString()}</p>
                </div>
              </div>

              {activeContract.terms && (
                <div className="p-4 rounded-lg border mb-6">
                  <h4 className="font-medium mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeContract.terms}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {!activeContract.tenant_signature_url && (
                  <Button onClick={() => navigate(`/tenant/sign-contract/${activeContract.id}`)}>
                    <PenLine className="h-4 w-4 mr-2" />
                    Sign Contract
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (activeContract.contract_document_url) {
                      window.open(activeContract.contract_document_url, '_blank');
                    } else {
                      window.open(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice-pdf?contract_id=${activeContract.id}`, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Contract
                </Button>
                
                {!activeContract.move_out_notice_given && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedContract(activeContract);
                        setMoveOutDialogOpen(true);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Give Move-Out Notice
                    </Button>
                    {differenceInDays(new Date(activeContract.end_date), new Date()) > 30 && (
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          setSelectedContract({ ...activeContract, isEarlyTermination: true });
                          setMoveOutDialogOpen(true);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Request Early Termination
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
          
          {activeContract.move_out_notice_given && (
            <MoveOutDashboard contractId={activeContract.id} />
          )}
        </section>
      )}

      {pastContracts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Contract History</h2>
          <div className="space-y-4">
            {pastContracts.map((contract) => (
              <Card key={contract.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {contract.unit?.property?.name} - Unit {contract.unit?.unit_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(contract.start_date), 'MMM yyyy')} - {format(new Date(contract.end_date), 'MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        R {Number(contract.rent_amount).toLocaleString()}/mo
                      </span>
                      {getStatusBadge(contract.status || 'expired')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!contracts?.length && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Contracts Found</h3>
            <p className="text-muted-foreground">You don't have any rental contracts yet.</p>
          </CardContent>
        </Card>
      )}
      
      {selectedContract && (
        <MoveOutNoticeDialog 
          open={moveOutDialogOpen}
          onOpenChange={setMoveOutDialogOpen}
          contract={selectedContract}
          isEarlyTermination={selectedContract?.isEarlyTermination}
          onSuccess={() => {
            refetch();
            setMoveOutDialogOpen(false);
          }}
        />
      )}
    </TenantLayout>
  );
};

export default TenantContracts;
