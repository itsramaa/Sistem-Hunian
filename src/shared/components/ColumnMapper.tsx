import { useMemo, useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export interface MappingField {
  key: string;
  label: string;
  required: boolean;
}

interface ColumnMapperProps {
  csvHeaders: string[];
  requiredFields: MappingField[];
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

const COMMON_ALIASES: Record<string, string[]> = {
  name: ['nama', 'name', 'nama_properti', 'property_name', 'judul'],
  property_type: ['tipe', 'type', 'property_type', 'tipe_properti', 'jenis'],
  address: ['alamat', 'address', 'alamat_lengkap'],
  city: ['kota', 'city', 'kabupaten'],
  province: ['provinsi', 'province', 'propinsi'],
  postal_code: ['kode_pos', 'postal_code', 'kodepos', 'zip'],
  description: ['deskripsi', 'description', 'keterangan', 'catatan'],
  unit_number: ['nomor_unit', 'unit_number', 'no_unit', 'kamar', 'no_kamar'],
  unit_type: ['tipe_unit', 'unit_type', 'tipe_kamar', 'jenis_unit'],
  floor: ['lantai', 'floor', 'lt'],
  size_sqm: ['luas', 'size_sqm', 'luas_m2', 'ukuran'],
  rent_amount: ['harga', 'rent_amount', 'harga_sewa', 'sewa', 'biaya'],
  status: ['status', 'kondisi'],
  deposit_amount: ['deposit', 'deposit_amount', 'uang_muka'],
};

function findBestMatch(fieldKey: string, csvHeaders: string[]): string | null {
  const aliases = COMMON_ALIASES[fieldKey] || [fieldKey];
  const normalizedHeaders = csvHeaders.map(h => h.toLowerCase().replace(/[\s\-]/g, '_'));
  
  for (const alias of aliases) {
    const idx = normalizedHeaders.findIndex(h => h === alias);
    if (idx !== -1) return csvHeaders[idx];
  }
  // partial match
  for (const alias of aliases) {
    const idx = normalizedHeaders.findIndex(h => h.includes(alias) || alias.includes(h));
    if (idx !== -1) return csvHeaders[idx];
  }
  return null;
}

export function ColumnMapper({ csvHeaders, requiredFields, onConfirm, onCancel }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    const autoMap: Record<string, string> = {};
    for (const field of requiredFields) {
      const match = findBestMatch(field.key, csvHeaders);
      if (match) autoMap[field.key] = match;
    }
    setMapping(autoMap);
  }, [csvHeaders, requiredFields]);

  const unmappedRequired = useMemo(
    () => requiredFields.filter(f => f.required && !mapping[f.key]),
    [requiredFields, mapping]
  );

  const canConfirm = unmappedRequired.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs">
          {csvHeaders.length} kolom terdeteksi
        </Badge>
        {unmappedRequired.length > 0 ? (
          <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {unmappedRequired.length} kolom wajib belum dipetakan
          </Badge>
        ) : (
          <Badge variant="outline" className="text-success border-success/30 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Semua kolom wajib terpetakan
          </Badge>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {requiredFields.map((field) => (
          <div key={field.key} className="flex items-center gap-2">
            <div className="w-1/3 text-sm truncate">
              <span className={field.required ? 'font-medium' : 'text-muted-foreground'}>
                {field.label}
              </span>
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <Select
                value={mapping[field.key] || '__none__'}
                onValueChange={(v) => setMapping(prev => ({ ...prev, [field.key]: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="— Pilih kolom —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tidak dipetakan —</SelectItem>
                  {csvHeaders.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Batal</Button>
        <Button size="sm" disabled={!canConfirm} onClick={() => onConfirm(mapping)}>
          Lanjutkan Preview
        </Button>
      </div>
    </div>
  );
}
