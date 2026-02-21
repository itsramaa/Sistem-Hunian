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
import { SecuritySettings } from "../../types";

const formSchema = z.object({
  twoFactorAuth: z.boolean().default(true),
  sessionTimeout: z.boolean().default(true),
  auditLogging: z.boolean().default(true),
  ipWhitelist: z.boolean().default(false),
});

interface SecuritySettingsFormProps {
  initialValues: SecuritySettings;
  onSave: (values: SecuritySettings) => void;
  isUpdating?: boolean;
}

export function SecuritySettingsForm({
  initialValues,
  onSave,
  isUpdating = false,
}: SecuritySettingsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values as SecuritySettings);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Configuration</CardTitle>
        <CardDescription>
          Manage security settings for the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="twoFactorAuth"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">
                      Two-Factor Authentication (2FA)
                    </FormLabel>
                    <FormDescription>
                      Enforce 2FA for all admin accounts.
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
              name="auditLogging"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">
                      Audit Logging
                    </FormLabel>
                    <FormDescription>
                      Keep detailed logs of all administrative actions.
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
              name="sessionTimeout"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">
                      Session Timeout
                    </FormLabel>
                    <FormDescription>
                      Automatically log out inactive users after 30 minutes.
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
                Save Security Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
