
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface RecentActivityItem {
  id: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  amount?: string;
  timestamp: string;
}

// Mock data if none provided
const MOCK_ACTIVITY: RecentActivityItem[] = [
  {
    id: "1",
    user: { name: "John Doe", email: "john@example.com" },
    action: "Paid rent for Unit 101",
    amount: "+Rp 2.500.000",
    timestamp: "2 minutes ago"
  },
  {
    id: "2",
    user: { name: "Jane Smith", email: "jane@example.com" },
    action: "New tenant registration",
    timestamp: "1 hour ago"
  },
  {
    id: "3",
    user: { name: "Bob Johnson", email: "bob@example.com" },
    action: "Maintenance request completed",
    timestamp: "3 hours ago"
  },
  {
    id: "4",
    user: { name: "Alice Brown", email: "alice@example.com" },
    action: "Merchant verification submitted",
    timestamp: "5 hours ago"
  },
  {
    id: "5",
    user: { name: "Charlie Wilson", email: "charlie@example.com" },
    action: "Withdrawal request",
    amount: "-Rp 5.000.000",
    timestamp: "1 day ago"
  },
];

interface AdminRecentActivityListProps {
  activities?: RecentActivityItem[];
}

export function AdminRecentActivityList({ activities = MOCK_ACTIVITY, className }: AdminRecentActivityListProps & { className?: string }) {
  return (
    <Card className={cn("col-span-3", className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest actions across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-8">
            {activities.map((item) => (
              <div key={item.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={item.user.avatar} alt={item.user.name} />
                  <AvatarFallback>{item.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{item.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.action}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  {item.amount && (
                    <span className={item.amount.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                      {item.amount}
                    </span>
                  )}
                  <div className="text-xs text-muted-foreground text-right mt-1">
                    {item.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
