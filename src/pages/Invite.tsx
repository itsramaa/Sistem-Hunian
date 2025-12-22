import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Home, Loader2, CheckCircle, XCircle, Building2, MapPin, ArrowRight } from "lucide-react";
import { TenantProfileForm } from "@/components/tenant/TenantProfileForm";

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [isNewUser, setIsNewUser] = useState(true);
  const [step, setStep] = useState<'auth' | 'profile' | 'complete'>('auth');
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_invitations')
        .select(`
          *,
          unit:units (
            id,
            unit_number,
            rent_amount,
            deposit_amount,
            property:properties (
              name,
              address,
              city
            )
          )
        `)
        .eq('token', token)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (invitation?.email) {
      setFormData(prev => ({ ...prev, email: invitation.email }));
    }
  }, [invitation]);

  // If user is already logged in, go to profile step
  useEffect(() => {
    if (user && step === 'auth') {
      setCreatedUserId(user.id);
      setStep('profile');
    }
  }, [user, step]);

  const createAccount = useMutation({
    mutationFn: async () => {
      if (!invitation) throw new Error('Invitation not found');

      const { data: authData, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
          role: 'tenant',
        }
      );
      if (signUpError) throw signUpError;
      if (!authData?.user?.id) throw new Error('Failed to create account');

      setCreatedUserId(authData.user.id);
      return authData.user.id;
    },
    onSuccess: () => {
      setStep('profile');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const completeInvitation = async () => {
    if (!invitation || !createdUserId) return;

    try {
      // Update invitation status
      const { error: updateError } = await supabase
        .from('tenant_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);
      if (updateError) throw updateError;

      // Update unit status to occupied
      const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'occupied' })
        .eq('id', invitation.unit_id);
      if (unitError) throw unitError;

      // Create contract for the tenant
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const { error: contractError } = await supabase
        .from('contracts')
        .insert({
          merchant_id: invitation.merchant_id,
          unit_id: invitation.unit_id,
          tenant_user_id: createdUserId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          rent_amount: invitation.unit?.rent_amount || 0,
          deposit_amount: invitation.unit?.deposit_amount || 0,
          status: 'active',
        });
      if (contractError) throw contractError;

      toast.success('Welcome to your new home!');
      navigate('/tenant');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === 'accepted') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success" />
            <h2 className="text-xl font-semibold mb-2">Invitation Already Accepted</h2>
            <p className="text-muted-foreground mb-6">
              This invitation has already been accepted.
            </p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-warning" />
            <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
            <p className="text-muted-foreground mb-6">
              This invitation has expired. Please contact your landlord for a new invitation.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile completion step
  if (step === 'profile' && createdUserId) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center text-success-foreground">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Account</span>
            </div>
            <div className="h-px w-8 bg-primary" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                2
              </div>
              <span className="text-sm font-medium">Profile</span>
            </div>
            <div className="h-px w-8 bg-muted-foreground/30" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                3
              </div>
              <span className="text-sm text-muted-foreground">Complete</span>
            </div>
          </div>

          {/* Property info banner */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{invitation.unit?.property?.name}</p>
                  <p className="text-sm text-muted-foreground">Unit {invitation.unit?.unit_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Please provide your information for verification purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantProfileForm
                userId={createdUserId}
                onComplete={completeInvitation}
              />
            </CardContent>
          </Card>

          {/* Skip option */}
          <div className="text-center">
            <Button variant="ghost" onClick={completeInvitation}>
              Skip for now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Auth step
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>You've been invited to become a tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Details */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{invitation.unit?.property?.name}</p>
                <p className="text-sm text-muted-foreground">Unit {invitation.unit?.unit_number}</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {invitation.unit?.property?.address}, {invitation.unit?.property?.city}
                </div>
                <p className="mt-2 font-medium text-primary">
                  Rp {Number(invitation.unit?.rent_amount || 0).toLocaleString()}/month
                </p>
              </div>
            </div>
          </div>

          {/* Account Creation Form */}
          {!user && (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Button
                  variant={isNewUser ? "default" : "outline"}
                  onClick={() => setIsNewUser(true)}
                  className="flex-1"
                >
                  Create Account
                </Button>
                <Button
                  variant={!isNewUser ? "default" : "outline"}
                  onClick={() => setIsNewUser(false)}
                  className="flex-1"
                >
                  I Have Account
                </Button>
              </div>

              {isNewUser && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a password"
                    />
                  </div>
                </div>
              )}

              {!isNewUser && (
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">
                    If you already have an account, please sign in first, then come back to this link.
                  </p>
                  <Button variant="link" onClick={() => navigate('/auth')}>
                    Go to Sign In
                  </Button>
                </div>
              )}
            </div>
          )}

          {user && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <p className="text-success font-medium">You're signed in as {user.email}</p>
              </div>
            </div>
          )}

          <Button
            className="w-full gradient-primary"
            onClick={() => {
              if (user) {
                setCreatedUserId(user.id);
                setStep('profile');
              } else if (isNewUser) {
                createAccount.mutate();
              }
            }}
            disabled={createAccount.isPending || (!user && isNewUser && (!formData.email || !formData.password || !formData.fullName))}
          >
            {createAccount.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {user ? "Continue to Profile" : "Create Account & Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
