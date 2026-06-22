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
import { useConfirmDP } from "@/features/confirmations/hooks/useConfirmations";
import { ConfirmDPPayload } from "@/features/confirmations/types";

const schema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  nomor_identitas: z.string().min(10, "Nomor identitas tidak valid"),
  nomor_telepon: z.string().min(9, "Nomor telepon tidak valid"),
  tanggal_masuk: z.string().min(1, "Tanggal masuk wajib diisi"),
  durasi_sewa: z.coerce.number().int().positive("Durasi harus lebih dari 0"),
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
      nama: "",
      nomor_identitas: "",
      nomor_telepon: "",
      tanggal_masuk: "",
      durasi_sewa: 1,
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
        {[
          {
            name: "nama" as const,
            label: "Nama Lengkap",
            placeholder: "Nama lengkap penghuni",
          },
          {
            name: "nomor_identitas" as const,
            label: "Nomor KTP",
            placeholder: "16 digit nomor KTP",
          },
          {
            name: "nomor_telepon" as const,
            label: "Nomor Telepon",
            placeholder: "08xxxxxxxxxx",
          },
        ].map(({ name, label, placeholder }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input placeholder={placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="tanggal_masuk"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Masuk</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="durasi_sewa"
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
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Memproses..." : "Konfirmasi Penghuni Masuk"}
        </Button>
      </form>
    </Form>
  );
}
