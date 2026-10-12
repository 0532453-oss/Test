/**
 * DescriptionList - Local implementation matching @jobber/components DescriptionList API
 *
 * A semantic list component for displaying term-description pairs (key-value data).
 * Uses HTML dl/dt/dd elements for proper accessibility and semantics.
 *
 * @example
 * <DescriptionList>
 *   <DescriptionList.Item label="Email">john@example.com</DescriptionList.Item>
 *   <DescriptionList.Item label="Phone">(555) 123-4567</DescriptionList.Item>
 * </DescriptionList>
 *
 * @example
 * // With custom data array
 * <DescriptionList
 *   data={[
 *     { label: 'Status', value: 'Active' },
 *     { label: 'Created', value: 'Jan 1, 2024' },
 *   ]}
 * />
 */
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Layout direction for the list items
 */
export type DescriptionListLayout = 'horizontal' | 'vertical' | 'inline';

/**
 * Data item for array-based rendering
 */
export interface DescriptionListDataItem {
  /** The label/term for this item */
  readonly label: string;
  /** The value/description for this item */
  readonly value: React.ReactNode;
  /** Optional action element to display on the right */
  readonly action?: React.ReactNode;
}

export interface DescriptionListProps {
  /**
   * Array of data items to render
   * Alternative to using DescriptionList.Item children
   */
  readonly data?: readonly DescriptionListDataItem[];

  /**
   * Layout direction for items
   * - 'horizontal': Label and value side by side (default)
   * - 'vertical': Label above value
   * - 'inline': Compact inline layout
   * @default 'horizontal'
   */
  readonly layout?: DescriptionListLayout;

  /**
   * Custom render function for items when using data prop
   */
  readonly renderItem?: (item: DescriptionListDataItem, index: number) => React.ReactNode;

  /**
   * Child DescriptionList.Item components
   */
  readonly children?: React.ReactNode;

  /**
   * Additional CSS class
   */
  readonly className?: string;
}

export interface DescriptionListItemProps {
  /**
   * The label/term for this item
   */
  readonly label: string;

  /**
   * The value/description for this item
   */
  readonly children: React.ReactNode;

  /**
   * Optional action element to display on the right
   */
  readonly action?: React.ReactNode;

  /**
   * Additional CSS class
   */
  readonly className?: string;
}

/**
 * DescriptionList.Item - Individual term-description pair
 */
function DescriptionListItem({
  label,
  children,
  action,
  className,
}: DescriptionListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2',
        'border-b border-[var(--color-border)] last:border-b-0',
        className
      )}
    >
      <dt className="text-sm text-[var(--color-text--secondary)] shrink-0 pr-4">
        {label}
      </dt>
      <div className="flex items-center gap-2">
        <dd className="text-sm text-[var(--color-text)] text-right font-medium">
          {children}
        </dd>
        {action}
      </div>
    </div>
  );
}

/**
 * DescriptionList component following Atlantis/Jobber design system
 *
 * Displays a semantic list of key-value pairs using HTML description list elements.
 */
export const DescriptionList = forwardRef<HTMLDListElement, DescriptionListProps>(
  function DescriptionList({ data, layout = 'horizontal', renderItem, children, className }, ref) {
    // Determine if we're using data prop or children
    const useDataProp = data && data.length > 0;

    // Layout-specific styles for the dl container
    const layoutStyles: Record<DescriptionListLayout, string> = {
      horizontal: 'space-y-0',
      vertical: 'space-y-3',
      inline: 'flex flex-wrap gap-x-6 gap-y-2',
    };

    // Layout-specific styles for items
    const getItemLayoutClass = (itemLayout: DescriptionListLayout) => {
      switch (itemLayout) {
        case 'vertical':
          return 'flex-col items-start py-3';
        case 'inline':
          return 'flex-row gap-2 py-0 border-b-0';
        default: // horizontal
          return '';
      }
    };

    return (
      <dl
        ref={ref}
        className={cn('list-none', layoutStyles[layout], className)}
      >
        {useDataProp
          ? data.map((item, index) =>
              renderItem ? (
                <React.Fragment key={`${item.label}-${index}`}>
                  {renderItem(item, index)}
                </React.Fragment>
              ) : (
                <DescriptionListItem
                  key={`${item.label}-${index}`}
                  label={item.label}
                  action={item.action}
                  className={getItemLayoutClass(layout)}
                >
                  {item.value}
                </DescriptionListItem>
              )
            )
          : children}
      </dl>
    );
  }
) as React.ForwardRefExoticComponent<
  DescriptionListProps & React.RefAttributes<HTMLDListElement>
> & {
  Item: typeof DescriptionListItem;
};

// Attach compound component
DescriptionList.Item = DescriptionListItem;

DescriptionList.displayName = 'DescriptionList';

export default DescriptionList;
