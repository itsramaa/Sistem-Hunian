import { useState, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isBefore } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { PreventiveSchedule } from '../../services/preventiveMaintenanceService';

const CATEGORY_COLORS: Record<string, string> = {
  electrical: 'bg-warning',
  plumbing: 'bg-primary',
  hvac: 'bg-accent',
  cleaning: 'bg-success',
  general: 'bg-muted-foreground',
};

interface Props {
  schedules: PreventiveSchedule[];
  onDayClick?: (date: string) => void;
}

export function PreventiveCalendar({ schedules, onDayClick }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startPadding = getDay(startOfMonth(currentMonth)); // 0=Sun

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, PreventiveSchedule[]>();
    schedules.filter(s => s.isActive).forEach(s => {
      const key = s.nextScheduledDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [schedules]);

  const today = new Date();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: idLocale })}</h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px text-center text-xs text-muted-foreground font-medium">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {/* Padding */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-16" />
        ))}

        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const daySchedules = schedulesByDate.get(key) || [];
          const isToday = isSameDay(day, today);
          const isOverdue = daySchedules.length > 0 && isBefore(day, today);

          return (
            <div
              key={key}
              className={`h-16 p-1 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors ${
                isToday ? 'border-primary bg-primary/5' : isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-transparent'
              }`}
              onClick={() => onDayClick?.(key)}
            >
              <span className={`text-xs ${isToday ? 'font-bold text-primary' : ''}`}>
                {format(day, 'd')}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {daySchedules.slice(0, 3).map(s => (
                  <div
                    key={s.id}
                    className={`h-1.5 w-1.5 rounded-full ${CATEGORY_COLORS[s.category] || CATEGORY_COLORS.general}`}
                    title={s.title}
                  />
                ))}
                {daySchedules.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">+{daySchedules.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${color}`} />
            <span className="capitalize">{cat === 'hvac' ? 'AC/HVAC' : cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
