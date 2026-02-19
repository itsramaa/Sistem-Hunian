import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { 
  CreditCard, Building2, Wallet, Check, ChevronRight, 
  ChevronLeft, Shield, AlertTriangle, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface AutoPayWizardProps {
  onComplete: (method: string, enabled: boolean) => void;
  currentMethod?: string | null;
  isEnabled?: boolean;
}

const PAYMENT_METHODS = [
  { 
    id: 'credit_card', 
    label: 'Credit/Debit Card', 
    icon: CreditCard, 
    supportsRecurring: true,
    description: 'Automatically charge your card each month'
  },
  { 
    id: 'bank_transfer', 
    label: 'Bank Transfer (VA)', 
    icon: Building2, 
    supportsRecurring: false,
    description: 'Receive VA number each month'
  },
  { 
    id: 'ewallet', 
    label: 'E-Wallet', 
    icon: Wallet, 
    supportsRecurring: true,
    description: 'Auto-debit from your e-wallet'
  },
];

export function AutoPayWizard({ onComplete, currentMethod, isEnabled }: AutoPayWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(currentMethod || '');
  const [autoPayEnabled, setAutoPayEnabled] = useState(isEnabled || false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedMethodData = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  const handleNext = async () => {
    if (step === 1 && !selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (step === 2) {
      setIsProcessing(true);
      
      // Simulate authorization process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsProcessing(false);
      onComplete(selectedMethod, autoPayEnabled);
      toast.success(autoPayEnabled ? 'Auto-pay enabled successfully!' : 'Payment method saved');
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Auto-pay Setup
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Choose your payment method'}
              {step === 2 && 'Review and confirm'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Select Payment Method */}
        {step === 1 && (
          <div className="space-y-4">
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              {PAYMENT_METHODS.map((method) => (
                <div key={method.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label 
                    htmlFor={method.id} 
                    className="flex items-center gap-3 flex-1 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <method.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.label}</span>
                        {method.supportsRecurring && (
                          <Badge variant="secondary" className="text-xs">Auto-pay</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedMethod && !selectedMethodData?.supportsRecurring && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This method doesn't support automatic payments. You'll receive a reminder each month.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 2: Confirm and Enable */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Selected Method Summary */}
            {selectedMethodData && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <selectedMethodData.icon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedMethodData.label}</p>
                    <p className="text-sm text-muted-foreground">{selectedMethodData.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-pay Toggle */}
            {selectedMethodData?.supportsRecurring && (
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <Label htmlFor="auto-pay-toggle" className="font-medium">Enable Auto-pay</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically pay on the due date each month
                    </p>
                  </div>
                </div>
                <Switch
                  id="auto-pay-toggle"
                  checked={autoPayEnabled}
                  onCheckedChange={setAutoPayEnabled}
                />
              </div>
            )}

            {/* Benefits */}
            {autoPayEnabled && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Benefits:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Never miss a payment
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Avoid late fees
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Cancel anytime
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          <Button onClick={handleNext} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : step === 2 ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Confirm
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
