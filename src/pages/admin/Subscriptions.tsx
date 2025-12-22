import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Search, Crown, Star, Loader2, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";

const AdminSubscriptions = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [newTier, setNewTier] = useState("");

  const { data: merchants, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, tier }: { id: string; tier: string }) => {
      const { error } = await supabase
        .from('merchants')
        .update({ subscription_tier: tier })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Subscription updated');
      setShowUpgradeDialog(false);
      setSelectedMerchant(null);
    },
    onError: () => toast.error('Failed to update subscription'),
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Badge className="bg-accent text-accent-foreground"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>;
      case 'professional':
        return <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" /> Professional</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const filteredMerchants = merchants?.filter(merchant =>
    merchant.business_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const premiumCount = merchants?.filter(m => m.subscription_tier === 'premium').length || 0;
  const professionalCount = merchants?.filter(m => m.subscription_tier === 'professional').length || 0;
  const freeCount = merchants?.filter(m => !m.subscription_tier || m.subscription_tier === 'free').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground">Manage merchant subscription plans</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Merchants</p>
                <p className="text-2xl font-bold">{merchants?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Crown className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold">{premiumCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Professional</p>
                <p className="text-2xl font-bold">{professionalCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free</p>
                <p className="text-2xl font-bold">{freeCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Merchant Subscriptions</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMerchants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Current Plan</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell className="font-medium">{merchant.business_name}</TableCell>
                      <TableCell>
                        <p className="text-sm">{merchant.business_type || 'Individual'}</p>
                      </TableCell>
                      <TableCell>{getTierBadge(merchant.subscription_tier || 'free')}</TableCell>
                      <TableCell>{format(new Date(merchant.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            setNewTier(merchant.subscription_tier || 'free');
                            setShowUpgradeDialog(true);
                          }}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          Change Plan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No merchants found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Subscription Plan</DialogTitle>
            </DialogHeader>
            {selectedMerchant && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Business</Label>
                  <p className="font-medium">{selectedMerchant.business_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Current Plan</Label>
                  <div className="mt-1">{getTierBadge(selectedMerchant.subscription_tier || 'free')}</div>
                </div>
                <div className="space-y-2">
                  <Label>New Plan</Label>
                  <Select value={newTier} onValueChange={setNewTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Plan Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {newTier === 'premium' && (
                      <>
                        <li>• Unlimited properties</li>
                        <li>• Priority support</li>
                        <li>• Advanced analytics</li>
                        <li>• Custom branding</li>
                      </>
                    )}
                    {newTier === 'professional' && (
                      <>
                        <li>• Up to 50 properties</li>
                        <li>• Email support</li>
                        <li>• Basic analytics</li>
                      </>
                    )}
                    {newTier === 'free' && (
                      <>
                        <li>• Up to 5 properties</li>
                        <li>• Community support</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateSubscription.mutate({ id: selectedMerchant.id, tier: newTier })}
                disabled={updateSubscription.isPending || newTier === selectedMerchant?.subscription_tier}
              >
                {updateSubscription.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
