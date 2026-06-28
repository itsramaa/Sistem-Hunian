import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { DatePicker } from "@/shared/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Loader2, Users } from "lucide-react";
import { useProperties } from "@/features/properties/hooks/useProperties";
import { useRooms } from "@/features/rooms/hooks/useRooms";

const createSchema = z.object({
  room_id: z.string().min(1, "Pilih kamar"),
  name: z.string().min(2, "Nama minimal 2 karakter").max(255),
  identity_number: z.string().min(1, "Nomor identitas wajib").max(100),
  phone_number: z.string().min(1, "Nomor telepon wajib").max(30),
  check_in_date: z.string().min(1, "Tanggal masuk wajib"),
  rental_duration: z.coerce.number().int().positive("Durasi harus > 0"),
});

const editSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(255),
  identity_number: z.string().min(1, "Nomor identitas wajib").max(100),
  phone_number: z.string().min(1, "Nomor telepon wajib").max(30),
  check_in_date: z.string().min(1, "Tanggal masuk wajib"),
  rental_duration: z.coerce.number().int().positive("Durasi harus > 0"),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  initialData?: {
    name: string;
    identity_number: string;
    phone_number: string;
    check_in_date: string;
    rental_duration: number;
  };
}

export function TenantForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialData,
}: TenantFormProps) {
  const isEdit = !!initialData;

  const { data: propsData } = useProperties("", 1, 100);
  const properties = propsData?.properties ?? [];
  const [selectedProp, setSelectedProp] = React.useState("");

  const { data: roomsData } = useRooms(
    "",
    1,
    200,
    selectedProp || undefined,
    "available",
  );
  const availableRooms = roomsData?.rooms ?? [];

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      room_id: "",
      name: "",
      identity_number: "",
      phone_number: "",
      check_in_date: "",
      rental_duration: 1,
    },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      identity_number: "",
      phone_number: "",
      check_in_date: "",
      rental_duration: 1,
    },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        editForm.reset({
          name: initialData.name,
          identity_number: initialData.identity_number,
          phone_number: initialData.phone_number,
          check_in_date: initialData.check_in_date,
          rental_duration: initialData.rental_duration,
        });
      } else {
        createForm.reset({
          room_id: "",
          name: "",
          identity_number: "",
          phone_number: "",
          check_in_date: "",
          rental_duration: 1,
        });
        setSelectedProp("");
      }
    }
  }, [open, isEdit]);

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Data Penghuni</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Ubah data kontak penghuni
                </p>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Nama lengkap penghuni"
                disabled={isLoading}
                {...editForm.register("name")}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="identity_number">No. Identitas</Label>
              <Input
                id="identity_number"
                placeholder="3271..."
                disabled={isLoading}
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (
                    !/[0-9]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(
                      e.key,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                {...editForm.register("identity_number")}
              />
              {editForm.formState.errors.identity_number && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.identity_number.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">No. Telepon</Label>
              <Input
                id="phone_number"
                placeholder="0812..."
                disabled={isLoading}
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (
                    !/[0-9+]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(
                      e.key,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                {...editForm.register("phone_number")}
              />
              {editForm.formState.errors.phone_number && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.phone_number.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tanggal Masuk</Label>
                <Controller
                  control={editForm.control}
                  name="check_in_date"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih tanggal"
                    />
                  )}
                />
                {editForm.formState.errors.check_in_date && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.check_in_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental_duration">Durasi (bulan)</Label>
                <Input
                  id="rental_duration"
                  type="number"
                  min={1}
                  disabled={isLoading}
                  {...editForm.register("rental_duration")}
                />
                {editForm.formState.errors.rental_duration && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.rental_duration.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
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
                disabled={isLoading}
                className="gap-2 rounded-xl"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Create form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Tambah Penghuni</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Catat penghuni baru
              </p>
            </div>
          </div>
        </DialogHeader>
        <form
          onSubmit={createForm.handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label>Properti</Label>
            <Select value={selectedProp} onValueChange={setSelectedProp}>
              <SelectTrigger className="rounded-xl h-10">
                <SelectValue placeholder="Pilih properti" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.property_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kamar (tersedia)</Label>
            <Controller
              control={createForm.control}
              name="room_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedProp}
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Pilih kamar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.room_number} — Rp
                        {r.rent_price?.toLocaleString("id-ID")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {createForm.formState.errors.room_id && (
              <p className="text-sm text-destructive">
                {createForm.formState.errors.room_id.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-name">Nama Lengkap</Label>
            <Input
              id="create-name"
              placeholder="Nama lengkap penghuni"
              disabled={isLoading}
              {...createForm.register("name")}
            />
            {createForm.formState.errors.name && (
              <p className="text-sm text-destructive">
                {createForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-identity">No. Identitas</Label>
            <Input
              id="create-identity"
              placeholder="3271..."
              disabled={isLoading}
              inputMode="numeric"
              onKeyDown={(e) => {
                if (
                  !/[0-9]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              {...createForm.register("identity_number")}
            />
            {createForm.formState.errors.identity_number && (
              <p className="text-sm text-destructive">
                {createForm.formState.errors.identity_number.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-phone">No. Telepon</Label>
            <Input
              id="create-phone"
              placeholder="0812..."
              disabled={isLoading}
              inputMode="numeric"
              onKeyDown={(e) => {
                if (
                  !/[0-9+]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                }
              }}
              {...createForm.register("phone_number")}
            />
            {createForm.formState.errors.phone_number && (
              <p className="text-sm text-destructive">
                {createForm.formState.errors.phone_number.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tanggal Masuk</Label>
              <Controller
                control={createForm.control}
                name="check_in_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Pilih tanggal"
                  />
                )}
              />
              {createForm.formState.errors.check_in_date && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.check_in_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-duration">Durasi (bulan)</Label>
              <Input
                id="create-duration"
                type="number"
                min={1}
                disabled={isLoading}
                {...createForm.register("rental_duration")}
              />
              {createForm.formState.errors.rental_duration && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.rental_duration.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
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
              disabled={isLoading}
              className="gap-2 rounded-xl"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Tambah
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
