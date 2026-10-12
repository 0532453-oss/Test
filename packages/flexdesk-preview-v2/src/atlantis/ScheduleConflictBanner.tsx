/**
 * ScheduleConflictBanner - Displays a warning banner when scheduling conflicts are detected.
 *
 * Used in job creation/editing forms and the reschedule modal to warn users
 * about overlapping jobs for the same team member on the selected date/time.
 *
 * Accepts a list of conflicting jobs (provided by the parent) and renders
 * a warning Banner with details about each conflict.
 */
import * as React from 'react';
import { Banner } from './Banner';
import { Text } from './Text';

export interface ScheduleConflict {
  /** The conflicting job's title */
  jobTitle: string;
  /** The conflicting job's scheduled time range (e.g., "9:00 AM - 11:00 AM") */
  timeRange: string;
}

export interface ScheduleConflictBannerProps {
  /**
   * List of detected scheduling conflicts. When empty, the banner is hidden.
   */
  conflicts: ScheduleConflict[];

  /**
   * Whether the banner can be dismissed by the user.
   * @default true
   */
  dismissible?: boolean;

  /**
   * Callback when the banner is dismissed.
   */
  onDismiss?: () => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * ScheduleConflictBanner component that warns users about scheduling conflicts.
 *
 * @example
 * ```tsx
 * <ScheduleConflictBanner
 *   conflicts={[
 *     { jobTitle: "Plumbing Repair", timeRange: "9:00 AM - 11:00 AM" },
 *     { jobTitle: "Electrical Work", timeRange: "10:00 AM - 12:00 PM" },
 *   ]}
 * />
 * ```
 */
export function ScheduleConflictBanner({
  conflicts,
  dismissible = true,
  onDismiss,
  className,
}: ScheduleConflictBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  // Reset dismissed state when conflicts change
  const conflictKey = conflicts.map((c) => c.jobTitle + c.timeRange).join('|');
  const prevConflictKeyRef = React.useRef(conflictKey);
  React.useEffect(() => {
    if (conflictKey !== prevConflictKeyRef.current) {
      setDismissed(false);
      prevConflictKeyRef.current = conflictKey;
    }
  }, [conflictKey]);

  if (conflicts.length === 0 || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Banner
      type="warning"
      title="Scheduling conflict detected"
      dismissible={dismissible}
      onDismiss={handleDismiss}
      className={className}
    >
      {conflicts.length === 1 ? (
        <Text element="span" size="small">
          This time overlaps with "{conflicts[0].jobTitle}" ({conflicts[0].timeRange}).
        </Text>
      ) : (
        <div>
          <Text element="span" size="small">
            This time overlaps with {conflicts.length} existing jobs:
          </Text>
          <ul className="mt-1 ml-4 list-disc">
            {conflicts.map((conflict, i) => (
              <li key={i}>
                <Text element="span" size="small">
                  {conflict.jobTitle} ({conflict.timeRange})
                </Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Banner>
  );
}

export default ScheduleConflictBanner;
