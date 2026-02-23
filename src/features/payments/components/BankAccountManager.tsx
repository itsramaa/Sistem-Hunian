import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { Plus, Trash2, Star, Building2, Loader2 } from 'lucide-react';

interface BankAccount {
  id: string;
  merchant_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code: string | null;
  is_primary: boolean;
  created_at: string;
}

export function BankAccountManager() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ bank_name: '', account_name: '', account_number: '', branch_code: '' });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['bank-accounts', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase.from('bank_accounts').select('*').eq('merchant_id', merchant.id).order('is_primary', { ascending: false });
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!merchant?.id,
  });

  const addAccount = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('bank_accounts').insert({
        merchant_id: merchant?.id, bank_name: data.bank_name, account_name: data.account_name,
        account_number: data.account_number, branch_code: data.branch_code || null, is_primary: accounts.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Account added', description: 'Bank account has been added successfully.' });
      setIsDialogOpen(false);
      setFormData({ bank_name: '', account_name: '', account_number: '', branch_code: '' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to add bank account.' }),
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Account deleted', description: 'Bank account has been removed.' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete bank account.' }),
  });

  const setPrimary = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('bank_accounts').update({ is_primary: false }).eq('merchant_id', merchant?.id);
      const { error } = await supabase.from('bank_accounts').update({ is_primary: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Primary account updated' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to update primary account.' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank_name || !formData.account_name || !formData.account_number) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }
    addAccount.mutate(formData);
  };

  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Bank Accounts
            </CardTitle>
            <CardDescription>Manage your bank accounts for disbursements</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-cta rounded-xl">
                <Plus className="h-4 w-4 mr-2" />Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
                <DialogDescription>Add a new bank account for receiving disbursements</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { id: 'bank_name', label: 'Bank Name *', placeholder: 'e.g., BCA, Mandiri, BNI' },
                  { id: 'account_name', label: 'Account Holder Name *', placeholder: 'Name as it appears on the account' },
                  { id: 'account_number', label: 'Account Number *', placeholder: 'Enter account number' },
                  { id: 'branch_code', label: 'Branch Code (Optional)', placeholder: 'Enter branch code' },
                ].map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      placeholder={field.placeholder}
                      value={formData[field.id as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      className="rounded-xl bg-background/60 border-border/50"
                    />
                  </div>
                ))}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" disabled={addAccount.isPending} className="gradient-cta rounded-xl">
                    {addAccount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add Account
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No bank accounts added yet</p>
            <p className="text-sm">Add a bank account to receive disbursements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.bank_name}</span>
                      {account.is_primary && (
                        <Badge variant="secondary" className="text-xs rounded-full">
                          <Star className="h-3 w-3 mr-1" />Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{account.account_name}</p>
                    <p className="text-sm font-mono text-muted-foreground">•••• {account.account_number.slice(-4)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!account.is_primary && (
                    <Button variant="ghost" size="sm" onClick={() => setPrimary.mutate(account.id)} disabled={setPrimary.isPending} className="rounded-xl">
                      Set as Primary
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-xl">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAccount.mutate(account.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
