import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { TenantScreening } from '../types';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

const gradeConfig = {
  green: { label: 'Risiko Rendah', icon: ShieldCheck, color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
  yellow: { label: 'Risiko Sedang', icon: ShieldAlert, color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  red: { label: 'Risiko Tinggi', icon: ShieldX, color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export function ScreeningScoreCard({ screening }: { screening: TenantScreening }) {
  if (!screening.screening_grade) return null;
  const config = gradeConfig[screening.screening_grade];
  const Icon = config.icon;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-5 w-5" />
          Hasil Screening
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-sm px-3 py-1 rounded-xl ${config.color}`}>
            {config.label}
          </Badge>
          <span className="text-2xl font-bold">{screening.screening_score ?? '-'}/100</span>
        </div>
        {screening.ai_assessment && (
          <p className="text-sm text-muted-foreground">
            {(screening.ai_assessment as any)?.summary || 'Penilaian AI selesai.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
