import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";

export default function MarketIntelligence() {
  return (
    <div className="space-y-6">
      <PageHeader icon={TrendingUp} title="Intelijen Pasar" description="Analitik harga & prediksi okupansi" />
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Fitur ini sedang dalam pengembangan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
