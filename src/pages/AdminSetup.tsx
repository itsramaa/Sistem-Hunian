import { adminSecurityService } from '@/features/auth/services/adminSecurityService';
import { supabase } from '@/lib/integrations/supabase/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle, Loader2, Shield } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const adminSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  secretKey: z.string().min(1, 'Secret key is required'),
});

type AdminFormData = z.infer<typeof adminSchema>;

export default function AdminSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      secretKey: '',
    },
  });

  const handleSubmit = async (data: AdminFormData) => {
    setIsLoading(true);
    try {
      // Validate secret key via edge function
      const isValidSecret = await adminSecurityService.validateAdminSecret(data.secretKey);
      
      if (!isValidSecret) {
        toast({
          variant: 'destructive',
          title: 'Invalid Secret Key',
          description: 'The secret key you entered is incorrect.',
        });
        setIsLoading(false);
        return;
      }

      // Sign up the admin user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            full_name: data.fullName,
            role: 'admin',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({
            variant: 'destructive',
            title: 'User Already Exists',
            description: 'This email is already registered. Please log in and contact support to be made an admin.',
          });
          return;
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      setIsComplete(true);
      toast({
        title: 'Admin Account Created!',
        description: 'You can now log in with your admin credentials.',
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      const err = error as Error;
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to create admin account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Admin Account Created!</h2>
            <p className="text-muted-foreground mb-6">
              Your admin account has been successfully created. You can now log in to access the admin dashboard.
            </p>
            <Link to="/auth">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Admin Setup</CardTitle>
          <CardDescription>
            Create an admin account for SiHuni platform management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Admin User"
                {...form.register('fullName')}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sihuni.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Admin Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="Enter the admin secret key"
                {...form.register('secretKey')}
              />
              {form.formState.errors.secretKey && (
                <p className="text-sm text-destructive">{form.formState.errors.secretKey.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Contact system administrator for the secret key
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="inline h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
