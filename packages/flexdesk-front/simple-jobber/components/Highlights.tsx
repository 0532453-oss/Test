import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Text } from './atlantis';

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

export function Highlights({ items, className }: HighlightsProps) {
  return (
    <div className={cn('grid gap-3 grid-cols-2 md:grid-cols-4', className)}>
      {items.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {item.icon && (
                <div className="shrink-0 w-8 h-8 rounded-md bg-[--color-surface--hover] flex items-center justify-center text-[--color-text--secondary]">
                  {item.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Text variation="subdued" size="small" maxLines="single">{item.label}</Text>
                <Text size="small" maxLines="single" className={cn('font-semibold mt-0.5', item.className)}>
                  {item.value}
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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
      className: clientName ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Scheduled',
      value: scheduledTime || 'Not scheduled',
      className: scheduledTime ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Assigned To',
      value: assignedTo || 'Unassigned',
      className: assignedTo ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Duration',
      value: duration || 'Not estimated',
      className: duration ? undefined : 'text-[--color-text--secondary]',
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
      className: lastInteraction ? undefined : 'text-[--color-text--secondary]',
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
      className: estimatedValue ? 'text-[--color-success--text]' : 'text-[--color-text--secondary]',
    },
    {
      label: 'Preferred Date',
      value: preferredDate || 'No preference',
      className: preferredDate ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Days Open',
      value: daysSinceCreated.toString(),
      className: daysSinceCreated > 7 ? 'text-[--color-warning--text]' : undefined,
    },
    {
      label: 'Status',
      value: status,
    },
  ];

  return <Highlights items={items} />;
}
