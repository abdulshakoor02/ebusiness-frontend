"use client"

import * as React from "react"
import { CalendarIcon, XIcon } from "lucide-react"
import { format, subDays, startOfDay, endOfDay, isSameDay, differenceInDays } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type DateField = 'created_at' | 'updated_at' | 'converted_at'

export interface DateRangePickerProps {
  startDate?: Date
  endDate?: Date
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  dateField?: DateField
  onDateFieldChange?: (field: DateField) => void
  showFieldSelector?: boolean
  placeholder?: string
  className?: string
}

const DATE_FIELD_LABELS: Record<DateField, string> = {
  created_at: 'Created Date',
  updated_at: 'Updated Date',
  converted_at: 'Converted Date',
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  dateField = 'created_at',
  onDateFieldChange,
  showFieldSelector = false,
  placeholder = "Select date range",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const getActivePreset = (): 'today' | 'last7' | 'last30' | null => {
    if (!startDate || !endDate) return null
    
    const today = new Date()
    const startDay = startOfDay(today)
    const endDay = endOfDay(today)
    
    if (isSameDay(startDate, startDay) && isSameDay(endDate, endDay)) {
      return 'today'
    }
    
    const last7Start = startOfDay(subDays(today, 6))
    if (isSameDay(startDate, last7Start) && isSameDay(endDate, endDay) && differenceInDays(endDay, startDate) === 6) {
      return 'last7'
    }
    
    const last30Start = startOfDay(subDays(today, 29))
    if (isSameDay(startDate, last30Start) && isSameDay(endDate, endDay) && differenceInDays(endDay, startDate) === 29) {
      return 'last30'
    }
    
    return null
  }

  const activePreset = getActivePreset()

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onStartDateChange(startOfDay(range.from))
    } else {
      onStartDateChange(undefined)
    }
    
    if (range?.to) {
      onEndDateChange(endOfDay(range.to))
    } else {
      onEndDateChange(undefined)
    }
  }

  const handlePresetClick = (preset: 'today' | 'last7' | 'last30') => {
    const today = new Date()
    
    switch (preset) {
      case 'today':
        onStartDateChange(startOfDay(today))
        onEndDateChange(endOfDay(today))
        break
      case 'last7':
        onStartDateChange(startOfDay(subDays(today, 6)))
        onEndDateChange(endOfDay(today))
        break
      case 'last30':
        onStartDateChange(startOfDay(subDays(today, 29)))
        onEndDateChange(endOfDay(today))
        break
    }
  }

  const handleClear = () => {
    onStartDateChange(undefined)
    onEndDateChange(undefined)
  }

  const formatDateRange = () => {
    if (!startDate && !endDate) return null
    
    if (startDate && endDate) {
      return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
    }
    
    if (startDate) {
      return format(startDate, 'MMM d, yyyy')
    }
    
    return null
  }

  const dateRange: DateRange = {
    from: startDate,
    to: endDate,
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {showFieldSelector && onDateFieldChange && startDate && endDate && (
        <Select value={dateField} onValueChange={(value) => onDateFieldChange(value as DateField)}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_FIELD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={startDate || endDate ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "min-w-[200px] justify-start text-left font-normal",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange() || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-2 p-3 pb-0">
            <div className="flex gap-2">
              <Button
                variant={activePreset === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('today')}
                className="flex-1"
              >
                Today
              </Button>
              <Button
                variant={activePreset === 'last7' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('last7')}
                className="flex-1"
              >
                7 Days
              </Button>
              <Button
                variant={activePreset === 'last30' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('last30')}
                className="flex-1"
              >
                30 Days
              </Button>
            </div>
          </div>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            className="rounded-md border"
          />
          {(startDate || endDate) && (
            <div className="flex justify-end p-3 pt-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}