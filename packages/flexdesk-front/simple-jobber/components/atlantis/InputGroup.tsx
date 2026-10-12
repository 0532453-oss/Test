import React, { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * InputGroup - Container for grouping related inputs
 *
 * Atlantis API Reference:
 * - children: ReactElement | ReactElement[] - Input elements to group
 * - flowDirection: "horizontal" | "vertical" - Layout direction (default: "vertical")
 *
 * Used for:
 * - Address input groups (city/state/zip rows)
 * - Date range input groups (start/end date)
 * - Time input groups (start/end time)
 * - Name input groups (title/first/last)
 */

export type InputGroupFlowDirection = 'horizontal' | 'vertical';

export interface InputGroupProps {
  /**
   * The input elements to group together
   */
  children: ReactNode;
  /**
   * Determine the direction the fields are laid out in.
   * @default "vertical"
   */
  flowDirection?: InputGroupFlowDirection;
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * InputGroup component matching @jobber/components InputGroup API
 *
 * Groups related input fields together visually and semantically.
 * Horizontal direction creates a row layout, vertical creates a column layout.
 */
export function InputGroup({
  children,
  flowDirection = 'vertical',
  className,
}: InputGroupProps) {
  // Validate nesting - nested vertical InputGroups are not supported
  if (isInvalidGroupNesting(children)) {
    console.error(
      `ERROR: InputGroup not rendered: nesting 'flowDirection="vertical"' columns not supported.`
    );
    return null;
  }

  return (
    <div
      className={cn(
        'input-group',
        flowDirection === 'horizontal'
          ? 'flex flex-row gap-4 items-start'
          : 'flex flex-col gap-4',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}

/**
 * Check if the InputGroup component is an InputGroup element
 */
function isInputGroupElement(
  node: unknown
): node is React.ReactElement<InputGroupProps, typeof InputGroup> {
  return React.isValidElement(node) && node.type === InputGroup;
}

/**
 * Check for invalid nesting - nested vertical InputGroups are not supported
 */
function isInvalidGroupNesting(children: ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (
      isInputGroupElement(child) &&
      child.props.flowDirection !== 'horizontal'
    ) {
      return true;
    }
    return false;
  });
}
