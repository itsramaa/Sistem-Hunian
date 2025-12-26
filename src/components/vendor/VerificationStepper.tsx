import { CheckCircle, Circle, Clock, XCircle, FileUp, User, Store, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  icon: React.ReactNode;
}

interface VerificationStepperProps {
  steps: VerificationStep[];
  className?: string;
}

export function VerificationStepper({ steps, className }: VerificationStepperProps) {
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  const getStatusIcon = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-success" />;
      case 'current':
        return <Clock className="h-6 w-6 text-primary animate-pulse" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStepStyles = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-success bg-success/10';
      case 'current':
        return 'border-primary bg-primary/10';
      case 'rejected':
        return 'border-destructive bg-destructive/10';
      default:
        return 'border-muted-foreground/30 bg-muted/30';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Verification Progress</span>
          <span className="text-muted-foreground">
            {completedSteps} of {steps.length} completed
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps */}
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'absolute left-[19px] top-[40px] w-0.5 h-[calc(100%-40px)]',
                  step.status === 'completed' ? 'bg-success' : 'bg-muted-foreground/20'
                )}
              />
            )}

            {/* Status Icon */}
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center',
              getStepStyles(step.status)
            )}>
              {getStatusIcon(step.status)}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  'font-medium',
                  step.status === 'completed' && 'text-success',
                  step.status === 'rejected' && 'text-destructive',
                  step.status === 'pending' && 'text-muted-foreground'
                )}>
                  {step.title}
                </h4>
                {step.status === 'current' && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              
              {step.status === 'rejected' && (
                <p className="text-sm text-destructive mt-2">
                  Document was rejected. Please resubmit with correct information.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper to create default verification steps
export function createVerificationSteps(
  verifications: Array<{ document_type: string; status: string }> = []
): VerificationStep[] {
  const getDocStatus = (docType: string): VerificationStep['status'] => {
    const doc = verifications.find(v => v.document_type === docType);
    if (!doc) return 'pending';
    if (doc.status === 'verified') return 'completed';
    if (doc.status === 'rejected') return 'rejected';
    return 'current';
  };

  return [
    {
      id: 'profile',
      title: 'Complete Profile',
      description: 'Fill in your vendor profile information',
      status: 'completed', // Assumed complete if on verification page
      icon: <User className="h-4 w-4" />,
    },
    {
      id: 'ktp',
      title: 'Upload KTP',
      description: 'Submit your valid Indonesian ID card',
      status: getDocStatus('ktp'),
      icon: <FileUp className="h-4 w-4" />,
    },
    {
      id: 'nib',
      title: 'Business Registration (NIB)',
      description: 'Upload your business registration document',
      status: getDocStatus('nib'),
      icon: <Store className="h-4 w-4" />,
    },
    {
      id: 'verification',
      title: 'Admin Verification',
      description: 'Wait for admin to verify your documents',
      status: verifications.length >= 2 && verifications.every(v => v.status === 'verified') 
        ? 'completed' 
        : verifications.some(v => v.status === 'pending') 
          ? 'current' 
          : 'pending',
      icon: <Shield className="h-4 w-4" />,
    },
  ];
}
