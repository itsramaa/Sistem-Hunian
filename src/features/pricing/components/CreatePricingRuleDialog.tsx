import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCreatePricingRule } from "../hooks/useDynamicPricing";
import { RULE_TYPES, ADJUSTMENT_TYPES } from "../services/dynamicPricingService";

interface Props {
  merchantId: string;
  properties: { id: string; name: string }[];
}

export function CreatePricingRuleDialog({ merchantId, properties }: Props) {
  const [open, setOpen] = useState(false);
  const create = useCreatePricingRule();

  const [form, setForm] = useState({
    rule_name: "",
    rule_type: "occupancy",
    adjustment_type: "percentage",
    adjustment_value: 0,
    property_id: "",
    min_price: "",
    max_price: "",
    priority: 1,
    is_active: true,
    valid_from: "",
    valid_until: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!form.rule_name) return;
    create.mutate(
      {
        merchant_id: merchantId,
        rule_name: form.rule_name,
        rule_type: form.rule_type,
        adjustment_type: form.adjustment_type,
        adjustment_value: form.adjustment_value,
        property_id: form.property_id || null,
        min_price: form.min_price ? Number(form.min_price) : null,
        max_price: form.max_price ? Number(form.max_price) : null,
        priority: form.priority,
        is_active: form.is_active,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            rule_name: "", rule_type: "occupancy", adjustment_type: "percentage",
            adjustment_value: 0, property_id: "", min_price: "", max_price: "",
            priority: 1, is_active: true, valid_from: "", valid_until: "", notes: "",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Tambah Aturan</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Aturan Harga Dinamis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nama Aturan</Label>
            <Input value={form.rule_name} onChange={(e) => setForm({ ...form, rule_name: e.target.value })} placeholder="e.g. Diskon Okupansi Rendah" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipe Aturan</Label>
              <Select value={form.rule_type} onValueChange={(v) => setForm({ ...form, rule_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipe Penyesuaian</Label>
              <Select value={form.adjustment_type} onValueChange={(v) => setForm({ ...form, adjustment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Nilai Penyesuaian {form.adjustment_type === "percentage" ? "(%)" : "(IDR)"}</Label>
            <Input type="number" value={form.adjustment_value} onChange={(e) => setForm({ ...form, adjustment_value: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Properti (opsional)</Label>
            <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
              <SelectTrigger><SelectValue placeholder="Semua Properti" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Properti</SelectItem>
                {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Harga Min (IDR)</Label>
              <Input type="number" value={form.min_price} onChange={(e) => setForm({ ...form, min_price: e.target.value })} placeholder="Opsional" />
            </div>
            <div>
              <Label>Harga Max (IDR)</Label>
              <Input type="number" value={form.max_price} onChange={(e) => setForm({ ...form, max_price: e.target.value })} placeholder="Opsional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Berlaku Dari</Label>
              <Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
            </div>
            <div>
              <Label>Berlaku Sampai</Label>
              <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Prioritas</Label>
            <Input type="number" min={1} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
            <Label>Aktif</Label>
          </div>
          <div>
            <Label>Catatan</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan opsional..." />
          </div>
          <Button onClick={handleSubmit} disabled={create.isPending || !form.rule_name} className="w-full">
            {create.isPending ? "Menyimpan..." : "Simpan Aturan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
