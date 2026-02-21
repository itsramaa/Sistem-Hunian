
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

interface AdminTenantGrowthChartProps {
  data: { month: string; newTenants: number; churnedTenants: number }[];
}

const chartConfig = {
  newTenants: { label: "New Tenants", color: "hsl(var(--success))" },
  churnedTenants: { label: "Churned", color: "hsl(var(--destructive))" },
};

export function AdminTenantGrowthChart({ data }: AdminTenantGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Growth vs Churn</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="newTenants"
              fill="hsl(var(--success))"
              name="New Tenants"
            />
            <Bar
              dataKey="churnedTenants"
              fill="hsl(var(--destructive))"
              name="Churned"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
