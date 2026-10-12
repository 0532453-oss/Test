/**
 * RecurringSelect - Local implementation matching @jobber/components RecurringSelect API
 *
 * Allows users to configure recurring schedule rules: daily, weekly, monthly (day of month
 * or day of week), and yearly frequencies with configurable intervals.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-selections-recurringselect--docs
 */
import React, { useId, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Content } from './Content';
import { Text } from './Text';
import { InputGroup } from './InputGroup';
import { InputNumber } from './InputNumber';
import { Select } from './Select';
import { RadioGroup, RadioOption } from './RadioGroup';

// ============================================================================
// Types (matching Atlantis RecurringSelect types)
// ============================================================================

export enum WeekDay {
  Sunday,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}

export type DayOfMonth =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30
  | 31 | 'LAST';

export enum DurationPeriod {
  Day = 'Day',
  Week = 'Week',
  DayOfMonth = 'DayOfMonth',
  WeekDayOfMonth = 'WeekDayOfMonth',
  Year = 'Year',
}

export interface RecurrenceRuleDay {
  type: DurationPeriod.Day;
}

export interface RecurrenceRuleWeek {
  type: DurationPeriod.Week;
  weekDays: Set<WeekDay>;
}

export interface RecurrenceRuleYear {
  type: DurationPeriod.Year;
}

export interface RecurrenceRuleDayOfMonth {
  type: DurationPeriod.DayOfMonth;
  date: Set<DayOfMonth>;
}

export interface RecurrenceRuleWeekDayOfMonth {
  type: DurationPeriod.WeekDayOfMonth;
  dayOfWeek: [Set<WeekDay>, Set<WeekDay>, Set<WeekDay>, Set<WeekDay>];
}

export type RecurrenceRule = {
  interval: number;
} & (
  | RecurrenceRuleDay
  | RecurrenceRuleWeek
  | RecurrenceRuleYear
  | RecurrenceRuleDayOfMonth
  | RecurrenceRuleWeekDayOfMonth
);

interface InitialStateMap {
  [DurationPeriod.Day]: { type: DurationPeriod.Day };
  [DurationPeriod.Week]: { type: DurationPeriod.Week; weekDays: Set<WeekDay> };
  [DurationPeriod.DayOfMonth]: { type: DurationPeriod.DayOfMonth; date: Set<DayOfMonth> };
  [DurationPeriod.WeekDayOfMonth]: {
    type: DurationPeriod.WeekDayOfMonth;
    dayOfWeek: [Set<WeekDay>, Set<WeekDay>, Set<WeekDay>, Set<WeekDay>];
  };
  [DurationPeriod.Year]: { type: DurationPeriod.Year };
}

const typeInitialStateMap: InitialStateMap = {
  [DurationPeriod.Day]: { type: DurationPeriod.Day },
  [DurationPeriod.Week]: { type: DurationPeriod.Week, weekDays: new Set<WeekDay>() },
  [DurationPeriod.DayOfMonth]: { type: DurationPeriod.DayOfMonth, date: new Set<DayOfMonth>() },
  [DurationPeriod.WeekDayOfMonth]: {
    type: DurationPeriod.WeekDayOfMonth,
    dayOfWeek: [new Set<WeekDay>(), new Set<WeekDay>(), new Set<WeekDay>(), new Set<WeekDay>()],
  },
  [DurationPeriod.Year]: { type: DurationPeriod.Year },
};

export const isMonthly = (
  rule: RecurrenceRule,
): rule is Extract<
  RecurrenceRule,
  { type: DurationPeriod.WeekDayOfMonth | DurationPeriod.DayOfMonth }
> =>
  rule.type === DurationPeriod.WeekDayOfMonth ||
  rule.type === DurationPeriod.DayOfMonth;

// ============================================================================
// Helper: Human-readable summary of the recurrence pattern
// ============================================================================

const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekDayShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getRecurrenceSummary(rule: RecurrenceRule): string {
  const interval = rule.interval;
  switch (rule.type) {
    case DurationPeriod.Day:
      return interval === 1 ? 'Repeats every day' : `Repeats every ${interval} days`;
    case DurationPeriod.Week: {
      const days = Array.from(rule.weekDays).sort().map(d => weekDayNames[d]);
      const dayStr = days.length > 0 ? days.join(', ') : 'no days selected';
      return interval === 1
        ? `Repeats every week on ${dayStr}`
        : `Repeats every ${interval} weeks on ${dayStr}`;
    }
    case DurationPeriod.DayOfMonth: {
      const dates = Array.from(rule.date).sort((a, b) => {
        if (a === 'LAST') return 1;
        if (b === 'LAST') return -1;
        return (a as number) - (b as number);
      });
      const dateStr = dates.length > 0
        ? dates.map(d => d === 'LAST' ? 'last day' : `${d}`).join(', ')
        : 'no dates selected';
      return interval === 1
        ? `Repeats every month on day ${dateStr}`
        : `Repeats every ${interval} months on day ${dateStr}`;
    }
    case DurationPeriod.WeekDayOfMonth: {
      const orderLabels = ['1st', '2nd', '3rd', '4th'];
      const parts: string[] = [];
      rule.dayOfWeek.forEach((weekSet, idx) => {
        const days = Array.from(weekSet).sort().map(d => weekDayNames[d]);
        if (days.length > 0) {
          parts.push(`${orderLabels[idx]} ${days.join(', ')}`);
        }
      });
      const summary = parts.length > 0 ? parts.join('; ') : 'no days selected';
      return interval === 1
        ? `Repeats every month on the ${summary}`
        : `Repeats every ${interval} months on the ${summary}`;
    }
    case DurationPeriod.Year:
      return interval === 1 ? 'Repeats every year' : `Repeats every ${interval} years`;
    default:
      return '';
  }
}

// ============================================================================
// Sub-components
// ============================================================================

// WeeklySelect: Checkbox grid for selecting days of the week
interface WeeklySelectProps {
  readonly disabled: boolean;
  readonly selectedDays: Set<WeekDay>;
  onChange(selectedDays: Set<WeekDay>): void;
}

const weekDaysArray = [0, 1, 2, 3, 4, 5, 6] as const;

function WeeklySelect({ onChange, selectedDays, disabled }: WeeklySelectProps) {
  const baseId = useId();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const day = Number(event.currentTarget.value) as WeekDay;
      const next = new Set(selectedDays);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      onChange(next);
    },
    [selectedDays, onChange],
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {weekDaysArray.map(weekDay => {
        const isSelected = selectedDays.has(weekDay);
        const inputId = `weekly-${weekDay}-${baseId}`;
        const isHovered = hoveredDay === weekDay && !isSelected && !disabled;

        // Inline hover style since Tailwind v4 doesn't generate
        // arbitrary hover classes for files outside the main app package
        const hoverStyle: React.CSSProperties | undefined = isHovered
          ? { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#1d4ed8' }
          : undefined;

        return (
          <div key={weekDay} className="relative">
            <input
              className="sr-only peer"
              disabled={disabled}
              type="checkbox"
              onChange={handleChange}
              id={inputId}
              aria-checked={isSelected}
              checked={isSelected}
              value={weekDay}
            />
            <label
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium cursor-pointer',
                'border transition-all duration-150 select-none',
                isSelected
                  ? 'bg-[--color-interactive] text-[--color-text--reverse] border-[--color-interactive]'
                  : 'bg-[--color-surface] text-[--color-text] border-[--color-border]',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              style={hoverStyle}
              htmlFor={inputId}
              onMouseEnter={() => setHoveredDay(weekDay)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {weekDayShort[weekDay]}
            </label>
          </div>
        );
      })}
    </div>
  );
}

// DayOfMonthSelect: Checkbox grid for selecting days 1–31 + LAST
interface DayOfMonthSelectProps {
  readonly selectedDays: Set<DayOfMonth>;
  readonly disabled: boolean;
  onChange(selectedDays: Set<DayOfMonth>): void;
}

const daysInMonth: (number | 'LAST')[] = [
  ...Array.from({ length: 31 }, (_, i) => i + 1),
  'LAST',
];

function DayOfMonthSelect({ selectedDays, disabled, onChange }: DayOfMonthSelectProps) {
  const baseId = useId();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.currentTarget.value;
      const day: DayOfMonth = raw === 'LAST' ? 'LAST' : (Number(raw) as DayOfMonth);
      const next = new Set(selectedDays);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      onChange(next);
    },
    [selectedDays, onChange],
  );

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {daysInMonth.map(day => {
        const isSelected = selectedDays.has(day as DayOfMonth);
        const inputId = `dom-${day}-${baseId}`;
        const isLast = day === 'LAST';

        return (
          <div key={String(day)} className={cn('relative', isLast && 'col-span-2')}>
            <input
              className="sr-only peer"
              disabled={disabled}
              type="checkbox"
              id={inputId}
              onChange={handleChange}
              aria-checked={isSelected}
              checked={isSelected}
              value={String(day)}
            />
            <label
              className={cn(
                'flex items-center justify-center h-9 rounded text-sm font-medium cursor-pointer',
                'border transition-all duration-150 select-none',
                isLast ? 'px-2' : 'w-9',
                isSelected
                  ? 'bg-[--color-interactive] text-[--color-text--reverse] border-[--color-interactive]'
                  : 'bg-[--color-surface] text-[--color-text] border-[--color-border] hover:border-[--color-interactive]',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              htmlFor={inputId}
            >
              {isLast ? 'Last' : day}
            </label>
          </div>
        );
      })}
    </div>
  );
}

// MonthlyDayOfWeekSelect: 4 rows (1st–4th week) of WeeklySelect checkboxes
interface MonthlyDayOfWeekSelectProps {
  readonly disabled: boolean;
  readonly selectedWeeks: [Set<WeekDay>, Set<WeekDay>, Set<WeekDay>, Set<WeekDay>];
  onChange(nextSelectedWeeks: [Set<WeekDay>, Set<WeekDay>, Set<WeekDay>, Set<WeekDay>]): void;
}

const orderLabels = ['1st', '2nd', '3rd', '4th'];

function MonthlyDayOfWeekSelect({ disabled, selectedWeeks, onChange }: MonthlyDayOfWeekSelectProps) {
  return (
    <div className="space-y-3">
      {selectedWeeks.map((week, index) => {
        const handleWeekChange = (weekDays: Set<WeekDay>) => {
          const next: [Set<WeekDay>, Set<WeekDay>, Set<WeekDay>, Set<WeekDay>] = [
            ...selectedWeeks,
          ] as [Set<WeekDay>, Set<WeekDay>, Set<WeekDay>, Set<WeekDay>];
          next[index] = weekDays;
          onChange(next);
        };

        return (
          <div key={index} className="flex items-center gap-3">
            <Text className="w-8 shrink-0 text-right">{orderLabels[index]}</Text>
            <WeeklySelect
              disabled={disabled}
              selectedDays={week}
              onChange={handleWeekChange}
            />
          </div>
        );
      })}
    </div>
  );
}

// MonthlySelect: Radio toggle between "Day of month" and "Day of week"
interface MonthlySelectProps {
  readonly disabled: boolean;
  readonly selectedMonthOption: DurationPeriod.DayOfMonth | DurationPeriod.WeekDayOfMonth;
  onChange(type: DurationPeriod.DayOfMonth | DurationPeriod.WeekDayOfMonth): void;
}

function MonthlySelect({ disabled, onChange, selectedMonthOption }: MonthlySelectProps) {
  return (
    <RadioGroup
      ariaLabel="Monthly Frequency Selector"
      onChange={(value) => onChange(value as DurationPeriod.DayOfMonth | DurationPeriod.WeekDayOfMonth)}
      value={selectedMonthOption}
      direction="horizontal"
      disabled={disabled}
    >
      <RadioOption value={DurationPeriod.DayOfMonth} label="Day of month" />
      <RadioOption value={DurationPeriod.WeekDayOfMonth} label="Day of week" />
    </RadioGroup>
  );
}

// CurrentRecurrenceComponent: Renders the sub-selector based on period type
interface CurrentRecurrenceProps {
  readonly disabled: boolean;
  readonly recurrenceRule: RecurrenceRule;
  onChange(newRecurrence: RecurrenceRule): void;
}

function CurrentRecurrenceComponent({ recurrenceRule, disabled, onChange }: CurrentRecurrenceProps) {
  switch (recurrenceRule.type) {
    case DurationPeriod.Week: {
      const handleWeekDays = (next: Set<WeekDay>) => {
        onChange({ ...recurrenceRule, weekDays: next });
      };
      return (
        <WeeklySelect
          disabled={disabled}
          selectedDays={recurrenceRule.weekDays}
          onChange={handleWeekDays}
        />
      );
    }
    case DurationPeriod.WeekDayOfMonth: {
      const handleWeekDayOfMonth = (
        next: [Set<WeekDay>, Set<WeekDay>, Set<WeekDay>, Set<WeekDay>],
      ) => {
        onChange({ ...recurrenceRule, dayOfWeek: next });
      };
      return (
        <MonthlyDayOfWeekSelect
          disabled={disabled}
          onChange={handleWeekDayOfMonth}
          selectedWeeks={recurrenceRule.dayOfWeek}
        />
      );
    }
    case DurationPeriod.DayOfMonth: {
      const handleDayOfMonth = (next: Set<DayOfMonth>) => {
        onChange({ ...recurrenceRule, date: next });
      };
      return (
        <DayOfMonthSelect
          disabled={disabled}
          selectedDays={recurrenceRule.date}
          onChange={handleDayOfMonth}
        />
      );
    }
    default:
      return null;
  }
}

// ============================================================================
// Main RecurringSelect Component
// ============================================================================

export interface RecurringSelectProps {
  /**
   * Whether the component is disabled
   * @default false
   */
  readonly disabled?: boolean;

  /**
   * The current recurrence rule value
   */
  readonly value: RecurrenceRule;

  /**
   * Callback when the recurrence rule changes
   */
  onChange(value: RecurrenceRule): void;

  /**
   * Additional CSS class name
   */
  readonly className?: string;
}

// Frequency select options matching the local Select component's option format
const frequencyOptions = [
  { value: DurationPeriod.Day, label: 'Day(s)' },
  { value: DurationPeriod.Week, label: 'Week(s)' },
  { value: DurationPeriod.DayOfMonth, label: 'Month(s)' },
  { value: DurationPeriod.Year, label: 'Year(s)' },
];

export function RecurringSelect({
  value,
  disabled = false,
  onChange,
  className,
}: RecurringSelectProps) {
  // For the Select, monthly types both map to "Month(s)" option
  const monthlySelectOptionValue =
    value.type === DurationPeriod.WeekDayOfMonth
      ? DurationPeriod.WeekDayOfMonth
      : value.type === DurationPeriod.DayOfMonth
        ? DurationPeriod.DayOfMonth
        : undefined;

  // Build options list – if WeekDayOfMonth is active, swap the Month option value
  const currentOptions = frequencyOptions.map(opt => {
    if (opt.value === DurationPeriod.DayOfMonth && monthlySelectOptionValue === DurationPeriod.WeekDayOfMonth) {
      return { ...opt, value: DurationPeriod.WeekDayOfMonth };
    }
    return opt;
  });

  const hasExtraFrequencyDescriptor =
    value.type === DurationPeriod.WeekDayOfMonth ||
    value.type === DurationPeriod.DayOfMonth ||
    value.type === DurationPeriod.Week;

  const handleIntervalChange = useCallback(
    (interval: number | undefined) => {
      onChange({ ...value, interval: interval ?? 1 });
    },
    [value, onChange],
  );

  const handleTypeChange = useCallback(
    (newType: string | number) => {
      const type = newType as keyof InitialStateMap;
      onChange({
        interval: value.interval,
        ...typeInitialStateMap[type],
      });
    },
    [value.interval, onChange],
  );

  const handleMonthlyTypeChange = useCallback(
    (type: DurationPeriod.DayOfMonth | DurationPeriod.WeekDayOfMonth) => {
      onChange({
        interval: value.interval,
        ...typeInitialStateMap[type],
      });
    },
    [value.interval, onChange],
  );

  const summary = getRecurrenceSummary(value);

  return (
    <Content spacing="small" className={className}>
      {/* Top row: "Every [interval] [period]" */}
      <div className="flex items-center gap-3 flex-wrap">
        <Text variation={disabled ? 'disabled' : undefined}>Every</Text>
        <div className="flex-1 min-w-0">
          <InputGroup flowDirection="horizontal">
            <InputNumber
              disabled={disabled}
              name="schedule-recurrence-interval"
              value={value.interval}
              min={1}
              onChange={handleIntervalChange}
              className="w-20"
            />
            <Select
              disabled={disabled}
              value={value.type === DurationPeriod.WeekDayOfMonth ? DurationPeriod.WeekDayOfMonth : value.type}
              onChange={handleTypeChange}
              name="schedule-recurrence-type"
              options={currentOptions}
            />
          </InputGroup>
        </div>
        {hasExtraFrequencyDescriptor && (
          <Text variation={disabled ? 'disabled' : undefined}>on</Text>
        )}
      </div>

      {/* Monthly sub-selector: toggle between DayOfMonth and WeekDayOfMonth */}
      {isMonthly(value) && (
        <MonthlySelect
          disabled={disabled}
          onChange={handleMonthlyTypeChange}
          selectedMonthOption={value.type}
        />
      )}

      {/* Current recurrence detail (weekly day selector, monthly day grid, etc.) */}
      <CurrentRecurrenceComponent
        disabled={disabled}
        recurrenceRule={value}
        onChange={onChange}
      />

      {/* Human-readable summary */}
      <div className="mt-1 px-3 py-2 rounded-md bg-[--color-surface--background] border border-[--color-border]">
        <Text size="small" variation="subdued">{summary}</Text>
      </div>
    </Content>
  );
}

export default RecurringSelect;
