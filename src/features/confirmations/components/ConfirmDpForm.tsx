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
import { useConfirmDP } from "@/features/confirmations/hooks/useConfirmations";
import { ConfirmDPPayload } from "@/features/confirmations/types";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  identity_number: z.string().min(10, "Nomor identitas tidak valid"),
  phone_number: z.string().min(9, "Nomor telepon tidak valid"),
  check_in_date: z.string().min(1, "Tanggal masuk wajib diisi"),
  rental_duration: z.coerce.number().int().positive("Durasi harus lebih dari 0"),
});

type FormValues = z.infer<typeof schema>;

interface ConfirmDpFormProps {
  confirmationId: string;
  onSuccess: () => void;
}

export function ConfirmDpForm({
  confirmationId,
  onSuccess,
}: ConfirmDpFormProps) {
  const { mutate, isPending } = useConfirmDP();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      identity_number: "",
      phone_number: "",
      check_in_date: "",
      rental_duration: 1,
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate(
      { id: confirmationId, payload: values as ConfirmDPPayload },
      {
        onSuccess: () => {
          form.reset();
          onSuccess();
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap penghuni" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="identity_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor KTP</FormLabel>
              <FormControl>
                <Input
                  placeholder="16 digit nomor KTP"
                  inputMode="numeric"
                  onKeyDown={(e) => {
                    if (!/[0-9]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...field}
                />
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
                <Input
                  placeholder="08xxxxxxxxxx"
                  inputMode="numeric"
                  onKeyDown={(e) => {
                    if (!/[0-9+]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="check_in_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Masuk</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pilih tanggal masuk"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rental_duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durasi Sewa (bulan)</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full rounded-xl">
          {isPending ? "Memproses..." : "Konfirmasi & Buat Penghuni"}
        </Button>
      </form>
    </Form>
  );
}
