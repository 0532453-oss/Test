import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, Text } from '@/atlantis';
import type { CardAccent } from '@/atlantis';

export interface HighlightItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

interface HighlightsProps {
  items: HighlightItem[];
  className?: string;
}

const HIGHLIGHT_COLORS: {
  accent: CardAccent;
  iconBg: string;
  iconText: string;
}[] = [
  { accent: 'blue', iconBg: 'bg-blue-50 dark:bg-blue-900/30', iconText: 'text-blue-600 dark:text-blue-400' },
  { accent: 'green', iconBg: 'bg-green-50 dark:bg-green-900/30', iconText: 'text-green-600 dark:text-green-400' },
  { accent: 'yellow', iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400' },
  { accent: 'purple', iconBg: 'bg-purple-50 dark:bg-purple-900/30', iconText: 'text-purple-600 dark:text-purple-400' },
];

export function Highlights({ items, className }: HighlightsProps) {
  return (
    <div className={cn('grid gap-3 grid-cols-2 md:grid-cols-4', className)}>
      {items.map((item, index) => {
        const color = HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length];
        return (
          <Card key={index} accent={color.accent} className="overflow-hidden">
            <Card.Body>
              <div className="flex items-start gap-3">
                {item.icon && (
                  <div className={cn(
                    'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    color.iconBg,
                    color.iconText,
                  )}>
                    {item.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Text variation="subdued" size="small" maxLines="single">{item.label}</Text>
                  <Text size="base" maxLines="single" className={cn('font-bold mt-0.5', item.className)}>
                    {item.value}
                  </Text>
                </div>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}

// Pre-built highlight configurations for common entities
export function JobHighlights({
  clientName,
  scheduledTime,
  assignedTo,
  duration,
}: {
  clientName?: string;
  scheduledTime?: string;
  assignedTo?: string;
  duration?: string;
}) {
  const items: HighlightItem[] = [
    {
      label: 'Client',
      value: clientName || 'Not assigned',
      className: clientName ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Scheduled',
      value: scheduledTime || 'Not scheduled',
      className: scheduledTime ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Assigned To',
      value: assignedTo || 'Unassigned',
      className: assignedTo ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Duration',
      value: duration || 'Not estimated',
      className: duration ? undefined : 'text-[var(--color-text--secondary)]',
    },
  ];

  return <Highlights items={items} />;
}

export function ClientHighlights({
  activeJobsCount,
  totalRequests,
  lastInteraction,
  status,
}: {
  activeJobsCount: number;
  totalRequests: number;
  lastInteraction?: string;
  status: string;
}) {
  const items: HighlightItem[] = [
    {
      label: 'Active Jobs',
      value: activeJobsCount.toString(),
    },
    {
      label: 'Total Requests',
      value: totalRequests.toString(),
    },
    {
      label: 'Last Interaction',
      value: lastInteraction || 'Never',
      className: lastInteraction ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Status',
      value: status,
    },
  ];

  return <Highlights items={items} />;
}

export function RequestHighlights({
  estimatedValue,
  preferredDate,
  daysSinceCreated,
  status,
}: {
  estimatedValue?: string;
  preferredDate?: string;
  daysSinceCreated: number;
  status: string;
}) {
  const items: HighlightItem[] = [
    {
      label: 'Estimated Value',
      value: estimatedValue || 'Not estimated',
      className: estimatedValue ? 'text-green-600' : 'text-gray-500',
    },
    {
      label: 'Preferred Date',
      value: preferredDate || 'No preference',
      className: preferredDate ? undefined : 'text-gray-500',
    },
    {
      label: 'Days Open',
      value: daysSinceCreated.toString(),
      className: daysSinceCreated > 7 ? 'text-yellow-600' : undefined,
    },
    {
      label: 'Status',
      value: status,
    },
  ];

  return <Highlights items={items} />;
}
