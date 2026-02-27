export interface WidgetDefinition {
  id: string;
  label: string;
  description: string;
  defaultVisible: boolean;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  { id: 'kpi_strip', label: 'Ringkasan Bisnis', description: 'KPI utama: properti, hunian, penyewa, pendapatan', defaultVisible: true },
  { id: 'quick_actions', label: 'Aksi & Langganan', description: 'Aksi cepat dan status langganan', defaultVisible: true },
  { id: 'charts', label: 'Analitik Performa', description: 'Grafik revenue, okupansi, dan pembayaran', defaultVisible: true },
  { id: 'property_overview', label: 'Rincian Detail', description: 'Ringkasan properti dan keuangan', defaultVisible: true },
  { id: 'vacancy', label: 'Manajemen Kekosongan', description: 'Lacak dan kelola unit kosong', defaultVisible: true },
  { id: 'occupancy_forecast', label: 'Prediksi Okupansi', description: 'Prediksi okupansi bulan depan dan tren', defaultVisible: true },
  { id: 'alerts_events', label: 'Peringatan & Acara', description: 'Tagihan overdue, maintenance tertunda, kontrak berakhir', defaultVisible: true },
];

export const DEFAULT_WIDGET_ORDER = WIDGET_REGISTRY.map(w => w.id);

export function getOrderedWidgets(
  widgetOrder: string[],
  hiddenWidgets: string[]
): WidgetDefinition[] {
  const hiddenSet = new Set(hiddenWidgets);
  return widgetOrder
    .map(id => WIDGET_REGISTRY.find(w => w.id === id))
    .filter((w): w is WidgetDefinition => !!w && !hiddenSet.has(w.id));
}
