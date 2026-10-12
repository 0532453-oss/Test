import { format as formatDate } from 'date-fns';
import { enUS, enGB, es, fr, de, pt, zhCN, ja } from 'date-fns/locale';
import { useAtlantisContext } from './AtlantisContext';

/**
 * FormatDateTime - Atlantis-style date and time formatting component
 *
 * Displays a formatted date and time using consistent formatting across the application.
 * Uses date-fns for formatting with locale support via AtlantisContext.
 *
 * @example
 * <FormatDateTime date={new Date()} />
 * <FormatDateTime date="2024-01-15T14:30:00Z" showYear={false} />
 */

export interface FormatDateTimeProps {
  /** The date/time to format - can be Date object, ISO string, or timestamp */
  date: Date | string | number;
  /** Whether to show the year in the output (default: true) */
  showYear?: boolean;
  /** Whether to use 24-hour clock format (default: false for 12-hour) */
  use24HourClock?: boolean;
  /** Whether to show seconds (default: false) */
  showSeconds?: boolean;
  /** Optional custom format string (overrides default formatting) */
  format?: string;
  /** Whether to show the day of week (default: false) */
  showDayOfWeek?: boolean;
}

/**
 * Map locale strings to date-fns locale objects
 */
const localeMap: Record<string, typeof enUS> = {
  'en': enUS,
  'en-US': enUS,
  'en-GB': enGB,
  'es': es,
  'fr': fr,
  'de': de,
  'pt': pt,
  'zh': zhCN,
  'ja': ja,
};

/**
 * Default format patterns combining date and time
 * - Standard: "Jan 15, 2024 2:30 PM"
 * - Without year: "Jan 15 2:30 PM"
 * - 24-hour: "Jan 15, 2024 14:30"
 * - With day of week: "Mon, Jan 15, 2024 2:30 PM"
 */
function getDefaultFormat(
  showYear: boolean,
  use24HourClock: boolean,
  showSeconds: boolean,
  showDayOfWeek: boolean
): string {
  const timeFormat = use24HourClock
    ? showSeconds
      ? 'HH:mm:ss'
      : 'HH:mm'
    : showSeconds
    ? 'h:mm:ss a'
    : 'h:mm a';

  if (showDayOfWeek) {
    return showYear ? `EEE, MMM d, yyyy ${timeFormat}` : `EEE, MMM d ${timeFormat}`;
  }
  return showYear ? `MMM d, yyyy ${timeFormat}` : `MMM d ${timeFormat}`;
}

export const FormatDateTime = ({
  date,
  showYear = true,
  use24HourClock = false,
  showSeconds = false,
  format: customFormat,
  showDayOfWeek = false,
}: FormatDateTimeProps) => {
  const { locale } = useAtlantisContext();

  if (!date) return null;

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return null;
    }

    const formatPattern =
      customFormat || getDefaultFormat(showYear, use24HourClock, showSeconds, showDayOfWeek);
    const dateLocale = localeMap[locale] || enUS;
    const formatted = formatDate(dateObj, formatPattern, { locale: dateLocale });

    return <time dateTime={dateObj.toISOString()}>{formatted}</time>;
  } catch {
    return null;
  }
};

export default FormatDateTime;
