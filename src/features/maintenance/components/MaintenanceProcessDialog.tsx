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
import { Loader2 } from "lucide-react";
import type { Maintenance } from "../types";

interface Props {
  maintenance: Maintenance | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, handlerName: string) => Promise<void>;
}

export function MaintenanceProcessDialog({ maintenance, open, onClose, onSubmit }: Props) {
  const [handlerName, setHandlerName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!maintenance || !handlerName.trim()) return;
    setLoading(true);
    try {
      await onSubmit(maintenance.id, handlerName.trim());
      setHandlerName("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setHandlerName(""); onClose(); } }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tandai Sedang Diproses</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Kamar <span className="font-medium text-foreground">{maintenance?.room_number}</span>
            {" · "}{maintenance?.property_name}
          </p>
          <div className="space-y-2">
            <Label htmlFor="handler">Nama Penangan</Label>
            <Input
              id="handler"
              placeholder="Masukkan nama teknisi / penanggungjawab"
              value={handlerName}
              onChange={(e) => setHandlerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
          <Button onClick={handleSubmit} disabled={loading || !handlerName.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tandai Diproses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
