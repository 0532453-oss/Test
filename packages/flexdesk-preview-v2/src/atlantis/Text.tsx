/**
 * Text - Local implementation matching @jobber/components Text API
 *
 * This provides the same interface as the Atlantis component library's Text,
 * allowing future migration to the actual library when fully integrated.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export type TextElement = 'p' | 'b' | 'em' | 'dd' | 'dt' | 'strong' | 'span';
export type TextVariation = 'default' | 'subdued' | 'success' | 'error' | 'warn' | 'info' | 'disabled';
export type TextSize = 'small' | 'base' | 'large';
export type TextAlign = 'start' | 'center' | 'end';
export type TextMaxLines = 'single' | 'small' | 'base' | 'large' | 'larger' | 'unlimited';

export interface TextProps {
  /**
   * HTML element to render
   * @default "p"
   */
  readonly element?: TextElement;

  /**
   * Text color variation
   * @default "default"
   */
  readonly variation?: TextVariation;

  /**
   * Text size
   * @default "base"
   */
  readonly size?: TextSize;

  /**
   * Text alignment
   * @default "start"
   */
  readonly align?: TextAlign;

  /**
   * Maximum lines before truncation
   * @default "unlimited"
   */
  readonly maxLines?: TextMaxLines;

  /**
   * Text content
   */
  readonly children: React.ReactNode;

  /**
   * Additional CSS class
   */
  readonly className?: string;

  /**
   * Element ID for accessibility
   */
  readonly id?: string;
}

// Map variations to text colors
const variationStyles: Record<TextVariation, string> = {
  default: 'text-[var(--color-text)]',
  subdued: 'text-[var(--color-text--secondary)]',
  success: 'text-[var(--color-success)]',
  error: 'text-[var(--color-critical)]',
  warn: 'text-[var(--color-warning)]',
  info: 'text-[var(--color-informative)]',
  disabled: 'text-[var(--color-text--disabled)] opacity-50',
};

// Map sizes to font sizes
const sizeStyles: Record<TextSize, string> = {
  small: 'text-xs',
  base: 'text-sm',
  large: 'text-base',
};

// Map alignment
const alignStyles: Record<TextAlign, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
};

// Map maxLines to styles
const maxLinesStyles: Record<TextMaxLines, string> = {
  single: 'line-clamp-1',
  small: 'line-clamp-2',
  base: 'line-clamp-4',
  large: 'line-clamp-8',
  larger: 'line-clamp-[16]',
  unlimited: '',
};

/**
 * Text component following Atlantis/Jobber design system
 */
export function Text({
  element = 'p',
  variation = 'default',
  size = 'base',
  align = 'start',
  maxLines = 'unlimited',
  children,
  className,
  id,
}: TextProps) {
  const textClasses = cn(
    variationStyles[variation],
    sizeStyles[size],
    alignStyles[align],
    maxLines !== 'unlimited' && maxLinesStyles[maxLines],
    className
  );

  return React.createElement(element, { className: textClasses, id }, children);
}

Text.displayName = 'Text';

export default Text;
