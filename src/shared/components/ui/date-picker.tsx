import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { cn } from "@/shared/utils/utils";

interface DatePickerProps {
  value?: string; // format: "YYYY-MM-DD"
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
  fromYear?: number;
  toYear?: number;
}

export function DatePicker({
  value,
  onChange,
  onClear,
  placeholder = "Pilih tanggal",
  className,
  disabled,
  fromDate,
  toDate,
  fromYear = 2000,
  toYear = new Date().getFullYear() + 5,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => {
    if (!value) return undefined;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [value]);

  const displayLabel = selected
    ? format(selected, "dd MMM yyyy", { locale: localeId })
    : null;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full rounded-xl h-10 gap-2 font-normal justify-start",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="truncate flex-1 text-left">
            {displayLabel ?? placeholder}
          </span>
          {value && onClear && (
            <span
              role="button"
              aria-label="Hapus tanggal"
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
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          fromDate={fromDate}
          toDate={toDate}
          fromYear={fromYear}
          toYear={toYear}
          captionLayout="dropdown-buttons"
          locale={localeId}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
