import { EVENT_COLORS } from "@/constants/analytics";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { endOfDay, format, startOfDay, subDays, subHours } from "date-fns";
import { Activity, Clock, CreditCard, Eye, MessageSquare, MousePointer, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { useRealTimeAnalytics } from "../hooks/useRealTimeAnalytics";
import { EventTypeData, HourlyData, PageViewData } from "../types";

export function RealTimeAnalytics() {
  const { events, lastUpdate } = useRealTimeAnalytics();

  // Calculate metrics
  const todayEvents = events.filter(e => 
    new Date(e.created_at) >= startOfDay(new Date())
  );

  const pageViews = events.filter(e => e.event_type === 'page_view');
  const paymentEvents = events.filter(e => 
    e.event_type.includes('payment') || e.event_type.includes('order')
  );
  const interactionEvents = events.filter(e => 
    !e.event_type.includes('page_view')
  );
  const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean)).size;

  // Page views by page
  const pageViewsByPage: PageViewData[] = Object.entries(
    pageViews.reduce((acc, e) => {
      const page = e.page || 'Unknown';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([page, views]) => ({ page: page.replace(/\//g, '') || 'Home', views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  // Events by type
  const eventsByType: EventTypeData[] = Object.entries(
    events.reduce((acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([type, count]) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count,
      fill: EVENT_COLORS[type] || EVENT_COLORS.default,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Hourly activity (last 24 hours)
  const hourlyActivity: HourlyData[] = Array.from({ length: 24 }, (_, i) => {
    const hour = subHours(new Date(), 23 - i);
    const hourStart = startOfDay(hour);
    hourStart.setHours(hour.getHours());
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourStart.getHours() + 1);

    const count = events.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate >= hourStart && eventDate < hourEnd;
    }).length;

    return {
      hour: format(hour, 'HH:00'),
      events: count,
    };
  });

  // Daily trend (last 7 days)
  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });

    return {
      day: format(day, 'EEE'),
      pageViews: dayEvents.filter(e => e.event_type === 'page_view').length,
      payments: dayEvents.filter(e => e.event_type.includes('payment')).length,
      interactions: dayEvents.filter(e => !e.event_type.includes('page_view')).length,
    };
  });

  const chartConfig = {
    events: { label: "Events", color: "hsl(var(--primary))" },
    pageViews: { label: "Page Views", color: "hsl(var(--primary))" },
    payments: { label: "Payments", color: "hsl(var(--success))" },
    interactions: { label: "Interactions", color: "hsl(var(--accent))" },
  };

  return (
    <div className="space-y-6">
      {/* Header with live indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Real-Time Analytics
          </h2>
          <p className="text-muted-foreground">Live data from user interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {format(lastUpdate, 'HH:mm:ss')}
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-success mr-2 inline-block" />
            Live
          </Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Page Views (7d)</p>
                <p className="text-2xl font-bold">{pageViews.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{todayEvents.filter(e => e.event_type === 'page_view').length} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CreditCard className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Events (7d)</p>
                <p className="text-2xl font-bold">{paymentEvents.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{todayEvents.filter(e => e.event_type.includes('payment')).length} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <MousePointer className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interactions (7d)</p>
                <p className="text-2xl font-bold">{interactionEvents.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{todayEvents.filter(e => !e.event_type.includes('page_view')).length} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <Users className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Sessions (7d)</p>
                <p className="text-2xl font-bold">{uniqueSessions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{events.length} total events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Hourly Activity
            </CardTitle>
            <CardDescription>Events over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <AreaChart data={hourlyActivity}>
                <XAxis dataKey="hour" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              7-Day Trend
            </CardTitle>
            <CardDescription>Daily breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <LineChart data={dailyTrend}>
                <XAxis dataKey="day" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="pageViews" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                <Line type="monotone" dataKey="payments" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
                <Line type="monotone" dataKey="interactions" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))" }} />
              </LineChart>
            </ChartContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Page Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-sm text-muted-foreground">Interactions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Top Pages
            </CardTitle>
            <CardDescription>Most visited pages in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {pageViewsByPage.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px]">
                <BarChart data={pageViewsByPage} layout="vertical">
                  <XAxis type="number" fontSize={12} tickLine={false} />
                  <YAxis dataKey="page" type="category" width={100} fontSize={12} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No page view data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              Event Types
            </CardTitle>
            <CardDescription>Breakdown by event type</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsByType.length > 0 ? (
              <>
                <ChartContainer config={chartConfig} className="h-[180px]">
                  <PieChart>
                    <Pie
                      data={eventsByType}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                    >
                      {eventsByType.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {eventsByType.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-muted-foreground truncate">{item.type}: {item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No event data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Events
          </CardTitle>
          <CardDescription>Latest user interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {events.slice(0, 20).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: EVENT_COLORS[event.event_type] || EVENT_COLORS.default }}
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.page || 'No page'} • Session: {event.session_id?.slice(0, 8) || 'N/A'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), 'HH:mm:ss')}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No events recorded yet. Visit pages to generate analytics data.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
