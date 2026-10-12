import { format as formatDate } from 'date-fns';
import { enUS, enGB, es, fr, de, pt, zhCN, ja } from 'date-fns/locale';
import { useAtlantisContext } from './AtlantisContext';

/**
 * FormatTime - Atlantis-style time formatting component
 *
 * Displays a formatted time using consistent formatting across the application.
 * Uses date-fns for formatting with locale support via AtlantisContext.
 *
 * @example
 * <FormatTime time={new Date()} />
 * <FormatTime time="14:30" use24HourClock={true} />
 */

export interface FormatTimeProps {
  /** The time to format - can be Date object, ISO string, or timestamp */
  time: Date | string | number;
  /** Whether to use 24-hour clock format (default: false for 12-hour) */
  use24HourClock?: boolean;
  /** Whether to show seconds (default: false) */
  showSeconds?: boolean;
  /** Optional custom format string (overrides default formatting) */
  format?: string;
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
 * - 12-hour: "2:30 PM"
 * - 24-hour: "14:30"
 * - With seconds (12-hour): "2:30:45 PM"
 * - With seconds (24-hour): "14:30:45"
 */
function getDefaultFormat(use24HourClock: boolean, showSeconds: boolean): string {
  if (use24HourClock) {
    return showSeconds ? 'HH:mm:ss' : 'HH:mm';
  }
  return showSeconds ? 'h:mm:ss a' : 'h:mm a';
}

export const FormatTime = ({
  time,
  use24HourClock = false,
  showSeconds = false,
  format: customFormat,
}: FormatTimeProps) => {
  const { locale } = useAtlantisContext();

  if (!time) return null;

  try {
    let timeObj: Date;

    // Handle time-only string (e.g., "14:30" or "14:30:00")
    if (typeof time === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
      const [hours, minutes, seconds = '0'] = time.split(':');
      timeObj = new Date();
      timeObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10), 0);
    } else {
      timeObj = time instanceof Date ? time : new Date(time);
    }

    // Check if date is valid
    if (isNaN(timeObj.getTime())) {
      return null;
    }

    const formatPattern = customFormat || getDefaultFormat(use24HourClock, showSeconds);
    const dateLocale = localeMap[locale] || enUS;
    const formatted = formatDate(timeObj, formatPattern, { locale: dateLocale });

    return <time dateTime={timeObj.toISOString()}>{formatted}</time>;
  } catch {
    return null;
  }
};

export default FormatTime;
