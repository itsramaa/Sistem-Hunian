import { Link } from 'react-router-dom';
import { Building2, ArrowRight, Shield, Wallet, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Protected escrow system ensures safe transactions for all parties.',
  },
  {
    icon: Wallet,
    title: 'Automated Invoicing',
    description: 'Generate and send invoices automatically each month.',
  },
  {
    icon: Users,
    title: 'Tenant Management',
    description: 'Easily manage tenants, contracts, and maintenance requests.',
  },
];

const benefits = [
  'No setup fees or hidden costs',
  'Free tier for small property owners',
  'Secure escrow-based payments',
  'Automated rent collection',
  '24/7 customer support',
];

export default function Index() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'merchant') {
        navigate('/merchant', { replace: true });
      } else if (role === 'vendor') {
        navigate('/vendor', { replace: true });
      } else {
        navigate('/tenant', { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">SiHuni</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now available across Indonesia
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight max-w-4xl mx-auto">
              Simplify Property Management in{' '}
              <span className="text-primary">Indonesia</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The all-in-one platform for property owners, tenants, and vendors. 
              Manage rentals, payments, and maintenance with ease.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                Watch Demo
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              {benefits.slice(0, 3).map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold">Everything you need</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Powerful features to manage your properties efficiently and grow your rental business
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature) => (
                <Card key={feature.title} className="hover:shadow-card-hover transition-shadow border-border/50">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              <div>
                <p className="text-4xl font-display font-bold text-primary">500+</p>
                <p className="mt-2 text-muted-foreground">Property Owners</p>
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-primary">2,500+</p>
                <p className="mt-2 text-muted-foreground">Active Tenants</p>
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-primary">Rp 5B+</p>
                <p className="mt-2 text-muted-foreground">Transactions</p>
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-primary">15+</p>
                <p className="mt-2 text-muted-foreground">Cities</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <Card className="gradient-primary text-primary-foreground p-8 md:p-12 text-center border-0">
              <h2 className="text-3xl font-display font-bold">Ready to get started?</h2>
              <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
                Join thousands of property owners who trust SiHuni to manage their rentals.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
                <Building2 className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold">SiHuni</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SiHuni. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
