import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Trash2 } from "lucide-react";
import { DynamicPricingRule, RULE_TYPES, ADJUSTMENT_TYPES } from "../services/dynamicPricingService";
import { useTogglePricingRule, useDeletePricingRule } from "../hooks/useDynamicPricing";
import { format } from "date-fns";

interface Props {
  rules: DynamicPricingRule[];
  properties: { id: string; name: string }[];
}

const getRuleTypeLabel = (t: string) => RULE_TYPES.find((r) => r.value === t)?.label || t;
const getAdjLabel = (t: string) => ADJUSTMENT_TYPES.find((r) => r.value === t)?.label || t;

export function PricingRulesTable({ rules, properties }: Props) {
  const toggle = useTogglePricingRule();
  const del = useDeletePricingRule();

  const propName = (id: string | null) => {
    if (!id) return "Semua";
    return properties.find((p) => p.id === id)?.name || id.slice(0, 8);
  };

  const fmtAdj = (r: DynamicPricingRule) =>
    r.adjustment_type === "percentage"
      ? `${r.adjustment_value > 0 ? "+" : ""}${r.adjustment_value}%`
      : `${r.adjustment_value > 0 ? "+" : ""}Rp ${r.adjustment_value.toLocaleString("id-ID")}`;

  if (!rules.length) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Belum ada aturan harga dinamis.</p>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Penyesuaian</TableHead>
            <TableHead>Properti</TableHead>
            <TableHead>Prioritas</TableHead>
            <TableHead>Berlaku</TableHead>
            <TableHead>Aktif</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.rule_name}</TableCell>
              <TableCell><Badge variant="outline">{getRuleTypeLabel(r.rule_type)}</Badge></TableCell>
              <TableCell className={r.adjustment_value > 0 ? "text-green-600" : "text-red-600"}>{fmtAdj(r)}</TableCell>
              <TableCell className="text-sm">{propName(r.property_id)}</TableCell>
              <TableCell>{r.priority}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {r.valid_from ? format(new Date(r.valid_from), "dd/MM/yy") : "—"} – {r.valid_until ? format(new Date(r.valid_until), "dd/MM/yy") : "—"}
              </TableCell>
              <TableCell>
                <Switch checked={r.is_active} onCheckedChange={(c) => toggle.mutate({ id: r.id, is_active: c })} />
              </TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
