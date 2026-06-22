import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function getFriendlyMessage(error?: Error): string {
  if (!error) return 'Komponen gagal dimuat. Silakan muat ulang halaman.';
  const msg = error.message || '';
  if (msg.toLowerCase().includes('chunk') || msg.toLowerCase().includes('loading')) {
    return 'Gagal memuat modul. Periksa koneksi internet Anda lalu muat ulang halaman.';
  }
  if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
    return 'Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.';
  }
  if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
    return 'Anda tidak memiliki izin untuk mengakses bagian ini.';
  }
  return 'Terjadi kesalahan tak terduga. Silakan muat ulang halaman atau hubungi administrator.';
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label="Peringatan">⚠️</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">Terjadi Kesalahan</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {getFriendlyMessage(this.state.error)}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
          >
            Coba lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
