import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useCreateConfirmation } from "@/features/confirmations/hooks/useConfirmations";

const schema = z.object({
  room_id: z.string().uuid("Pilih kamar yang valid"),
  nama_calon_penghuni: z.string().min(2, "Nama minimal 2 karakter"),
  nominal_dp: z.coerce.number().positive("Nominal harus lebih dari 0"),
  batas_tanggal_konfirmasi: z.string().min(1, "Tanggal wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

interface ConfirmationFormProps {
  onSuccess: () => void;
  availableRooms: { id: string; nomor_kamar: string; nama_properti: string }[];
}

export function ConfirmationForm({ onSuccess, availableRooms }: ConfirmationFormProps) {
  const { mutate, isPending } = useCreateConfirmation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      room_id: "",
      nama_calon_penghuni: "",
      nominal_dp: 0,
      batas_tanggal_konfirmasi: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate(values, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kamar</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...field}
                >
                  <option value="">-- Pilih Kamar --</option>
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nomor_kamar} — {r.nama_properti}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nama_calon_penghuni"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Calon Penghuni</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nominal_dp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nominal DP (Rp)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="batas_tanggal_konfirmasi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batas Tanggal Konfirmasi</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Menyimpan..." : "Catat Konfirmasi DP"}
        </Button>
      </form>
    </Form>
  );
}
