import { format as formatDate, isToday, isTomorrow, isYesterday } from 'date-fns';
import { enUS, enGB, es, fr, de, pt, zhCN, ja } from 'date-fns/locale';
import { useAtlantisContext } from './AtlantisContext';

/**
 * FormatDate - Atlantis-style date formatting component
 *
 * Displays a formatted date using consistent formatting across the application.
 * Uses date-fns for formatting with locale support via AtlantisContext.
 *
 * @example
 * <FormatDate date={new Date()} />
 * <FormatDate date="2024-01-15" showYear={false} />
 * <FormatDate date={job.scheduledDate} useRelative />
 */

export interface FormatDateProps {
  /** The date to format - can be Date object, ISO string, or timestamp */
  date: Date | string | number;
  /** Whether to show the year in the output (default: true) */
  showYear?: boolean;
  /** Optional custom format string (overrides default formatting) */
  format?: string;
  /** Whether to show the day of week (default: false) */
  showDayOfWeek?: boolean;
  /** Whether to show relative labels like "Today", "Tomorrow", "Yesterday" (default: false) */
  useRelative?: boolean;
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
 * Default format patterns
 * - With year: "Jan 15, 2024"
 * - Without year: "Jan 15"
 * - With day of week: "Mon, Jan 15, 2024"
 */
function getDefaultFormat(showYear: boolean, showDayOfWeek: boolean): string {
  if (showDayOfWeek) {
    return showYear ? 'EEE, MMM d, yyyy' : 'EEE, MMM d';
  }
  return showYear ? 'MMM d, yyyy' : 'MMM d';
}

/**
 * Get a relative date label if the date is today, tomorrow, or yesterday.
 * Returns null if the date is not relative to today.
 */
function getRelativeLabel(dateObj: Date): string | null {
  if (isToday(dateObj)) return 'Today';
  if (isTomorrow(dateObj)) return 'Tomorrow';
  if (isYesterday(dateObj)) return 'Yesterday';
  return null;
}

export const FormatDate = ({
  date,
  showYear = true,
  format: customFormat,
  showDayOfWeek = false,
  useRelative = false,
}: FormatDateProps) => {
  const { locale } = useAtlantisContext();

  if (!date) return null;

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      if (import.meta.env.DEV) {
        console.warn(`FormatDate: Invalid date value provided:`, date);
      }
      return null;
    }

    // Check for relative date labels when useRelative is enabled
    if (useRelative) {
      const relativeLabel = getRelativeLabel(dateObj);
      if (relativeLabel) {
        return <time dateTime={dateObj.toISOString()}>{relativeLabel}</time>;
      }
    }

    const formatPattern = customFormat || getDefaultFormat(showYear, showDayOfWeek);
    const dateLocale = localeMap[locale] || enUS;
    const formatted = formatDate(dateObj, formatPattern, { locale: dateLocale });

    return <time dateTime={dateObj.toISOString()}>{formatted}</time>;
  } catch {
    return null;
  }
};

export default FormatDate;
