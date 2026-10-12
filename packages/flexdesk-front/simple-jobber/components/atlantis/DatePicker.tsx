/**
 * DatePicker - Local implementation matching @jobber/components DatePicker API (legacy)
 *
 * This provides the same interface as the Atlantis component library's DatePicker,
 * allowing future migration to the actual library when fully integrated.
 *
 * @see https://atlantis.getjobber.com/components/DatePicker?webLegacy=
 */
import React, {
  type ReactElement,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { Button } from './Button';

// ── Types ────────────────────────────────────────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DatePickerActivatorProps {
  onClick: () => void;
  onBlur: () => void;
  onFocus: () => void;
  onChange: () => void;
}

interface BaseDatePickerProps {
  /** The maximum selectable date. */
  readonly maxDate?: Date;
  /** The minimum selectable date. */
  readonly minDate?: Date;
  /** The selected Date object */
  readonly selected?: Date;
  /** Determines if the focus moves to the selected date */
  readonly smartAutofocus?: boolean;
  /** Dates on the calendar to highlight */
  readonly highlightDates?: Date[];
  /** First day of the week. 0 = Sunday, 1 = Monday, etc. @default 0 */
  readonly firstDayOfWeek?: DayOfWeek;
  /** Change handler that will return the date selected. */
  onChange(val: Date): void;
  /** Change handler when the selected month changes */
  onMonthChange?(val: Date): void;
  /** Callback when the calendar open state changes */
  onOpenChange?(open: boolean): void;
}

export interface DatePickerModalProps extends BaseDatePickerProps {
  /** Use a custom activator to trigger the DatePicker */
  readonly activator?:
    | ReactElement
    | ((props: DatePickerActivatorProps) => ReactElement);
  /** Stops the user from interaction */
  readonly disabled?: boolean;
  /** Whether the datepicker should take up a whole block */
  readonly fullWidth?: boolean;
  /** Whether or not you can select a date */
  readonly readonly?: boolean;
  readonly inline?: never;
}

export interface DatePickerInlineProps extends BaseDatePickerProps {
  /** Determines if the DatePicker should be shown inline. */
  readonly inline?: boolean;
  readonly activator?: never;
  readonly disabled?: never;
  readonly fullWidth?: never;
  readonly readonly?: never;
}

export type DatePickerProps = DatePickerModalProps | DatePickerInlineProps;

// ── Helpers ──────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateInArray(date: Date, arr: Date[]): boolean {
  return arr.some(d => isSameDay(d, date));
}

function isDateDisabled(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate) {
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d < min) return true;
  }
  if (maxDate) {
    const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d > max) return true;
  }
  return false;
}

function getCalendarDays(year: number, month: number, firstDayOfWeek: DayOfWeek): Date[] {
  const days: Date[] = [];
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Fill leading days from previous month
  let startDay = firstOfMonth.getDay() - firstDayOfWeek;
  if (startDay < 0) startDay += 7;

  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Current month days
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Fill trailing days to complete the grid (always show 6 rows)
  const totalCells = Math.ceil(days.length / 7) * 7;
  const remaining = totalCells - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }

  return days;
}

function formatActivatorDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Calendar Sub-component ───────────────────────────────────────────

interface CalendarProps {
  readonly viewDate: Date;
  readonly selected?: Date;
  readonly minDate?: Date;
  readonly maxDate?: Date;
  readonly highlightDates?: Date[];
  readonly firstDayOfWeek: DayOfWeek;
  readonly isInline: boolean;
  readonly onSelect: (date: Date) => void;
  readonly onMonthChange: (date: Date) => void;
}

function Calendar({
  viewDate,
  selected,
  minDate,
  maxDate,
  highlightDates,
  firstDayOfWeek,
  isInline,
  onSelect,
  onMonthChange,
}: CalendarProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = getCalendarDays(year, month, firstDayOfWeek);

  // Reorder day labels based on firstDayOfWeek
  const orderedLabels = [
    ...DAY_LABELS.slice(firstDayOfWeek),
    ...DAY_LABELS.slice(0, firstDayOfWeek),
  ];

  const goToPrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    onMonthChange(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    onMonthChange(next);
  };

  return (
    <div
      className={cn(
        'bg-[--color-surface] rounded-lg font-sans',
        !isInline && 'shadow-lg border border-[--color-border]',
      )}
      role="dialog"
      aria-label="Calendar"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={goToPrevMonth}
          className={cn(
            'p-1 rounded hover:bg-[--color-surface--hover]',
            'text-[--color-text--secondary] transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-interactive]',
          )}
          aria-label="Previous month"
        >
          <Icon name="arrowLeft" size="small" />
        </button>
        <span className="text-sm font-semibold text-[--color-heading]">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          className={cn(
            'p-1 rounded hover:bg-[--color-surface--hover]',
            'text-[--color-text--secondary] transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-interactive]',
          )}
          aria-label="Next month"
        >
          <Icon name="arrowRight" size="small" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-[--color-border] px-1 pb-1">
        {orderedLabels.map(label => (
          <div
            key={label}
            className="text-center text-xs uppercase text-[--color-text--secondary] py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-1 py-1">
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month;
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isHighlighted =
            highlightDates && isDateInArray(day, highlightDates);
          const isDisabledDay = isDateDisabled(day, minDate, maxDate);

          const isHovered = hoveredIdx === idx;

          // Compute inline hover style since Tailwind v4 doesn't generate
          // arbitrary hover classes for files outside the main app package
          let hoverStyle: React.CSSProperties | undefined;
          if (isHovered && !isSelected && !isDisabledDay) {
            hoverStyle = isCurrentMonth
              ? { backgroundColor: '#dbeafe', color: '#1d4ed8' }
              : { backgroundColor: '#eff6ff', color: '#3b82f6' };
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabledDay}
              onClick={() => {
                if (!isDisabledDay) onSelect(day);
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={cn(
                'flex items-center justify-center',
                'w-[38px] h-[38px] text-sm rounded-md',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-interactive]',
                // Current month vs outside
                isCurrentMonth
                  ? 'text-[--color-heading]'
                  : 'text-[--color-text--secondary] bg-[--color-surface--background]',
                // Selected
                isSelected &&
                  'bg-[--color-interactive] text-white',
                // Highlighted (not selected)
                !isSelected &&
                  isHighlighted &&
                  'bg-[--color-surface--active]',
                // Cursor styles
                !isSelected && !isDisabledDay && 'cursor-pointer',
                // Disabled
                isDisabledDay && 'text-[--color-disabled] cursor-default',
              )}
              style={hoverStyle}
              aria-label={day.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              aria-selected={isSelected}
              aria-disabled={isDisabledDay}
              tabIndex={isSelected ? 0 : -1}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── DatePicker Component ─────────────────────────────────────────────

/**
 * DatePicker component following Atlantis/Jobber design system (legacy).
 *
 * Provides a calendar popup for date selection. Supports modal (popup) and
 * inline display modes, custom activators, and min/max date constraints.
 *
 * @example
 * // Basic usage
 * <DatePicker
 *   selected={selectedDate}
 *   onChange={(date) => setSelectedDate(date)}
 * />
 *
 * @example
 * // Inline calendar
 * <DatePicker
 *   selected={selectedDate}
 *   onChange={(date) => setSelectedDate(date)}
 *   inline
 * />
 *
 * @example
 * // With constraints
 * <DatePicker
 *   selected={selectedDate}
 *   onChange={(date) => setSelectedDate(date)}
 *   minDate={new Date()}
 *   maxDate={new Date(2026, 11, 31)}
 * />
 */
export function DatePicker({
  onChange,
  onMonthChange,
  onOpenChange,
  activator,
  inline,
  selected,
  readonly = false,
  disabled = false,
  fullWidth = false,
  smartAutofocus = true,
  maxDate,
  minDate,
  highlightDates,
  firstDayOfWeek = 0,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(
    selected ?? new Date(),
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Keep viewDate in sync when selected changes
  useEffect(() => {
    if (selected) {
      setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [selected]);

  // Close on outside click (modal mode only)
  useEffect(() => {
    if (inline || !open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, inline]);

  // Close on Escape (modal mode only)
  useEffect(() => {
    if (inline || !open) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
        e.stopPropagation();
      }
    }

    wrapperRef.current?.addEventListener('keydown', handleEsc);
    const ref = wrapperRef.current;
    return () => ref?.removeEventListener('keydown', handleEsc);
  }, [open, inline]);

  // Auto-focus selected date when opening
  useEffect(() => {
    if (smartAutofocus && open && calendarRef.current) {
      const selectedBtn = calendarRef.current.querySelector(
        '[aria-selected="true"]',
      ) as HTMLElement | null;
      selectedBtn?.focus();
    }
  }, [open, smartAutofocus]);

  const handleOpen = useCallback(() => {
    if (disabled || readonly) return;
    setOpen(true);
    onOpenChange?.(true);
  }, [disabled, readonly, onOpenChange]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleToggle = useCallback(() => {
    if (open) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [open, handleOpen, handleClose]);

  const handleSelect = useCallback(
    (date: Date) => {
      onChange(date);
      if (!inline) {
        handleClose();
      }
    },
    [onChange, inline, handleClose],
  );

  const handleMonthChange = useCallback(
    (date: Date) => {
      setViewDate(date);
      onMonthChange?.(date);
    },
    [onMonthChange],
  );

  // Activator props (for custom activators)
  const activatorProps: DatePickerActivatorProps = {
    onClick: handleToggle,
    onBlur: () => {},
    onFocus: () => {},
    onChange: () => {},
  };

  // ── Inline mode ──
  if (inline) {
    return (
      <div ref={wrapperRef}>
        <div ref={calendarRef}>
          <Calendar
            viewDate={viewDate}
            selected={selected}
            minDate={minDate}
            maxDate={maxDate}
            highlightDates={highlightDates}
            firstDayOfWeek={firstDayOfWeek}
            isInline
            onSelect={handleSelect}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>
    );
  }

  // ── Modal (popup) mode ──
  const renderActivator = () => {
    if (typeof activator === 'function') {
      return activator(activatorProps);
    }
    if (React.isValidElement(activator)) {
      return React.cloneElement(activator as React.ReactElement<{ onClick?: () => void }>, {
        onClick: handleToggle,
      });
    }
    // Default activator: button with calendar icon
    return (
      <Button
        type="secondary"
        variation="subtle"
        icon="calendar"
        label={selected ? formatActivatorDate(selected) : 'Select date'}
        onClick={handleToggle}
        disabled={disabled}
        fullWidth={fullWidth}
        ariaLabel="Open date picker"
        ariaHaspopup
        ariaExpanded={open}
      />
    );
  };

  return (
    <div
      ref={wrapperRef}
      className={cn('relative inline-block', fullWidth && 'w-full block')}
    >
      {renderActivator()}

      {open && (
        <div
          ref={calendarRef}
          className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg"
          style={{ minWidth: 280 }}
        >
          <Calendar
            viewDate={viewDate}
            selected={selected}
            minDate={minDate}
            maxDate={maxDate}
            highlightDates={highlightDates}
            firstDayOfWeek={firstDayOfWeek}
            isInline={false}
            onSelect={handleSelect}
            onMonthChange={handleMonthChange}
          />
        </div>
      )}
    </div>
  );
}

export default DatePicker;
