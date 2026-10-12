/**
 * Atlantis Content Component
 *
 * Matches @jobber/components Content API for migration path.
 * Content provides consistent vertical spacing and layout for page sections.
 * It's the main content area within a Frame or Container.
 *
 * @example
 * <Frame>
 *   <Content>
 *     <Page title="Dashboard">...</Page>
 *   </Content>
 * </Frame>
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ContentSpacing = 'none' | 'small' | 'base' | 'large';

export interface ContentProps {
  /** Content to display */
  readonly children: ReactNode;

  /**
   * Vertical spacing between children.
   * - none: No gap
   * - small: 16px gap
   * - base: 24px gap (default)
   * - large: 32px gap
   * @default "base"
   */
  readonly spacing?: ContentSpacing;

  /**
   * Additional class names for custom styling.
   */
  readonly className?: string;
}

const spacingClasses: Record<ContentSpacing, string> = {
  none: 'gap-0',
  small: 'gap-4',
  base: 'gap-6',
  large: 'gap-8',
};

export function Content({ children, spacing = 'base', className }: ContentProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col',
        spacingClasses[spacing],
        className,
      )}
    >
      {children}
    </div>
  );
}
