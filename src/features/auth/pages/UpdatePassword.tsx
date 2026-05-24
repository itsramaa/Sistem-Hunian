import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

export default function UpdatePassword() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-2">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Perbarui Password</CardTitle>
          <CardDescription className="flex flex-col items-center gap-2">
            <Info className="w-5 h-5 text-primary" aria-hidden="true" />
            Password update is not yet available. Please contact your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
