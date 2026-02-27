import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { CalendarClock, Plus, List, Calendar, AlertTriangle } from 'lucide-react';
import { usePreventiveSchedules, useOverdueSchedules, useCostComparison, useCreateSchedule, useUpdateSchedule, useExecuteSchedule } from '@/features/maintenance/hooks/usePreventiveMaintenance';
import { PreventiveCalendar } from '@/features/maintenance/components/preventive/PreventiveCalendar';
import { PreventiveScheduleList } from '@/features/maintenance/components/preventive/PreventiveScheduleList';
import { PreventiveScheduleForm } from '@/features/maintenance/components/preventive/PreventiveScheduleForm';
import { CostComparisonCard } from '@/features/maintenance/components/preventive/CostComparisonCard';

export default function MerchantPreventiveMaintenance() {
  const [showForm, setShowForm] = useState(false);
  const { data: schedules, isLoading } = usePreventiveSchedules();
  const { data: overdue } = useOverdueSchedules();
  const { data: costData, isLoading: costLoading } = useCostComparison();
  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();
  const executeMutation = useExecuteSchedule();

  const activeCount = schedules?.filter(s => s.isActive).length || 0;
  const overdueCount = overdue?.length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarClock}
        title="Maintenance Preventif"
        description="Jadwalkan perawatan rutin untuk mengurangi biaya darurat"
      >
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Jadwal
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Jadwal Aktif</p>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-destructive' : ''}`}>
              {overdueCount}
              {overdueCount > 0 && <AlertTriangle className="inline h-4 w-4 ml-1" />}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Est. Biaya/Bulan</p>
            <p className="text-2xl font-bold">
              Rp {((costData?.preventiveCost || 0) / 12).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl col-span-2 md:col-span-1">
          <CostComparisonCard
            preventiveCost={costData?.preventiveCost || 0}
            emergencyCost={costData?.emergencyCost || 0}
            loading={costLoading}
          />
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1"><Calendar className="h-4 w-4" /> Kalender</TabsTrigger>
          <TabsTrigger value="list" className="gap-1"><List className="h-4 w-4" /> Daftar</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <PreventiveCalendar schedules={schedules || []} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <PreventiveScheduleList
            schedules={schedules}
            loading={isLoading}
            onExecute={id => executeMutation.mutate(id)}
            onToggleActive={(id, isActive) => updateMutation.mutate({ id, isActive })}
            onDelete={id => updateMutation.mutate({ id, isActive: false })}
          />
        </TabsContent>
      </Tabs>

      <PreventiveScheduleForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={data => {
          createMutation.mutate(data, { onSuccess: () => setShowForm(false) });
        }}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
