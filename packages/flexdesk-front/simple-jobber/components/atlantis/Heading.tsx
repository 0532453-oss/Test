/**
 * Heading - Local implementation matching @jobber/components Heading API
 *
 * This provides the same interface as the Atlantis component library's Heading,
 * allowing future migration to the actual library when fully integrated.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
export type HeadingMaxLines = 'single' | 'small' | 'base' | 'large' | 'larger' | 'unlimited';

export interface HeadingProps {
  /**
   * Heading level (1-6)
   * @default 5
   */
  readonly level?: HeadingLevel;

  /**
   * Unique identifier for the heading
   */
  readonly id?: string;

  /**
   * Override the rendered element
   */
  readonly element?: HeadingElement;

  /**
   * Maximum lines before truncation
   * @default "unlimited"
   */
  readonly maxLines?: HeadingMaxLines;

  /**
   * Heading content
   */
  readonly children: React.ReactNode;

  /**
   * Additional CSS class
   */
  readonly className?: string;
}

// Map heading levels to styles
const levelStyles: Record<HeadingLevel, string> = {
  1: 'text-4xl font-black text-[--color-text]',
  2: 'text-3xl font-bold text-[--color-text]',
  3: 'text-2xl font-bold text-[--color-text]',
  4: 'text-xl font-bold text-[--color-text]',
  5: 'text-base font-bold text-[--color-text]',
  6: 'text-sm font-bold uppercase text-[--color-text]',
};

// Map maxLines to styles
const maxLinesStyles: Record<HeadingMaxLines, string> = {
  single: 'line-clamp-1',
  small: 'line-clamp-2',
  base: 'line-clamp-4',
  large: 'line-clamp-8',
  larger: 'line-clamp-[16]',
  unlimited: '',
};

/**
 * Heading component following Atlantis/Jobber design system
 */
export function Heading({
  level = 5,
  id,
  element,
  maxLines = 'unlimited',
  children,
  className,
}: HeadingProps) {
  // Default element is the heading tag matching the level
  const Element = element || (`h${level}` as HeadingElement);

  const headingClasses = cn(
    levelStyles[level],
    maxLines !== 'unlimited' && maxLinesStyles[maxLines],
    className
  );

  return React.createElement(
    Element,
    { id, className: headingClasses },
    children
  );
}

Heading.displayName = 'Heading';

export default Heading;
