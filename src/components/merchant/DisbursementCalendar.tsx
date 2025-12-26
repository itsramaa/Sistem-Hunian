import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';

interface Disbursement {
  id: string;
  amount: number;
  status: string;
  scheduled_for: string;
  completed_at: string | null;
  type: string;
}

interface DisbursementCalendarProps {
  className?: string;
}

export function DisbursementCalendar({ className }: DisbursementCalendarProps) {
  const { merchant } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch disbursements for the current month
  const { data: disbursements = [] } = useQuery({
    queryKey: ['disbursements-calendar', merchant?.id, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!merchant?.id) return [];
      
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      // Get escrow account first
      const { data: escrowAccount } = await supabase
        .from('escrow_accounts')
        .select('id')
        .eq('merchant_id', merchant.id)
        .maybeSingle();
      
      if (!escrowAccount) return [];
      
      const { data, error } = await supabase
        .from('disbursements')
        .select('id, amount, status, scheduled_for, completed_at, type')
        .eq('escrow_account_id', escrowAccount.id)
        .gte('scheduled_for', start.toISOString())
        .lte('scheduled_for', end.toISOString())
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      return data as Disbursement[];
    },
    enabled: !!merchant?.id,
  });

  // Group disbursements by date
  const disbursementsByDate = useMemo(() => {
    const map = new Map<string, Disbursement[]>();
    disbursements.forEach(d => {
      const dateKey = format(new Date(d.scheduled_for), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, d]);
    });
    return map;
  }, [disbursements]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-destructive" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-warning" />;
      case 'processing':
        return <AlertCircle className="h-3 w-3 text-primary animate-pulse" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/20 border-success/30';
      case 'failed': return 'bg-destructive/20 border-destructive/30';
      case 'pending': return 'bg-warning/20 border-warning/30';
      case 'processing': return 'bg-primary/20 border-primary/30';
      default: return 'bg-muted';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(amount);
  };

  const selectedDisbursements = selectedDate
    ? disbursementsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  const monthTotal = disbursements
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + d.amount, 0);

  const pendingTotal = disbursements
    .filter(d => d.status === 'pending' || d.status === 'processing')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Disbursement Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold text-success">{formatCurrency(monthTotal)}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-warning">{formatCurrency(pendingTotal)}</p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayDisbursements = disbursementsByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const totalAmount = dayDisbursements.reduce((sum, d) => sum + d.amount, 0);
              
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedDate(dayDisbursements.length > 0 ? day : null)}
                        className={cn(
                          "relative p-2 min-h-[60px] rounded-md transition-colors text-left",
                          isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
                          isSelected && "ring-2 ring-primary",
                          isToday && "font-bold",
                          dayDisbursements.length > 0 && "cursor-pointer hover:bg-muted/50"
                        )}
                      >
                        <span className={cn(
                          "text-sm",
                          isToday && "bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full"
                        )}>
                          {format(day, 'd')}
                        </span>
                        
                        {dayDisbursements.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayDisbursements.slice(0, 2).map(d => (
                              <div
                                key={d.id}
                                className={cn(
                                  "flex items-center gap-1 px-1 py-0.5 rounded text-xs border",
                                  getStatusColor(d.status)
                                )}
                              >
                                {getStatusIcon(d.status)}
                                <span className="truncate">{formatCurrency(d.amount)}</span>
                              </div>
                            ))}
                            {dayDisbursements.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{dayDisbursements.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    {dayDisbursements.length > 0 && (
                      <TooltipContent>
                        <p className="font-medium">{dayDisbursements.length} disbursement(s)</p>
                        <p>Total: {formatCurrency(totalAmount)}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && selectedDisbursements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedDisbursements.map(d => (
              <div
                key={d.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  getStatusColor(d.status)
                )}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(d.status)}
                  <div>
                    <p className="font-medium capitalize">{d.type} Disbursement</p>
                    <p className="text-sm text-muted-foreground">
                      {d.completed_at
                        ? `Completed: ${format(new Date(d.completed_at), 'HH:mm')}`
                        : `Scheduled: ${format(new Date(d.scheduled_for), 'HH:mm')}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(d.amount)}
                  </p>
                  <Badge variant={d.status === 'completed' ? 'default' : 'secondary'}>
                    {d.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-success" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-warning" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span>Processing</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-destructive" />
          <span>Failed</span>
        </div>
      </div>
    </div>
  );
}
