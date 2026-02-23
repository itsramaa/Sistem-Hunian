import { MerchantNotificationSettings as NotificationSettingsComponent } from "@/features/notifications/components/MerchantNotificationSettings";
import { BankAccountManager } from "@/features/payments/components/BankAccountManager";
import { DisbursementScheduleSettings } from "@/features/payments/components/DisbursementScheduleSettings";
import { supabase } from "@/lib/integrations/supabase/client";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useTheme } from "@/shared/context/theme-context";
import { AlertTriangle, Bell, CheckCircle, CreditCard, Loader2, Lock, Palette, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { strongPasswordSchema, loginPasswordSchema } from "@/shared/utils/validations/auth";

const VALID_THEMES = ["light", "dark", "system"] as const;

const passwordSchema = z.object({
  currentPassword: loginPasswordSchema,
  newPassword: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "theme";

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleThemeChange = (value: string) => {
    if (VALID_THEMES.includes(value as typeof VALID_THEMES[number])) {
      setTheme(value as any);
      toast.success(`Theme changed to ${value}`);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordErrors({});
    setPasswordSuccess(false);
    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) { errors[err.path[0] as string] = err.message; } });
      setPasswordErrors(errors);
      return;
    }
    setIsChangingPassword(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User email not found");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: passwordForm.currentPassword });
      if (signInError) { setPasswordErrors({ currentPassword: "Current password is incorrect" }); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (updateError) throw updateError;
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error((error as Error).message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={SettingsIcon} title="Settings" description="Configure your account preferences" />
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="inline-flex rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1">
          <TabsTrigger value="theme" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="banking" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Banking</span>
          </TabsTrigger>
          <TabsTrigger value="disbursement" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Disbursement</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="theme" className="space-y-6">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how SiHuni looks on your device</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
                <div>
                  <RadioGroupItem value="light" id="light" className="peer sr-only" />
                  <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                    <div className="w-full aspect-video rounded-xl bg-background border mb-3 flex items-center justify-center">
                      <div className="w-1/2 h-3/4 bg-muted rounded-lg" />
                    </div>
                    <span className="text-sm font-medium">Light</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                  <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                    <div className="w-full aspect-video rounded-xl bg-zinc-900 border border-zinc-800 mb-3 flex items-center justify-center">
                      <div className="w-1/2 h-3/4 bg-zinc-800 rounded-lg" />
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="system" id="system" className="peer sr-only" />
                  <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                    <div className="w-full aspect-video rounded-xl bg-gradient-to-r from-background to-zinc-900 border mb-3 flex items-center justify-center">
                      <div className="w-1/2 h-3/4 bg-gradient-to-r from-muted to-zinc-800 rounded-lg" />
                    </div>
                    <span className="text-sm font-medium">System</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettingsComponent />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Password changed successfully</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Enter your current password" className="rounded-xl bg-background/60 border-border/50" />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Enter new password" className="rounded-xl bg-background/60 border-border/50" />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{passwordErrors.newPassword}</p>
                )}
                <p className="text-xs text-muted-foreground">Must be at least 8 characters with uppercase, lowercase, and number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Confirm new password" className="rounded-xl bg-background/60 border-border/50" />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <Button onClick={handlePasswordChange} disabled={isChangingPassword} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
                {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking" className="space-y-6">
          <BankAccountManager />
        </TabsContent>

        <TabsContent value="disbursement" className="space-y-6">
          <DisbursementScheduleSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;