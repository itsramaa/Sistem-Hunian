import { Link } from 'react-router-dom';
import { Building2, ArrowRight, Shield, Wallet, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meta } from '@/shared/components/meta';
import { JsonLd, softwareApplicationSchema, organizationSchema } from '@/shared/components/json-ld';

const features = [
  {
    icon: Shield,
    title: 'Pembayaran Aman',
    description: 'Sistem escrow yang aman memastikan transaksi aman untuk semua pihak.',
  },
  {
    icon: Wallet,
    title: 'Tagihan Otomatis',
    description: 'Buat dan kirim tagihan secara otomatis setiap bulan.',
  },
  {
    icon: Users,
    title: 'Manajemen Penyewa',
    description: 'Kelola penyewa, kontrak, dan permintaan perbaikan dengan mudah.',
  },
];

const benefits = [
  'Tanpa biaya pendaftaran atau biaya tersembunyi',
  'Paket gratis untuk pemilik properti kecil',
  'Pembayaran berbasis escrow yang aman',
  'Penagihan sewa otomatis',
  'Dukungan pelanggan 24/7',
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
      <Meta
        title="SiHuni — Aplikasi Manajemen Kos Cerdas"
        description="Platform manajemen properti terintegrasi untuk pemilik kos, kontrakan, dan apartemen di Indonesia. Kelola properti, tenant, dan pembayaran dengan mudah."
        canonical="https://sihuni.app/"
      />
      <JsonLd schema={[softwareApplicationSchema, organizationSchema]} />
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
              <Button variant="ghost">Masuk</Button>
            </Link>
            <Link to="/auth">
              <Button>Mulai Sekarang</Button>
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
              Tersedia di seluruh Indonesia
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight max-w-4xl mx-auto">
              Sederhanakan Manajemen Properti di{' '}
              <span className="text-primary">Indonesia</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Platform serba ada untuk pemilik properti, penyewa, dan vendor. 
              Kelola sewa, pembayaran, dan pemeliharaan dengan mudah.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  Mulai Uji Coba Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                Lihat Demo
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
              <h2 className="text-3xl font-display font-bold">Segala yang Anda butuhkan</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Fitur canggih untuk mengelola properti Anda secara efisien dan mengembangkan bisnis sewa Anda
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
                <p className="mt-2 text-muted-foreground">Pemilik Properti</p>
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-primary">2,500+</p>
                <p className="mt-2 text-muted-foreground">Penyewa Aktif</p>
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-primary">Rp 5B+</p>
                <p className="mt-2 text-muted-foreground">Transaksi</p>
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-primary">15+</p>
                <p className="mt-2 text-muted-foreground">Kota</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <Card className="gradient-primary text-primary-foreground p-8 md:p-12 text-center border-0">
              <h2 className="text-3xl font-display font-bold">Siap untuk memulai?</h2>
              <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
                Bergabunglah dengan ribuan pemilik properti yang mempercayai SiHuni untuk mengelola sewa mereka.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Buat Akun Gratis
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
              © 2024 SiHuni. Hak cipta dilindungi undang-undang.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
