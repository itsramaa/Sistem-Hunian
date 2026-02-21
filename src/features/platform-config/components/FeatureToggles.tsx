import { usePlatformSettings } from "@/features/platform-config/hooks/usePlatformSettings";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

type FeatureFlags = {
  merchant_registration: boolean;
  maintenance_mode: boolean;
  social_login: boolean;
  beta_features: boolean;
  email_verification_required: boolean;
};

const defaultFeatures: FeatureFlags = {
  merchant_registration: true,
  maintenance_mode: false,
  social_login: true,
  beta_features: false,
  email_verification_required: true,
};

export const FeatureToggles = () => {
  const { settings, updateSetting, isUpdating } = usePlatformSettings();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [featureForm, setFeatureForm] = useState<FeatureFlags>(defaultFeatures);
  const [originalFeatureForm, setOriginalFeatureForm] = useState<FeatureFlags>(defaultFeatures);

  useEffect(() => {
    const features = settings?.find(s => s.setting_key === 'features')?.setting_value;
    if (features) {
      const formData: FeatureFlags = {
        merchant_registration: features.merchant_registration ?? defaultFeatures.merchant_registration,
        maintenance_mode: features.maintenance_mode ?? defaultFeatures.maintenance_mode,
        social_login: features.social_login ?? defaultFeatures.social_login,
        beta_features: features.beta_features ?? defaultFeatures.beta_features,
        email_verification_required: features.email_verification_required ?? defaultFeatures.email_verification_required,
      };
      setFeatureForm(formData);
      setOriginalFeatureForm(formData);
    }
  }, [settings]);

  useEffect(() => {
    const hasChanges = JSON.stringify(featureForm) !== JSON.stringify(originalFeatureForm);
    setHasUnsavedChanges(hasChanges);
  }, [featureForm, originalFeatureForm]);

  const handleToggle = (key: keyof FeatureFlags) => {
    setFeatureForm(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveFeatures = () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = () => {
    updateSetting(
      { 
        key: 'features', 
        value: featureForm,
        description: 'Global feature flags'
      }, 
      {
        onSuccess: () => {
          setOriginalFeatureForm(featureForm);
          setHasUnsavedChanges(false);
          setShowConfirmDialog(false);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">You have unsaved changes. Don't forget to save before leaving.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Core Features</CardTitle>
          <CardDescription>Control availability of core platform functionalities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="merchant-registration" className="flex flex-col space-y-1">
              <span>Merchant Registration</span>
              <span className="font-normal text-xs text-muted-foreground">Allow new merchants to sign up</span>
            </Label>
            <Switch
              id="merchant-registration"
              checked={featureForm.merchant_registration}
              onCheckedChange={() => handleToggle('merchant_registration')}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="maintenance-mode" className="flex flex-col space-y-1">
              <span className="text-destructive font-semibold">Maintenance Mode</span>
              <span className="font-normal text-xs text-muted-foreground">Disable access for all non-admin users</span>
            </Label>
            <Switch
              id="maintenance-mode"
              checked={featureForm.maintenance_mode}
              onCheckedChange={() => handleToggle('maintenance_mode')}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="email-verification" className="flex flex-col space-y-1">
              <span>Email Verification Required</span>
              <span className="font-normal text-xs text-muted-foreground">Require email verification before accessing dashboard</span>
            </Label>
            <Switch
              id="email-verification"
              checked={featureForm.email_verification_required}
              onCheckedChange={() => handleToggle('email_verification_required')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Beta & Experimental</CardTitle>
          <CardDescription>Features currently in testing phase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="social-login" className="flex flex-col space-y-1">
              <span>Social Login</span>
              <span className="font-normal text-xs text-muted-foreground">Enable Google/Facebook login integration</span>
            </Label>
            <Switch
              id="social-login"
              checked={featureForm.social_login}
              onCheckedChange={() => handleToggle('social_login')}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="beta-features" className="flex flex-col space-y-1">
              <span>Beta Features Access</span>
              <span className="font-normal text-xs text-muted-foreground">Enable experimental features for all users</span>
            </Label>
            <Switch
              id="beta-features"
              checked={featureForm.beta_features}
              onCheckedChange={() => handleToggle('beta_features')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveFeatures} 
          disabled={!hasUnsavedChanges || isUpdating}
          className="gap-2"
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={confirmSave}
        title="Save Feature Configuration"
        description="Are you sure you want to update feature flags? This may immediately affect user access and functionality."
        confirmLabel="Save Changes"
        cancelLabel="Cancel"
        variant="default"
      />
    </div>
  );
};
