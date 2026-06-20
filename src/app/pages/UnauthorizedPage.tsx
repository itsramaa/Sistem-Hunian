import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ShieldX, ArrowLeft, Home, LogIn, RefreshCw, Mail } from "lucide-react";
import { AppRole } from "@/features/auth/types/auth";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { role, user, signOut, refreshProfile } = useAuth();

  const getDashboardPath = (userRole: AppRole | null): string => {
    if (!userRole) return '/auth';
    const rolePathMap: Record<AppRole, string> = {
      admin: '/admin',
      merchant: '/merchant',
      vendor: '/vendor',
      tenant: '/tenant',
    };
    return rolePathMap[userRole] || '/';
  };

  const handleGoToDashboard = () => {
    navigate(getDashboardPath(role));
  };

  const handleRefreshRole = async () => {
    await refreshProfile();
    // After refresh, if role exists, redirect to dashboard
    if (role) {
      navigate(getDashboardPath(role));
    }
  };

  const handleLoginAgain = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="max-w-md w-full shadow-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold">403</CardTitle>
          <CardDescription className="text-lg">Akses Ditolak</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. 
            Ini mungkin terjadi karena:
          </p>
          
          <ul className="text-sm text-muted-foreground space-y-2 pl-4">
            <li>• Anda mencoba mengakses halaman yang tidak sesuai dengan role Anda</li>
            <li>• Sesi Anda telah kadaluarsa</li>
            <li>• Akun Anda belum diverifikasi</li>
          </ul>

          {user && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                Login sebagai: <span className="font-medium text-foreground">{user.email}</span>
              </p>
              {role && (
                <p className="text-muted-foreground">
                  Role: <span className="font-medium text-foreground capitalize">{role}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {role && (
              <Button 
                onClick={handleGoToDashboard} 
                className="w-full gap-2"
              >
                <Home className="h-4 w-4" />
                Ke Dashboard Saya
              </Button>
            )}
            
            <Button 
              onClick={handleRefreshRole} 
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status Akun
            </Button>

            <Button 
              onClick={handleLoginAgain} 
              variant="outline"
              className="w-full gap-2"
            >
              <LogIn className="h-4 w-4" />
              Login dengan Akun Lain
            </Button>
            
            <Button 
              onClick={() => navigate(-1)} 
              variant="ghost"
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Butuh bantuan?
            </p>
            <Button 
              variant="link" 
              className="gap-2 text-primary"
              onClick={() => window.location.href = 'mailto:support@sihuni.com'}
            >
              <Mail className="h-4 w-4" />
              Hubungi Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
