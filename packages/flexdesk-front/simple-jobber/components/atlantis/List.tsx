/**
 * Atlantis List Component
 *
 * A semantic list component that renders as either an unordered or ordered list.
 * Matches @jobber/components List API for consistent list rendering.
 *
 * @example
 * // Basic unordered list
 * <List>
 *   <List.Item>First item</List.Item>
 *   <List.Item>Second item</List.Item>
 * </List>
 *
 * // Ordered list
 * <List type="ordered">
 *   <List.Item>Step 1</List.Item>
 *   <List.Item>Step 2</List.Item>
 * </List>
 *
 * // With custom markers
 * <List marker="check">
 *   <List.Item>Completed task</List.Item>
 *   <List.Item>Another completed task</List.Item>
 * </List>
 *
 * // Array-based rendering
 * <List items={['Item 1', 'Item 2', 'Item 3']} />
 */
import { ReactNode } from 'react';
import { Icon, IconNames } from './Icon';

// ============================================================================
// Types
// ============================================================================

export type ListType = 'unordered' | 'ordered';
export type ListMarker = 'bullet' | 'check' | 'none' | IconNames;
export type ListGap = 'none' | 'small' | 'base' | 'large';

export interface ListItemProps {
  /** Content of the list item */
  children: ReactNode;
  /** Icon to display before the item (overrides list marker) */
  icon?: IconNames;
  /** Color for the icon */
  iconColor?: 'success' | 'warning' | 'critical' | 'informative' | 'subdued';
  /** Additional CSS classes */
  className?: string;
}

export interface ListProps {
  /** The items to render (alternative to children) */
  items?: (string | ReactNode)[];
  /** The list type */
  type?: ListType;
  /** The marker style for list items */
  marker?: ListMarker;
  /** Gap between list items */
  gap?: ListGap;
  /** List item children */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Gap mapping
// ============================================================================

const gapClasses: Record<ListGap, string> = {
  none: 'space-y-0',
  small: 'space-y-1',
  base: 'space-y-2',
  large: 'space-y-3',
};

// ============================================================================
// Icon color mapping
// ============================================================================

const iconColorClasses: Record<string, string> = {
  success: 'text-[--color-success]',
  warning: 'text-[--color-warning]',
  critical: 'text-[--color-critical]',
  informative: 'text-[--color-informative]',
  subdued: 'text-[--color-inactive]',
};

// ============================================================================
// List Item Component
// ============================================================================

const ListItem = ({
  children,
  icon,
  iconColor = 'success',
  className = '',
}: ListItemProps) => {
  return (
    <li className={`flex items-start gap-2 ${className}`}>
      {icon && (
        <span className={`flex-shrink-0 mt-0.5 ${iconColorClasses[iconColor]}`}>
          <Icon name={icon} size="small" />
        </span>
      )}
      <span className="flex-1">{children}</span>
    </li>
  );
};

// ============================================================================
// Main List Component
// ============================================================================

const ListBase = ({
  items,
  type = 'unordered',
  marker = 'bullet',
  gap = 'base',
  children,
  className = '',
}: ListProps) => {
  const Tag = type === 'ordered' ? 'ol' : 'ul';

  // Determine list style based on marker
  const getListStyleClass = () => {
    if (marker === 'none' || marker === 'check') {
      return 'list-none';
    }
    if (type === 'ordered') {
      return 'list-decimal list-inside';
    }
    return 'list-disc list-inside';
  };

  // Determine if we need to render markers manually
  const needsCustomMarker = marker === 'check' || (marker !== 'bullet' && marker !== 'none');
  const customMarkerIcon = marker === 'check' ? 'checkmark' : marker;

  // Render items from the items prop
  const renderItems = () => {
    if (!items) return null;
    return items.map((item, index) => (
      <ListItem
        key={index}
        icon={needsCustomMarker ? customMarkerIcon as IconNames : undefined}
        iconColor="success"
      >
        {item}
      </ListItem>
    ));
  };

  return (
    <Tag
      className={`
        ${getListStyleClass()}
        ${gapClasses[gap]}
        ${needsCustomMarker ? 'list-none' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {items ? renderItems() : children}
    </Tag>
  );
};

// ============================================================================
// Compound Component Export
// ============================================================================

export const List = Object.assign(ListBase, {
  Item: ListItem,
});
