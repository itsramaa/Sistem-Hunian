import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Maintenance } from "../types";

interface Props {
  maintenance: Maintenance | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, actions: string[], cost: number) => Promise<void>;
}

export function MaintenanceCompleteDialog({ maintenance, open, onClose, onSubmit }: Props) {
  const [actions, setActions] = useState<string[]>([""]);
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);

  const addAction = () => setActions((prev) => [...prev, ""]);
  const removeAction = (i: number) => setActions((prev) => prev.filter((_, idx) => idx !== i));
  const updateAction = (i: number, val: string) =>
    setActions((prev) => prev.map((a, idx) => (idx === i ? val : a)));

  const handleClose = () => {
    setActions([""]);
    setCost("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!maintenance) return;
    const validActions = actions.filter((a) => a.trim());
    if (validActions.length === 0) return;
    setLoading(true);
    try {
      await onSubmit(maintenance.id, validActions, parseFloat(cost) || 0);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const valid = actions.some((a) => a.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tandai Selesai</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Kamar <span className="font-medium text-foreground">{maintenance?.room_number}</span>
            {" · "}{maintenance?.property_name}
          </p>

          {/* Tindakan penanganan — array */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tindakan Penanganan</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs rounded-lg"
                onClick={addAction}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah
              </Button>
            </div>
            <div className="space-y-2">
              {actions.map((action, i) => (
                <div key={i} className="flex gap-2">
                  <Textarea
                    placeholder={`Tindakan ${i + 1}`}
                    className="min-h-[70px] resize-none rounded-lg text-sm"
                    value={action}
                    onChange={(e) => updateAction(i, e.target.value)}
                  />
                  {actions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-lg text-destructive hover:text-destructive"
                      onClick={() => removeAction(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Biaya */}
          <div className="space-y-2">
            <Label htmlFor="cost">Biaya Perbaikan (Rp)</Label>
            <Input
              id="cost"
              type="number"
              min={0}
              placeholder="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Batal</Button>
          <Button onClick={handleSubmit} disabled={loading || !valid}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tandai Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
