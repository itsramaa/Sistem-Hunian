import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, Building2, User, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/auth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  businessName: z.string().optional(),
  merchantCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const roleOptions: { value: AppRole; label: string; icon: typeof Building2; description: string }[] = [
  { value: 'merchant', label: 'Merchant', icon: Building2, description: 'Property owner/manager' },
  { value: 'tenant', label: 'Tenant', icon: User, description: 'Rent a property' },
  { value: 'vendor', label: 'Vendor', icon: Wrench, description: 'Service provider' },
];

export function AuthForm() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') as 'login' | 'signup' | null;
  const initialRole = searchParams.get('role') as AppRole | null;
  const initialMerchantCode = searchParams.get('merchantCode') || searchParams.get('code') || '';
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialMode || 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>(initialRole || 'tenant');
  const [isLoading, setIsLoading] = useState(false);
  const [merchantCodeError, setMerchantCodeError] = useState<string | null>(null);
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { 
      email: '', 
      password: '', 
      confirmPassword: '', 
      fullName: '', 
      businessName: '',
      merchantCode: initialMerchantCode,
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
      });
      return;
    }

    toast({
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
    });
  };

  const validateMerchantCode = async (code: string): Promise<string | null> => {
    if (!code) return null;
    
    const { data, error } = await supabase
      .from('merchants')
      .select('id')
      .eq('merchant_code', code.toUpperCase())
      .single();
    
    if (error || !data) {
      return null;
    }
    return data.id;
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setMerchantCodeError(null);

    // Validate merchant code for tenants
    let linkedMerchantId: string | null = null;
    if (selectedRole === 'tenant') {
      if (!data.merchantCode) {
        setMerchantCodeError('Merchant code is required for tenant registration');
        setIsLoading(false);
        return;
      }
      
      linkedMerchantId = await validateMerchantCode(data.merchantCode);
      if (!linkedMerchantId) {
        setMerchantCodeError('Invalid merchant code. Please check with your landlord.');
        setIsLoading(false);
        return;
      }
    }

    const { error } = await signUp(data.email, data.password, {
      full_name: data.fullName,
      role: selectedRole,
      business_name: selectedRole === 'merchant' ? data.businessName : undefined,
    });
    
    // Link tenant to merchant after signup and send notification
    if (!error && linkedMerchantId && selectedRole === 'tenant') {
      console.log('Tenant linked to merchant:', linkedMerchantId);
      
      // Fetch merchant details for notification
      try {
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('user_id, business_name')
          .eq('id', linkedMerchantId)
          .single();
        
        if (merchantData) {
          const { data: merchantProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', merchantData.user_id)
            .single();
          
          if (merchantProfile?.email) {
            // Send email notification to merchant
            await supabase.functions.invoke('send-notification', {
              body: {
                type: 'tenant_registration',
                recipientEmail: merchantProfile.email,
                recipientName: merchantProfile.full_name || merchantData.business_name,
                data: {
                  tenantName: data.fullName,
                  tenantEmail: data.email,
                  tenantPhone: null,
                  registeredAt: new Date().toLocaleString('id-ID', { 
                    dateStyle: 'full', 
                    timeStyle: 'short' 
                  }),
                  dashboardLink: `${window.location.origin}/merchant/tenants`,
                },
              },
            });
            console.log('Tenant registration notification sent to merchant');
          }
        }
      } catch (notifError) {
        console.error('Failed to send tenant registration notification:', notifError);
        // Don't fail the signup if notification fails
      }
    }
    setIsLoading(false);

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please log in instead.';
      }
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: errorMessage,
      });
      return;
    }

    toast({
      title: 'Account created!',
      description: 'Welcome to SiHuni. You are now logged in.',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-2">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Welcome to SiHuni</CardTitle>
          <CardDescription>
            Indonesia's Property Management Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...loginForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedRole(option.value)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                          selectedRole === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <option.icon className={cn(
                          'h-5 w-5',
                          selectedRole === option.value ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'text-xs font-medium',
                          selectedRole === option.value ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="John Doe"
                    {...signupForm.register('fullName')}
                  />
                  {signupForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                {selectedRole === 'merchant' && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-business">Business Name</Label>
                    <Input
                      id="signup-business"
                      placeholder="PT Property Indonesia"
                      {...signupForm.register('businessName')}
                    />
                  </div>
                )}

                {selectedRole === 'tenant' && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-merchant-code">Merchant Code *</Label>
                    <Input
                      id="signup-merchant-code"
                      placeholder="ABC123"
                      className="font-mono uppercase"
                      {...signupForm.register('merchantCode')}
                      onChange={(e) => {
                        signupForm.setValue('merchantCode', e.target.value.toUpperCase());
                        setMerchantCodeError(null);
                      }}
                    />
                    {merchantCodeError && (
                      <p className="text-sm text-destructive">{merchantCodeError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Get this code from your landlord/property manager
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    {...signupForm.register('email')}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...signupForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    {...signupForm.register('confirmPassword')}
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
