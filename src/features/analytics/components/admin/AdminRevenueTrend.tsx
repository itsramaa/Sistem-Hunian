
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

interface AdminRevenueTrendProps {
  data: { month: string; revenue: number }[];
}

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
};

export function AdminRevenueTrend({ data }: AdminRevenueTrendProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Revenue Trend
        </CardTitle>
        <CardDescription>Monthly revenue from database</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <AreaChart data={data}>
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
