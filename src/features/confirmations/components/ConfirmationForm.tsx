import { useEffect } from "react";
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
import { DatePicker } from "@/shared/components/ui/date-picker";
import { useCreateConfirmation } from "@/features/confirmations/hooks/useConfirmations";
import { CreateConfirmationPayload } from "@/features/confirmations/types";

const schema = z.object({
  room_id: z.string().uuid("Pilih kamar yang valid"),
  prospect_name: z.string().min(2, "Nama minimal 2 karakter"),
  phone_number: z.string().min(9, "Nomor telepon tidak valid"),
  down_payment_amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  confirmation_deadline: z.string().min(1, "Tanggal wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

interface ConfirmationFormProps {
  onSuccess: () => void;
  availableRooms: { id: string; room_number: string; property_name: string }[];
  selectedRoomPrice?: number;
}

export function ConfirmationForm({
  onSuccess,
  availableRooms,
  selectedRoomPrice,
}: ConfirmationFormProps) {
  const { mutate, isPending } = useCreateConfirmation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      room_id: "",
      prospect_name: "",
      phone_number: "",
      down_payment_amount: selectedRoomPrice ? Math.round(selectedRoomPrice * 0.1) : 0,
      confirmation_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  });

  useEffect(() => {
    if (selectedRoomPrice) {
      form.setValue("down_payment_amount", Math.round(selectedRoomPrice * 0.1));
    }
  }, [selectedRoomPrice, form]);

  const onSubmit = (values: FormValues) => {
    mutate(values as CreateConfirmationPayload, {
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
                      {r.room_number} — {r.property_name}
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
          name="prospect_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Calon Penghuni</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap calon penghuni" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Telepon</FormLabel>
              <FormControl>
                <Input placeholder="08xxxxxxxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="down_payment_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nominal DP (Rp)</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmation_deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batas Tanggal Konfirmasi</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pilih batas tanggal"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full rounded-xl">
          {isPending ? "Menyimpan..." : "Simpan Konfirmasi"}
        </Button>
      </form>
    </Form>
  );
}
