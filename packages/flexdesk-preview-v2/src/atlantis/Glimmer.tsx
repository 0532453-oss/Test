/**
 * Atlantis Glimmer Component
 *
 * Matches @jobber/components Glimmer API for migration path.
 * Glimmer provides loading skeleton placeholders with shimmer animation.
 *
 * @example
 * <Glimmer>
 *   <Glimmer.Header />
 *   <Glimmer.Text lines={3} />
 * </Glimmer>
 *
 * @example
 * <Glimmer shape="circle" size="large" />
 * <Glimmer shape="rectangle" width="100%" height={200} />
 */
import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/** Shape options for Glimmer */
export type GlimmerShape = 'rectangle' | 'circle';

/** Size presets for Glimmer */
export type GlimmerSize = 'small' | 'base' | 'large';

export interface GlimmerProps {
  /** Shape of the glimmer element */
  readonly shape?: GlimmerShape;
  /** Preset size (affects height for rectangles, diameter for circles) */
  readonly size?: GlimmerSize;
  /** Custom width (CSS value or number for px) */
  readonly width?: string | number;
  /** Custom height (CSS value or number for px) */
  readonly height?: string | number;
  /** Whether to show the shimmer animation */
  readonly animate?: boolean;
  /** Child glimmer elements for composition */
  readonly children?: ReactNode;
  /** Additional class name */
  readonly className?: string;
}

export interface GlimmerHeaderProps {
  /** Width of the header (defaults to 60%) */
  readonly width?: string | number;
  /** Additional class name */
  readonly className?: string;
}

export interface GlimmerTextProps {
  /** Number of text lines to display */
  readonly lines?: number;
  /** Whether last line is shorter */
  readonly lastLineShort?: boolean;
  /** Additional class name */
  readonly className?: string;
}

const sizeClasses = {
  small: {
    rectangle: 'h-4',
    circle: 'h-8 w-8',
  },
  base: {
    rectangle: 'h-6',
    circle: 'h-12 w-12',
  },
  large: {
    rectangle: 'h-8',
    circle: 'h-16 w-16',
  },
} as const;

const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

// Inject shimmer keyframes into document if not already present
if (typeof document !== 'undefined') {
  const styleId = 'atlantis-glimmer-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = shimmerKeyframes;
    document.head.appendChild(styleEl);
  }
}

// Shimmer animation class
const shimmerAnimation = {
  animation: 'shimmer 1.5s ease-in-out infinite',
} as const;

function GlimmerHeader({ width = '60%', className }: GlimmerHeaderProps) {
  const style: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    background: 'linear-gradient(90deg, var(--color-surface--hover) 0%, var(--color-surface) 50%, var(--color-surface--hover) 100%)',
    backgroundSize: '200% 100%',
    ...shimmerAnimation,
  };

  return (
    <div
      className={cn(
        'h-8 rounded',
        className
      )}
      style={style}
    />
  );
}

function GlimmerText({ lines = 1, lastLineShort = true, className }: GlimmerTextProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, index) => {
        const isLastLine = index === lines - 1;
        const width = isLastLine && lastLineShort ? '70%' : '100%';

        return (
          <div
            key={index}
            className="h-4 rounded"
            style={{
              width,
              background: 'linear-gradient(90deg, var(--color-surface--hover) 0%, var(--color-surface) 50%, var(--color-surface--hover) 100%)',
              backgroundSize: '200% 100%',
              ...shimmerAnimation,
            }}
          />
        );
      })}
    </div>
  );
}

function GlimmerButton({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-10 w-24 rounded-lg', className)}
      style={{
        background: 'linear-gradient(90deg, var(--color-surface--hover) 0%, var(--color-surface) 50%, var(--color-surface--hover) 100%)',
        backgroundSize: '200% 100%',
        ...shimmerAnimation,
      }}
    />
  );
}

export function Glimmer({
  shape = 'rectangle',
  size = 'base',
  width,
  height,
  animate = true,
  children,
  className,
}: GlimmerProps) {
  // If children provided, render as a container
  if (children) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {children}
      </div>
    );
  }

  // Build style object for custom dimensions
  const style: CSSProperties = {};
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }
  if (animate) {
    style.background = 'linear-gradient(90deg, var(--color-surface--hover) 0%, var(--color-surface) 50%, var(--color-surface--hover) 100%)';
    style.backgroundSize = '200% 100%';
    Object.assign(style, shimmerAnimation);
  } else {
    style.backgroundColor = 'var(--color-surface--hover)';
  }

  const baseClasses = cn(
    shape === 'circle' && 'rounded-full',
    shape === 'rectangle' && 'rounded',
    // Apply size classes only if no custom dimensions provided
    !width && !height && sizeClasses[size][shape],
    // Default full width for rectangles without explicit width
    shape === 'rectangle' && !width && 'w-full',
    className
  );

  return <div className={baseClasses} style={style} />;
}

// Attach compound components
Glimmer.Header = GlimmerHeader;
Glimmer.Text = GlimmerText;
Glimmer.Button = GlimmerButton;

// Types already exported with declarations above
