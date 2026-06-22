import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "@/shared/utils/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

interface MonthPickerProps {
  value?: string; // format: "YYYY-MM"
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function MonthPicker({
  value,
  onChange,
  onClear,
  placeholder = "Pilih periode",
  className,
}: MonthPickerProps) {
  const today = new Date();
  const [year, setYear] = React.useState(() => {
    if (value) return parseInt(value.split("-")[0]);
    return today.getFullYear();
  });
  const [open, setOpen] = React.useState(false);

  const selectedYear = value ? parseInt(value.split("-")[0]) : null;
  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : null;

  const displayLabel = value
    ? `${MONTHS[parseInt(value.split("-")[1]) - 1]} ${value.split("-")[0]}`
    : null;

  const handleSelect = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, "0");
    onChange(`${year}-${mm}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "rounded-xl h-10 gap-2 font-normal justify-start",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="truncate">{displayLabel ?? placeholder}</span>
          {value && onClear && (
            <span
              role="button"
              aria-label="Hapus filter periode"
              className="ml-auto p-0.5 rounded-full hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        {/* Year nav */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Tahun sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Tahun berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((m, i) => {
            const isSelected = selectedYear === year && selectedMonth === i;
            const isCurrentMonth =
              today.getFullYear() === year && today.getMonth() === i;
            return (
              <button
                key={m}
                onClick={() => handleSelect(i)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground font-medium"
                    : isCurrentMonth
                      ? "border border-primary/40 text-primary font-medium hover:bg-primary/10"
                      : "hover:bg-muted text-foreground",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
