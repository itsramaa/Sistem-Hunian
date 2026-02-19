import { useAuth } from "@/features/auth/hooks/useAuth";
import { MoveOutDashboard } from "@/features/contracts/components/MoveOutDashboard";
import { MoveOutNoticeDialog } from "@/features/contracts/components/MoveOutNoticeDialog";
import { useTenantContracts } from "@/features/contracts/hooks/useTenantContract";
import { Contract } from "@/features/contracts/types";
import { TenantLayout } from "@/shared/components/layouts/TenantLayout";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/shared/components/ui/card";
import { ContractCardSkeleton } from "@/shared/components/ui/skeletons";
import { differenceInDays, format } from "date-fns";
import { AlertCircle, AlertTriangle, Calendar, CheckCircle, DollarSign, Download, FileText, Home, Loader2, LogOut, PenLine } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SelectedContract extends Contract {
  isEarlyTermination?: boolean;
}

const TenantContracts = () => {
  const { user, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [moveOutDialogOpen, setMoveOutDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<SelectedContract | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Tenant role verification
  const isTenant = role === 'tenant';

  const { data: contracts, isLoading, error, refetch } = useTenantContracts(user?.id);

  const activeContract = useMemo(() => contracts?.find(c => c.status === 'active'), [contracts]);
  const pastContracts = useMemo(() => contracts?.filter(c => c.status !== 'active') || [], [contracts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSignatureStatusBadge = (contract: Contract | null) => {
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

  const handleDownloadContract = async (contract: Contract) => {
    if (!contract.contract_document_url) {
      toast.error('Dokumen kontrak belum tersedia', {
        description: 'Silakan hubungi pengelola properti untuk mendapatkan dokumen kontrak.'
      });
      return;
    }

    try {
      setDownloadingId(contract.id);
      
      // Open the contract document URL directly
      window.open(contract.contract_document_url, '_blank');
      toast.success('Membuka dokumen kontrak...');
    } catch (error) {
      console.error('Error downloading contract:', error);
      toast.error('Gagal mengunduh kontrak', {
        description: 'Terjadi kesalahan saat mengunduh dokumen. Silakan coba lagi.'
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMoveOutNotice = (contract: Contract, isEarlyTermination: boolean = false) => {
    setSelectedContract({ ...contract, isEarlyTermination });
    setMoveOutDialogOpen(true);
  };

  const canRequestEarlyTermination = (contract: Contract): boolean => {
    const noticePeriodDays = contract.notice_period_days || 30;
    const daysUntilEnd = differenceInDays(new Date(contract.end_date), new Date());
    // Can request early termination if more than notice period remaining
    return daysUntilEnd > noticePeriodDays;
  };

  const getEarlyTerminationPenaltyPreview = (contract: Contract): string => {
    const penaltyRate = contract.early_termination_penalty_rate || 2;
    const penaltyAmount = penaltyRate * contract.rent_amount;
    return formatCurrency(penaltyAmount);
  };

  // Role verification - redirect if not tenant
  if (!authLoading && user && !isTenant) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (isLoading) {
    return (
      <TenantLayout title="My Contracts">
        <ContractCardSkeleton />
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout title="My Contracts">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Gagal memuat data kontrak. Silakan coba lagi.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="My Contracts"
      description="View your rental agreements"
    >
      {activeContract && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Current Contract</h2>
          
          {/* Pending Signature Reminder */}
          {!activeContract.tenant_signature_url && (
            <Alert className="mb-4 border-warning bg-warning/10">
              <PenLine className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                <strong>Signature Required:</strong> Silakan tanda tangani kontrak untuk mengaktifkan perjanjian sewa Anda.
                <Button 
                  variant="link" 
                  className="p-0 ml-2 h-auto text-warning underline"
                  onClick={() => navigate(`/tenant/sign-contract/${activeContract.id}`)}
                >
                  Tanda Tangani Sekarang
                </Button>
              </AlertDescription>
            </Alert>
          )}

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
                  <p className="font-semibold">{formatCurrency(activeContract.rent_amount)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Deposit</span>
                  </div>
                  <p className="font-semibold">{formatCurrency(activeContract.deposit_amount || 0)}</p>
                </div>
              </div>

              {activeContract.terms && (
                <div className="p-4 rounded-lg border mb-6">
                  <h4 className="font-medium mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{activeContract.terms}</p>
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
                  onClick={() => handleDownloadContract(activeContract)}
                  disabled={downloadingId === activeContract.id || !activeContract.contract_document_url}
                >
                  {downloadingId === activeContract.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Contract
                </Button>
                
                {!activeContract.move_out_notice_given && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => handleMoveOutNotice(activeContract)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Give Move-Out Notice
                    </Button>
                    {canRequestEarlyTermination(activeContract) && (
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="destructive"
                          onClick={() => handleMoveOutNotice(activeContract, true)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Request Early Termination
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Penalty: {getEarlyTerminationPenaltyPreview(activeContract)}
                        </p>
                      </div>
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
                        {formatCurrency(contract.rent_amount)}/mo
                      </span>
                      {getStatusBadge(contract.status || 'expired')}
                      {contract.contract_document_url && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadContract(contract)}
                          disabled={downloadingId === contract.id}
                        >
                          {downloadingId === contract.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
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
          isEarlyTermination={selectedContract.isEarlyTermination}
          onSuccess={() => {
            refetch();
            setMoveOutDialogOpen(false);
            setSelectedContract(null);
          }}
        />
      )}
    </TenantLayout>
  );
};

export default TenantContracts;
