import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/shared/components/ui/form";
import { Switch } from "@/shared/components/ui/switch";
import { NotificationSettings } from "../../types";

const formSchema = z.object({
  emailNotifications: z.boolean().default(true),
  newMerchantAlerts: z.boolean().default(true),
  paymentReminders: z.boolean().default(true),
  maintenanceAlerts: z.boolean().default(true),
  weeklyReports: z.boolean().default(true),
});

interface NotificationSettingsFormProps {
  initialValues: NotificationSettings;
  onSave: (values: NotificationSettings) => void;
  isUpdating?: boolean;
}

export function NotificationSettingsForm({
  initialValues,
  onSave,
  isUpdating = false,
}: NotificationSettingsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values as NotificationSettings);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Control what notifications are sent to users and admins.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">
                      Email Notifications
                    </FormLabel>
                    <FormDescription>
                      Enable or disable all email notifications system-wide.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newMerchantAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">
                      New Merchant Alerts
                    </FormLabel>
                    <FormDescription>
                      Notify admins when a new merchant registers.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentReminders"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">
                      Payment Reminders
                    </FormLabel>
                    <FormDescription>
                      Automatically send payment reminders to tenants.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
             <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notification Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
