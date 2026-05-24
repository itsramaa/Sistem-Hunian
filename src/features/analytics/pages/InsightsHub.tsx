import { BarChart3, Briefcase, Brain, Target, Globe, ShieldAlert, UserCheck, TrendingUp, FileSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";

interface InsightCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  accentClass: string;
}

const performanceCards: InsightCard[] = [
  {
    title: "Template Laporan",
    description: "Template eksekutif, keuangan, dan analisis risiko",
    icon: TrendingUp,
    path: "/merchant/report-templates",
    accentClass: "from-warning/20 to-warning/5",
  },
  {
    title: "Portofolio Komparatif",
    description: "Bandingkan performa antar properti Anda",
    icon: Briefcase,
    path: "/merchant/comparative-portfolio",
    accentClass: "from-accent/20 to-accent/5",
  },
  {
    title: "Pusat Dokumen",
    description: "Kelola dan arsipkan dokumen properti Anda",
    icon: FileSearch,
    path: "/merchant/documents",
    accentClass: "from-success/20 to-success/5",
  },
];

const intelligenceCards: InsightCard[] = [
  {
    title: "Prediksi ML",
    description: "Forecast pendapatan, prediksi churn, dan pricing optimal",
    icon: Brain,
    path: "/merchant/ml-analytics",
    accentClass: "from-primary/20 to-primary/5",
  },
  {
    title: "Strategi DSS",
    description: "Rekomendasi koleksi, maintenance, dan investasi",
    icon: Target,
    path: "/merchant/dss-advisor",
    accentClass: "from-success/20 to-success/5",
  },
  {
    title: "Tren Pasar",
    description: "Intelijen harga dan forecast okupansi regional",
    icon: Globe,
    path: "/merchant/market-intelligence",
    accentClass: "from-warning/20 to-warning/5",
  },
  {
    title: "Risiko Keuangan",
    description: "Analisis risiko keuangan dan assessment portofolio",
    icon: ShieldAlert,
    path: "/merchant/financial-risk",
    accentClass: "from-destructive/20 to-destructive/5",
  },
  {
    title: "Skor Penyewa",
    description: "Penilaian kualitas penyewa berbasis data historis",
    icon: UserCheck,
    path: "/merchant/tenant-quality",
    accentClass: "from-accent/20 to-accent/5",
  },
  {
    title: "Kualitas Data",
    description: "Riwayat validasi dan skor kualitas data properti",
    icon: FileSearch,
    path: "/merchant/data-quality",
    accentClass: "from-primary/20 to-primary/5",
  },
];

function InsightCardItem({ card, onClick }: { card: InsightCard; onClick: () => void }) {
  return (
    <Card
      className={cn(
        "group cursor-pointer bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40",
        "hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
      )}
      onClick={onClick}
    >
      <CardHeader className="space-y-3">
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", card.accentClass)}>
          <card.icon className="h-5 w-5 text-foreground/80" />
        </div>
        <div>
          <CardTitle className="text-base">{card.title}</CardTitle>
          <CardDescription className="text-sm mt-1">{card.description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function InsightsHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <PageHeader icon={BarChart3} title="Alat & Intelijen" description="Alat analitik dan intelijen AI untuk mengoptimalkan bisnis Anda" />

      {/* Performance Section */}
      <section className="space-y-4" role="region" aria-labelledby="performance-heading">
        <div className="flex items-center gap-2">
          <span id="performance-heading" className="text-lg font-semibold">📊 Performa</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Standar</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceCards.map((card) => (
            <InsightCardItem key={card.path} card={card} onClick={() => navigate(card.path)} />
          ))}
        </div>
      </section>

      {/* Intelligence Section */}
      <section className="space-y-4" role="region" aria-labelledby="intelligence-heading">
        <div className="flex items-center gap-2">
          <span id="intelligence-heading" className="text-lg font-semibold">🧠 Intelijen AI</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Premium</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {intelligenceCards.map((card) => (
            <InsightCardItem key={card.path} card={card} onClick={() => navigate(card.path)} />
          ))}
        </div>
      </section>
    </div>
  );
}
