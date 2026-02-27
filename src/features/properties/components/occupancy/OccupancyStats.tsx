interface Props {
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  notice: number;
}

export function OccupancyStats({ total, occupied, available, maintenance, notice }: Props) {
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const items = [
    { label: 'Total Unit', value: total, color: 'text-foreground' },
    { label: 'Okupansi', value: `${rate}%`, color: rate >= 85 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-destructive' },
    { label: 'Terisi', value: occupied, color: 'text-emerald-600' },
    { label: 'Kosong', value: available, color: 'text-blue-600' },
    { label: 'Maintenance', value: maintenance, color: 'text-amber-600' },
    { label: 'Notice', value: notice, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {items.map(i => (
        <div key={i.label} className="bg-card border border-border/50 rounded-xl px-3 py-2 text-center">
          <p className={`text-lg font-bold ${i.color}`}>{i.value}</p>
          <p className="text-xs text-muted-foreground">{i.label}</p>
        </div>
      ))}
    </div>
  );
}
