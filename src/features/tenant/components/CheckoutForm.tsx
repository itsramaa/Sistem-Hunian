import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Loader2, LogOut } from "lucide-react";
import { format } from "date-fns";

interface CheckoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  roomNumber: string;
  onSubmit: (check_out_date: string) => Promise<void>;
  isLoading: boolean;
}

export function CheckoutForm({
  open,
  onOpenChange,
  tenantName,
  roomNumber,
  onSubmit,
  isLoading,
}: CheckoutFormProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [tanggal, setTanggal] = useState(today);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(tanggal);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Checkout Penghuni</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {tenantName} — Kamar {roomNumber}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20 text-sm">
            <LogOut className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
            <span>
              Penghuni akan di-checkout dan kamar akan kembali menjadi{" "}
              <strong>tersedia</strong>. Histori hunian tetap tersimpan.
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tanggal_keluar">Tanggal Keluar</Label>
            <DatePicker
              value={tanggal}
              onChange={setTanggal}
              placeholder="Pilih tanggal keluar"
              toDate={new Date()}
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !tanggal}
              className="gap-2 rounded-xl"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Konfirmasi Checkout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
