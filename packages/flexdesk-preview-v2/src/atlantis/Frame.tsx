/**
 * Atlantis Frame Component
 *
 * Matches @jobber/components Frame API for migration path.
 * Frame is the top-level layout component that provides the main app structure.
 * It handles the sidebar + main content area layout pattern.
 *
 * @example
 * <Frame sidebar={<AppSidebar />}>
 *   <Container>
 *     <Content>
 *       <Page title="Dashboard">...</Page>
 *     </Content>
 *   </Container>
 * </Frame>
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FrameProps {
  /** Main content area */
  readonly children: ReactNode;

  /**
   * Sidebar component to display alongside content.
   * When provided, creates a sidebar + main content layout.
   */
  readonly sidebar?: ReactNode;

  /**
   * Header component displayed above the main content.
   */
  readonly header?: ReactNode;

  /**
   * Whether to show the sidebar.
   * @default true
   */
  readonly showSidebar?: boolean;

  /**
   * Additional class names for the frame container.
   */
  readonly className?: string;

  /**
   * Additional class names for the main content area.
   */
  readonly contentClassName?: string;
}

export function Frame({
  children,
  sidebar,
  header,
  showSidebar = true,
  className,
  contentClassName,
}: FrameProps) {
  const hasSidebar = sidebar && showSidebar;

  return (
    <div
      className={cn(
        'flex min-h-svh w-full',
        // Use CSS variables for sidebar width handling (integrates with SidebarProvider)
        hasSidebar && 'has-[aside]',
        className,
      )}
    >
      {/* Sidebar */}
      {hasSidebar && sidebar}

      {/* Main Content Area */}
      <main
        className={cn(
          // Full width minus sidebar when present
          'flex flex-1 flex-col',
          // Ensure main content scrolls independently if needed
          'min-w-0', // Prevents flex item from overflowing
          // Background color inherits from app theme
          'bg-background text-foreground',
          contentClassName,
        )}
      >
        {/* Optional Header */}
        {header}

        {/* Main Content */}
        {children}
      </main>
    </div>
  );
}
