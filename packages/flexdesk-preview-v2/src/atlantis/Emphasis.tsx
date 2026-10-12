/**
 * Atlantis Emphasis Component
 *
 * Provides semantic emphasis text styling matching @jobber/components Emphasis API.
 * Used to render bold, italic, or highlighted text with proper semantic HTML elements.
 *
 * @example
 * <Emphasis variation="bold">Bold text</Emphasis>
 * <Emphasis variation="italic">Italic text</Emphasis>
 * <Emphasis variation="highlight">Highlighted important text</Emphasis>
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type EmphasisVariation = 'bold' | 'italic' | 'highlight';

export interface EmphasisProps {
  /**
   * The type of emphasis to apply
   * - 'bold': Renders as <b> with font-weight bold
   * - 'italic': Renders as <em> with italic style
   * - 'highlight': Renders as <strong> with highlight styling
   */
  readonly variation: EmphasisVariation;

  /**
   * The text content to emphasize
   */
  readonly children: React.ReactNode;

  /**
   * Optional additional CSS classes
   */
  readonly className?: string;
}

/**
 * Mapping of variation to HTML element and styles
 */
const variationConfig: Record<
  EmphasisVariation,
  { element: 'b' | 'em' | 'strong'; className: string }
> = {
  bold: {
    element: 'b',
    className: 'font-bold',
  },
  italic: {
    element: 'em',
    className: 'italic',
  },
  highlight: {
    element: 'strong',
    className: 'font-semibold text-[var(--color-text)]',
  },
};

export function Emphasis({ variation, children, className }: EmphasisProps) {
  const config = variationConfig[variation];
  const Element = config.element;

  return (
    <Element className={cn(config.className, className)}>{children}</Element>
  );
}
