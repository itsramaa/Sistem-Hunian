import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Calendar, Home, ArrowLeft, Loader2, Download, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const TenantContracts = () => {
  const { user } = useAuth();

  const { data: contracts, isLoading } = useQuery({
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
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeContract = contracts?.find(c => c.status === 'active');
  const pastContracts = contracts?.filter(c => c.status !== 'active') || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/tenant">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Contracts</h1>
              <p className="text-muted-foreground">View your rental agreements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {activeContract && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-foreground">Current Contract</h2>
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
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
                  {getStatusBadge(activeContract.status || 'active')}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeContract.terms}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
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
      </main>
    </div>
  );
};

export default TenantContracts;
