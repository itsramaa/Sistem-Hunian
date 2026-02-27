import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';

interface Props {
  unitTypes: string[];
  floors: number[];
  properties: { id: string; name: string }[];
  filters: { unitType: string; floor: string; property: string; maxPrice: string };
  onChange: (filters: Props['filters']) => void;
}

export function OccupancyFilters({ unitTypes, floors, properties, filters, onChange }: Props) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={filters.property} onValueChange={v => set('property', v)}>
        <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Properti" /></SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">Semua Properti</SelectItem>
          {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.unitType} onValueChange={v => set('unitType', v)}>
        <SelectTrigger className="w-36 rounded-xl"><SelectValue placeholder="Tipe" /></SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">Semua Tipe</SelectItem>
          {unitTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.floor} onValueChange={v => set('floor', v)}>
        <SelectTrigger className="w-32 rounded-xl"><SelectValue placeholder="Lantai" /></SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">Semua Lantai</SelectItem>
          {floors.map(f => <SelectItem key={f} value={String(f)}>Lantai {f}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Maks harga"
        value={filters.maxPrice}
        onChange={e => set('maxPrice', e.target.value)}
        className="w-36 rounded-xl"
      />
    </div>
  );
}
