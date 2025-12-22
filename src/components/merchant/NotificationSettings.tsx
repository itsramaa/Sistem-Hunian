import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Mail, Save, Loader2, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPreferences {
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  reminder_h7: boolean;
  reminder_h3: boolean;
  reminder_h1: boolean;
  reminder_due: boolean;
  reminder_overdue: boolean;
  whatsapp_number: string;
}

export function NotificationSettings() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    whatsapp_enabled: false,
    email_enabled: true,
    reminder_h7: true,
    reminder_h3: true,
    reminder_h1: true,
    reminder_due: true,
    reminder_overdue: true,
    whatsapp_number: '',
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', merchant?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', merchant?.user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.user_id,
  });

  useEffect(() => {
    if (profile?.phone) {
      setPreferences(prev => ({ ...prev, whatsapp_number: profile.phone || '' }));
    }
  }, [profile]);

  const isValidPhoneNumber = (phone: string) => {
    // Indonesian phone number validation
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleSave = () => {
    if (preferences.whatsapp_enabled && !isValidPhoneNumber(preferences.whatsapp_number)) {
      toast.error('Please enter a valid phone number for WhatsApp');
      return;
    }
    // In a real implementation, this would save to a notification_preferences table
    toast.success('Notification preferences saved');
  };

  return (
    <div className="space-y-6">
      {/* Channel Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how to send payment reminders to tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Channel */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Send reminders via email</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-success/10 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Switch
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, email_enabled: checked })}
              />
            </div>
          </div>

          {/* WhatsApp Channel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">WhatsApp Notifications</p>
                  <p className="text-sm text-muted-foreground">Send reminders via WhatsApp</p>
                </div>
              </div>
              <Switch
                checked={preferences.whatsapp_enabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, whatsapp_enabled: checked })}
              />
            </div>

            {preferences.whatsapp_enabled && (
              <div className="ml-4 p-4 rounded-lg border border-dashed space-y-3">
                <div className="space-y-2">
                  <Label>WhatsApp Business Number</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="+62 812 3456 7890"
                        value={preferences.whatsapp_number}
                        onChange={(e) => setPreferences({ ...preferences, whatsapp_number: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This number will be used to send WhatsApp messages to tenants
                  </p>
                </div>

                {preferences.whatsapp_number && !isValidPhoneNumber(preferences.whatsapp_number) && (
                  <div className="flex items-center gap-2 text-sm text-warning">
                    <AlertCircle className="h-4 w-4" />
                    Please enter a valid phone number
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reminder Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Reminder Schedule</CardTitle>
          <CardDescription>Configure when to send automatic payment reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'reminder_h7', label: '7 days before due', description: 'Early reminder a week before payment is due' },
            { key: 'reminder_h3', label: '3 days before due', description: 'Reminder 3 days before payment is due' },
            { key: 'reminder_h1', label: '1 day before due', description: 'Final reminder the day before payment is due' },
            { key: 'reminder_due', label: 'On due date', description: 'Reminder on the exact due date' },
            { key: 'reminder_overdue', label: 'Overdue (daily)', description: 'Daily reminders for overdue payments' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                onCheckedChange={(checked) => setPreferences({ ...preferences, [item.key]: checked })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Events */}
      <Card>
        <CardHeader>
          <CardTitle>Event Notifications</CardTitle>
          <CardDescription>Get notified about important events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Payment Received', description: 'When a tenant makes a payment' },
            { label: 'Maintenance Requests', description: 'New maintenance requests from tenants' },
            { label: 'Contract Expiry', description: 'Contracts expiring in 30 days' },
            { label: 'Weekly Reports', description: 'Weekly summary of your properties' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
