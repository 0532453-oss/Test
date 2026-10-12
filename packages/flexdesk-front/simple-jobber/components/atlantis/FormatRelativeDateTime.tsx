import { formatDistanceToNow, formatDistance, isPast, isFuture } from 'date-fns';
import { enUS, enGB, es, fr, de, pt, zhCN, ja } from 'date-fns/locale';
import { useAtlantisContext } from '../AtlantisContext';

/**
 * FormatRelativeDateTime - Atlantis-style relative date/time formatting component
 *
 * Displays a relative date/time string like "2 hours ago" or "in 3 days".
 * Uses date-fns for formatting with locale support via AtlantisContext.
 *
 * @example
 * <FormatRelativeDateTime date={new Date()} />
 * <FormatRelativeDateTime date="2024-01-15" addSuffix={false} />
 * <FormatRelativeDateTime date={lastUpdated} baseDate={compareDate} />
 */

export interface FormatRelativeDateTimeProps {
  /** The date to format - can be Date object, ISO string, or timestamp */
  date: Date | string | number;
  /** Whether to add a suffix like "ago" or "from now" (default: true) */
  addSuffix?: boolean;
  /** Include the approximate word "about" (default: false) */
  includeSeconds?: boolean;
  /** Base date to compare against (default: now) */
  baseDate?: Date | string | number;
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

export const FormatRelativeDateTime = ({
  date,
  addSuffix = true,
  includeSeconds = false,
  baseDate,
}: FormatRelativeDateTimeProps) => {
  const { locale } = useAtlantisContext();

  if (!date) return null;

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return null;
    }

    const dateLocale = localeMap[locale] || enUS;

    let formatted: string;

    if (baseDate) {
      // Compare against a specific base date
      const baseDateObj = baseDate instanceof Date ? baseDate : new Date(baseDate);
      if (isNaN(baseDateObj.getTime())) {
        return null;
      }
      formatted = formatDistance(dateObj, baseDateObj, {
        addSuffix,
        includeSeconds,
        locale: dateLocale,
      });
    } else {
      // Compare against now (most common use case)
      formatted = formatDistanceToNow(dateObj, {
        addSuffix,
        includeSeconds,
        locale: dateLocale,
      });
    }

    // Determine if it's past or future for semantic html
    const isPastDate = isPast(dateObj);
    const isFutureDate = isFuture(dateObj);

    return (
      <time
        dateTime={dateObj.toISOString()}
        data-relative-direction={isPastDate ? 'past' : isFutureDate ? 'future' : 'now'}
      >
        {formatted}
      </time>
    );
  } catch {
    return null;
  }
};

export default FormatRelativeDateTime;
