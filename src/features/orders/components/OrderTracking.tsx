import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  MapPin, 
  Phone,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/shared/components/ui/button";

interface OrderStep {
  id: string;
  status: string;
  label: string;
  description: string;
  timestamp?: Date;
  completed: boolean;
  current: boolean;
}

interface OrderTrackingProps {
  orderId: string;
  orderNumber: string;
  vendorName: string;
  vendorPhone?: string;
  estimatedDelivery?: Date;
  currentStatus: string;
  onRefresh?: () => Promise<void>;
  onContact?: () => void;
}

const ORDER_STEPS: Omit<OrderStep, "timestamp" | "completed" | "current">[] = [
  {
    id: "pending",
    status: "pending",
    label: "Pesanan Diterima",
    description: "Pesanan Anda telah diterima vendor",
  },
  {
    id: "confirmed",
    status: "confirmed",
    label: "Dikonfirmasi",
    description: "Vendor mengkonfirmasi pesanan",
  },
  {
    id: "processing",
    status: "processing",
    label: "Diproses",
    description: "Pesanan sedang diproses",
  },
  {
    id: "ready",
    status: "ready",
    label: "Siap Diantar",
    description: "Pesanan siap untuk pengantaran",
  },
  {
    id: "delivering",
    status: "delivering",
    label: "Dalam Pengantaran",
    description: "Kurir sedang mengantar pesanan",
  },
  {
    id: "completed",
    status: "completed",
    label: "Selesai",
    description: "Pesanan telah diterima",
  },
];

const STATUS_ORDER = ["pending", "confirmed", "processing", "ready", "delivering", "completed"];

export function OrderTracking({
  orderId,
  orderNumber,
  vendorName,
  vendorPhone,
  estimatedDelivery,
  currentStatus,
  onRefresh,
  onContact,
}: OrderTrackingProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pulseStep, setPulseStep] = useState<string | null>(null);

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const steps: OrderStep[] = ORDER_STEPS.map((step, index) => ({
    ...step,
    completed: index < currentIndex,
    current: index === currentIndex,
    timestamp: index <= currentIndex ? new Date() : undefined,
  }));

  // Pulse animation for current step
  useEffect(() => {
    if (currentStatus !== "completed") {
      setPulseStep(currentStatus);
      const interval = setInterval(() => {
        setPulseStep((prev) => (prev ? null : currentStatus));
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [currentStatus]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const getStepIcon = (step: OrderStep) => {
    if (step.completed) {
      return <CheckCircle className="h-5 w-5 text-primary" />;
    }
    
    switch (step.status) {
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "processing":
        return <Package className="h-5 w-5" />;
      case "delivering":
        return <Truck className="h-5 w-5" />;
      case "completed":
        return <MapPin className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Lacak Pesanan</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              #{orderNumber}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vendor info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">{vendorName}</p>
            {estimatedDelivery && (
              <p className="text-sm text-muted-foreground">
                Estimasi: {format(estimatedDelivery, "d MMM yyyy, HH:mm", { locale: id })}
              </p>
            )}
          </div>
          {onContact && (
            <Button variant="outline" size="sm" onClick={onContact}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Hubungi
            </Button>
          )}
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <Badge
            variant={currentStatus === "completed" ? "default" : "secondary"}
            className="text-base px-4 py-2"
          >
            {steps.find((s) => s.current)?.label || currentStatus}
          </Badge>
        </div>

        {/* Timeline */}
        <div className="relative">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-4">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    step.completed && "bg-primary border-primary text-primary-foreground",
                    step.current && "border-primary",
                    !step.completed && !step.current && "border-muted-foreground/30 text-muted-foreground/50",
                    pulseStep === step.status && "animate-pulse ring-4 ring-primary/30"
                  )}
                >
                  {getStepIcon(step)}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-16 transition-colors",
                      step.completed ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="pb-8 flex-1">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "font-medium",
                      !step.completed && !step.current && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {format(step.timestamp, "HH:mm", { locale: id })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact vendor */}
        {vendorPhone && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Hubungi Vendor: {vendorPhone}</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${vendorPhone}`}>Telepon</a>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
