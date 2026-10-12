/**
 * DateCell - Table cell component for displaying formatted dates
 *
 * Used with Atlantis DataTable column definitions.
 * Uses FormatDate component for consistent date formatting.
 */
import { cn } from '@/lib/utils';
import { Text } from '../Text';
import { FormatDate } from '../FormatDate';
import { FormatDateTime } from '../FormatDateTime';

export interface DateCellProps {
  /**
   * The date value to format (Date, string, or null/undefined)
   */
  readonly date: Date | string | null | undefined;

  /**
   * Whether to show the year in the date
   */
  readonly showYear?: boolean;

  /**
   * Whether to show the time as well
   */
  readonly showTime?: boolean;

  /**
   * Text to show when date is null/undefined
   */
  readonly emptyText?: string;

  /**
   * Additional CSS classes
   */
  readonly className?: string;
}

export function DateCell({
  date,
  showYear = false,
  showTime = false,
  emptyText = '—',
  className,
}: DateCellProps) {
  if (!date) {
    return (
      <Text element="span" variation="subdued" className={className}>
        {emptyText}
      </Text>
    );
  }

  // Use FormatDateTime when time is needed, otherwise FormatDate
  if (showTime) {
    return (
      <span className={cn('tabular-nums', className)}>
        <FormatDateTime date={date} showYear={showYear} />
      </span>
    );
  }

  return (
    <span className={cn('tabular-nums', className)}>
      <FormatDate date={date} showYear={showYear} />
    </span>
  );
}

export default DateCell;
