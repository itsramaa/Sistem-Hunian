import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { ArrowLeft, Package, MapPin, Calendar, TrendingDown, Wrench } from 'lucide-react';

interface AssetDetail {
  id: string;
  facility_type: { name: string; asset_type: string; scope: string };
  property?: { name: string } | null;
  unit?: { unit_number: string } | null;
  serial_number: string | null;
  brand: string | null;
  condition: string;
  purchase_price: number;
  purchase_date: string | null;
  useful_life_months: number;
  salvage_value: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface AssetDetailPanelProps {
  asset: AssetDetail;
  onBack: () => void;
}

const CONDITION_LABELS: Record<string, { label: string; cls: string }> = {
  good: { label: 'Baik', cls: 'bg-success/10 text-success border-success/30' },
  damaged: { label: 'Rusak', cls: 'bg-destructive/10 text-destructive border-destructive/30' },
  lost: { label: 'Hilang', cls: 'bg-muted text-muted-foreground border-muted' },
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  available: { label: 'Tersedia', cls: 'bg-success/10 text-success border-success/30' },
  in_use: { label: 'Dipakai', cls: 'bg-primary/10 text-primary border-primary/30' },
  maintenance: { label: 'Perbaikan', cls: 'bg-warning/10 text-warning border-warning/30' },
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  elektronik: 'Elektronik',
  furnitur: 'Furnitur',
  infrastruktur: 'Infrastruktur',
  lainnya: 'Lainnya',
};

function calcDepreciation(asset: AssetDetail) {
  if (!asset.purchase_date || asset.useful_life_months <= 0) return 0;
  const monthsElapsed = Math.max(0, Math.floor((Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const monthlyDep = (asset.purchase_price - asset.salvage_value) / asset.useful_life_months;
  return Math.min(monthsElapsed * monthlyDep, asset.purchase_price - asset.salvage_value);
}

export function AssetDetailPanel({ asset, onBack }: AssetDetailPanelProps) {
  const depreciation = calcDepreciation(asset);
  const bookValue = Math.max(0, asset.purchase_price - depreciation);
  const condition = CONDITION_LABELS[asset.condition] || CONDITION_LABELS.good;
  const status = STATUS_LABELS[asset.status] || STATUS_LABELS.available;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-bold">{asset.facility_type?.name || 'Aset'}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={`rounded-full text-xs ${condition.cls}`}>{condition.label}</Badge>
            <Badge variant="outline" className={`rounded-full text-xs ${status.cls}`}>{status.label}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-2xl bg-card/90 border-border/40">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Harga Beli</p>
              <p className="text-lg font-bold">{formatCurrency(asset.purchase_price)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 border-border/40">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10"><TrendingDown className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Nilai Buku</p>
              <p className="text-lg font-bold">{formatCurrency(bookValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl bg-card/90 border-border/40">
        <CardHeader><CardTitle className="text-base">Informasi Detail</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-y-3">
            <div><span className="text-muted-foreground">Tipe</span><p className="font-medium">{asset.facility_type?.name}</p></div>
            <div><span className="text-muted-foreground">Jenis</span><p className="font-medium">{ASSET_TYPE_LABELS[asset.facility_type?.asset_type] || '-'}</p></div>
            <div><span className="text-muted-foreground">Merek</span><p className="font-medium">{asset.brand || '—'}</p></div>
            <div><span className="text-muted-foreground">Serial No.</span><p className="font-medium font-mono text-xs">{asset.serial_number || '—'}</p></div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-y-3">
            <div><span className="text-muted-foreground">Depresiasi</span><p className="font-medium text-warning">{formatCurrency(depreciation)}</p></div>
            <div><span className="text-muted-foreground">Nilai Sisa</span><p className="font-medium">{formatCurrency(asset.salvage_value)}</p></div>
            <div><span className="text-muted-foreground">Umur Pakai</span><p className="font-medium">{asset.useful_life_months} bulan</p></div>
            <div><span className="text-muted-foreground">Tanggal Beli</span><p className="font-medium">{asset.purchase_date ? format(new Date(asset.purchase_date), 'dd MMM yyyy') : '—'}</p></div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-y-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Lokasi</span>
                <p className="font-medium">
                  {asset.property?.name || '—'}
                  {asset.unit?.unit_number && ` → Unit ${asset.unit.unit_number}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Ditambahkan</span>
                <p className="font-medium">{format(new Date(asset.created_at), 'dd MMM yyyy')}</p>
              </div>
            </div>
          </div>
          {asset.notes && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground">Catatan</span>
                <p className="mt-1">{asset.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
