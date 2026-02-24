import { useAdminSecurity } from '@/features/auth/hooks/useAdminSecurity';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { AlertTriangle, Copy, Key, RefreshCw, Shield, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Admin2FA() {
  const { profile } = useAuth();
  const { 
    is2FAEnabled, 
    isStatusLoading, 
    enable2FA, 
    disable2FA, 
    isEnabling, 
    isDisabling,
    generateSecret,
    generateRecoveryCodes
  } = useAdminSecurity();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<'generate' | 'verify'>('generate');
  const [tempSecret, setTempSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const handleStartSetup = () => {
    const secret = generateSecret();
    const codes = generateRecoveryCodes();
    setTempSecret(secret);
    setRecoveryCodes(codes);
    setSetupStep('generate');
    setShowSetupDialog(true);
  };

  const handleVerifyAndEnable = () => {
    // In production, verify the code against the TOTP algorithm
    if (verificationCode.length === 6) {
      if (!tempSecret) return;
      enable2FA({ secret: tempSecret, token: verificationCode }, {
        onSuccess: () => {
          setShowSetupDialog(false);
          setSetupStep('generate');
          setTempSecret(null);
          setVerificationCode('');
        }
      });
    } else {
      toast.error('Harap masukkan kode 6 digit yang valid');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke papan klip');
  };

  if (isStatusLoading) {
     return (
       <AdminLayout
         title="Autentikasi Dua Faktor"
         description="Tambahkan lapisan keamanan ekstra ke akun admin Anda"
       >
         <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
         </div>
       </AdminLayout>
     );
  }

  return (
    <AdminLayout
      title="Autentikasi Dua Faktor"
      description="Tambahkan lapisan keamanan ekstra ke akun admin Anda"
    >
      <div className="space-y-6 max-w-3xl">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {is2FAEnabled ? (
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                )}
                <div>
                  <CardTitle>Status 2FA</CardTitle>
                  <CardDescription>
                    {is2FAEnabled ? 'Akun Anda dilindungi dengan autentikasi dua faktor' : 'Autentikasi dua faktor belum diaktifkan'}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={is2FAEnabled ? 'default' : 'secondary'} className={is2FAEnabled ? 'bg-green-600' : ''}>
                {is2FAEnabled ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!is2FAEnabled ? (
              <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Rekomendasi Keamanan</AlertTitle>
                <AlertDescription>
                  Aktifkan autentikasi dua faktor untuk melindungi akun admin Anda dari akses tidak sah.
                  Ini menambahkan langkah verifikasi ekstra saat masuk.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertTitle>Akun Terlindungi</AlertTitle>
                <AlertDescription>
                  Akun Anda memerlukan kode verifikasi dari aplikasi autentikator saat masuk.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Setup/Manage Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Aplikasi Autentikator
            </CardTitle>
            <CardDescription>
              Gunakan aplikasi autentikator seperti Google Authenticator, Authy, atau 1Password untuk menghasilkan kode verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {is2FAEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Aplikasi Autentikator</p>
                      <p className="text-sm text-muted-foreground">Terhubung dan aktif</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disable2FA()}
                    disabled={isDisabling}
                  >
                    {isDisabling ? 'Menonaktifkan...' : 'Nonaktifkan 2FA'}
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={handleStartSetup}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerasi Kode Pemulihan
                </Button>
              </div>
            ) : (
              <Button onClick={handleStartSetup} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Atur Autentikasi Dua Faktor
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Praktik Terbaik Keamanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                Simpan kode pemulihan Anda di lokasi yang aman (pengelola kata sandi, file terenkripsi)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                Jangan pernah membagikan kode QR atau kunci rahasia autentikator Anda dengan siapa pun
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                Jika Anda kehilangan akses ke autentikator Anda, gunakan kode pemulihan untuk masuk
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                Regenerasi kode pemulihan setelah menggunakannya
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Setup Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Aktifkan Autentikasi Dua Faktor</DialogTitle>
              <DialogDescription>
                {setupStep === 'generate'
                  ? 'Pindai kode QR atau masukkan kunci rahasia di aplikasi autentikator Anda'
                  : 'Masukkan kode 6 digit dari aplikasi autentikator Anda'}
              </DialogDescription>
            </DialogHeader>

            {setupStep === 'generate' ? (
              <div className="space-y-4">
                {/* QR Code Placeholder */}
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center">
                      <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Kode QR</p>
                      <p className="text-xs text-muted-foreground">(Pindai dengan aplikasi)</p>
                    </div>
                  </div>
                </div>

                {/* Secret Key */}
                <div className="space-y-2">
                  <Label>Kunci Rahasia</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tempSecret || ''}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(tempSecret || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Jika Anda tidak dapat memindai kode QR, masukkan kunci ini secara manual di aplikasi Anda
                  </p>
                </div>

                {/* Recovery Codes */}
                <div className="space-y-2">
                  <Label>Kode Pemulihan</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                    {recoveryCodes.map((code, i) => (
                      <span key={i}>{code}</span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => copyToClipboard(recoveryCodes.join('\n'))}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Salin Semua Kode
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Simpan kode-kode ini dengan aman. Anda dapat menggunakannya untuk masuk jika kehilangan autentikator.
                  </p>
                </div>

                <Button onClick={() => setSetupStep('verify')} className="w-full">
                  Lanjutkan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kode Verifikasi</Label>
                  <Input
                    id="code"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Masukkan kode 6 digit yang ditampilkan di aplikasi autentikator Anda
                  </p>
                </div>

                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setSetupStep('generate')}>
                    Kembali
                  </Button>
                  <Button
                    onClick={handleVerifyAndEnable}
                    disabled={verificationCode.length !== 6 || isEnabling}
                  >
                    {isEnabling ? 'Mengaktifkan...' : 'Aktifkan 2FA'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
