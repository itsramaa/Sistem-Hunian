import { useState, useEffect } from 'react';
import { Download, FileText, Loader2, CheckCircle, X, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/utils';

interface ExportJob {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
}

interface AsyncReportExportProps {
  onExport: (type: string, params: Record<string, unknown>) => Promise<ExportJob>;
  className?: string;
}

export function useAsyncExport() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const { toast } = useToast();

  const startExport = async (
    type: string, 
    params: Record<string, unknown>, 
    exportFn: (type: string, params: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[]; filename: string }>
  ) => {
    const jobId = `export-${Date.now()}`;
    const newJob: ExportJob = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };

    setJobs(prev => [newJob, ...prev]);

    toast({
      title: 'Export Started',
      description: `Your ${type} report is being generated. You can continue working.`,
    });

    // Simulate async processing
    try {
      setJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'processing', progress: 10 } : j
      ));

      // Simulated progress updates
      const progressInterval = setInterval(() => {
        setJobs(prev => prev.map(j => {
          if (j.id === jobId && j.status === 'processing' && j.progress < 90) {
            return { ...j, progress: j.progress + 10 };
          }
          return j;
        }));
      }, 500);

      // Execute the actual export
      const result = await exportFn(type, params);

      clearInterval(progressInterval);

      // Generate download blob
      const csvContent = generateCSV(result.data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);

      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'completed', progress: 100, completedAt: new Date(), downloadUrl } 
          : j
      ));

      toast({
        title: 'Export Complete',
        description: `Your ${type} report is ready for download.`,
      });

      // Auto-trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      const err = error as Error;
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'failed', error: err.message || 'Export failed' } 
          : j
      ));

      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: err.message || 'Failed to generate report. Please try again.',
      });
    }
  };

  const dismissJob = (jobId: string) => {
    setJobs(prev => {
      const job = prev.find(j => j.id === jobId);
      if (job?.downloadUrl) {
        URL.revokeObjectURL(job.downloadUrl);
      }
      return prev.filter(j => j.id !== jobId);
    });
  };

  const retryJob = (jobId: string, exportFn: (type: string, params: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[]; filename: string }>) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      dismissJob(jobId);
      startExport(job.type, {}, exportFn);
    }
  };

  return { jobs, startExport, dismissJob, retryJob };
}

function generateCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const value = row[h];
      // Escape values with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ? String(value) : '';
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

interface ExportJobsPanelProps {
  jobs: ExportJob[];
  onDismiss: (id: string) => void;
  onRetry: (id: string) => void;
}

export function ExportJobsPanel({ jobs, onDismiss, onRetry }: ExportJobsPanelProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {jobs.slice(0, 3).map(job => (
        <ExportJobCard
          key={job.id}
          job={job}
          onDismiss={() => onDismiss(job.id)}
          onRetry={() => onRetry(job.id)}
        />
      ))}
      {jobs.length > 3 && (
        <div className="text-center text-sm text-muted-foreground bg-card border rounded-lg p-2">
          +{jobs.length - 3} more exports
        </div>
      )}
    </div>
  );
}

function ExportJobCard({
  job,
  onDismiss,
  onRetry,
}: {
  job: ExportJob;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const handleDownload = () => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = `${job.type}-export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className={cn(
      "animate-in slide-in-from-right-5 duration-200",
      job.status === 'failed' && "border-destructive"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm capitalize">{job.type} Report</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {(job.status === 'pending' || job.status === 'processing') && (
              <div className="space-y-1">
                <Progress value={job.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {job.status === 'pending' ? 'Waiting...' : `Processing ${job.progress}%`}
                </p>
              </div>
            )}
            
            {job.status === 'completed' && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                  Ready
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            )}
            
            {job.status === 'failed' && (
              <div className="space-y-1">
                <p className="text-xs text-destructive">{job.error || 'Export failed'}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 text-xs"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick export button component
interface QuickExportButtonProps {
  type: string;
  label?: string;
  icon?: React.ReactNode;
  onExport: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

export function QuickExportButton({
  type,
  label,
  icon,
  onExport,
  disabled,
  variant = 'outline',
}: QuickExportButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onExport}
      disabled={disabled}
      className="gap-2"
    >
      {icon || <Download className="h-4 w-4" />}
      {label || `Export ${type}`}
    </Button>
  );
}
