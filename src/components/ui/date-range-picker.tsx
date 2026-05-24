"use client"

import { format, parseISO, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Button } from "#/components/ui/button"
import { Calendar } from "#/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover"
import { cn } from "#/lib/utils"

interface DatePickerWithRangeProps {
  className?: string
  dateFrom: string
  dateTo: string
  onSelect: (range: { from: string; to: string }) => void
}

export function DatePickerWithRange({
  className,
  dateFrom,
  dateTo,
  onSelect,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: parseISO(dateFrom),
    to: parseISO(dateTo),
  })
  
  const [month, setMonth] = React.useState<Date>(parseISO(dateFrom) || new Date())

  // Synchronize internal state with external props
  React.useEffect(() => {
    const fromDate = parseISO(dateFrom);
    setDate({
      from: fromDate,
      to: parseISO(dateTo),
    })
    setMonth(fromDate)
  }, [dateFrom, dateTo])

  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate)
    if (newDate?.from && newDate?.to) {
      onSelect({
        from: format(newDate.from, "yyyy-MM-dd"),
        to: format(newDate.to, "yyyy-MM-dd"),
      })
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger 
          render={
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full h-9 justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "dd LLL, y", { locale: ptBR })} -{" "}
                {format(date.to, "dd LLL, y", { locale: ptBR })}
              </>
            ) : (
              format(date.from, "dd LLL, y", { locale: ptBR })
            )
          ) : (
            <span>Selecione um período</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            autoFocus
            mode="range"
            month={month}
            onMonthChange={setMonth}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={1}
            locale={ptBR}
            footer={
              <div className="pt-3 border-t mt-3 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-medium"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const start = startOfMonth(month);
                    const end = endOfMonth(month);
                    handleSelect({ from: start, to: end });
                  }}
                >
                  Selecionar o mês inteiro
                </Button>
              </div>
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
