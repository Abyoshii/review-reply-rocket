
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ 
  dateRange, 
  onDateRangeChange,
  className
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95",
              !dateRange && "text-muted-foreground",
              dateRange && "bg-gray-50 dark:bg-gray-800"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">{format(dateRange.from, "dd.MM.yyyy")}</span>
                  <span className="mx-2">-</span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">{format(dateRange.to, "dd.MM.yyyy")}</span>
                </>
              ) : (
                <span className="text-purple-600 dark:text-purple-400 font-medium">{format(dateRange.from, "dd.MM.yyyy")}</span>
              )
            ) : (
              <span>Выберите диапазон дат</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
