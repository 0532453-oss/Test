/**
 * Atlantis Placeholder Component
 *
 * Provides visual placeholders for empty states and loading skeleton states.
 * Used for empty image states, loading content areas, and generic placeholders.
 *
 * @example
 * // Empty image placeholder
 * <Placeholder size="base" />
 *
 * @example
 * // Loading skeleton with shimmer
 * <Placeholder size="large" loading />
 *
 * @example
 * // Custom aspect ratio
 * <Placeholder aspectRatio="16/9" />
 *
 * @example
 * // With custom content
 * <Placeholder size="base">
 *   <Text variation="subdued">No photos</Text>
 * </Placeholder>
 */
import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/** Size presets for the Placeholder */
export type PlaceholderSize = 'small' | 'base' | 'large';

export interface PlaceholderProps {
  /** Preset size of the placeholder */
  readonly size?: PlaceholderSize;
  /** CSS aspect ratio (e.g., "1/1", "16/9", "4/3"). Overrides size height. */
  readonly aspectRatio?: string;
  /** Custom width (CSS value or number for px) */
  readonly width?: string | number;
  /** Custom height (CSS value or number for px) */
  readonly height?: string | number;
  /** Whether to show loading shimmer animation */
  readonly loading?: boolean;
  /** Whether to show the image placeholder icon */
  readonly showIcon?: boolean;
  /** Custom children content to display inside the placeholder */
  readonly children?: ReactNode;
  /** Additional class name */
  readonly className?: string;
}

const sizeStyles: Record<PlaceholderSize, string> = {
  small: 'h-24',
  base: 'h-40',
  large: 'h-64',
};

/**
 * Image placeholder icon matching the Atlantis Placeholder.svg design.
 * Shows a landscape/image frame icon.
 */
function PlaceholderIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Sun/dot element */}
      <circle cx="18.5" cy="17" r="3" fill="currentColor" opacity="0.4" />
      {/* Mountain/landscape shape */}
      <path
        d="M38 31.5L33.2 25.7C33 25.4 32.7 25.3 32.4 25.3C32.1 25.3 31.8 25.4 31.6 25.7L25.2 33.5L23.2 31C23 30.8 22.7 30.7 22.4 30.7C22.1 30.7 21.8 30.8 21.6 31L16 38H38V31.5Z"
        fill="currentColor"
        opacity="0.4"
      />
      {/* Image frame outline */}
      <path
        d="M10 12C10 10.3 11.3 9 13 9H35C36.7 9 38 10.3 38 12V36C38 37.7 36.7 39 35 39H13C11.3 39 10 37.7 10 36V12ZM13 12V36H35V12H13Z"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
}

export function Placeholder({
  size = 'base',
  aspectRatio,
  width,
  height,
  loading = false,
  showIcon = true,
  children,
  className,
}: PlaceholderProps) {
  const style: CSSProperties = {};

  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }
  if (aspectRatio) {
    style.aspectRatio = aspectRatio;
  }

  const hasCustomDimensions = width !== undefined || height !== undefined || aspectRatio !== undefined;

  return (
    <div
      className={cn(
        'w-full rounded-lg flex flex-col items-center justify-center',
        loading
          ? 'bg-gradient-to-r from-[--color-surface--hover] via-[--color-surface--hover]/50 to-[--color-surface--hover] bg-[length:200%_100%] animate-pulse'
          : 'bg-[--color-surface--hover]/60 border border-dashed border-[--color-border]',
        !hasCustomDimensions && sizeStyles[size],
        'text-[--color-text--secondary]',
        className,
      )}
      style={style}
      role={loading ? 'status' : undefined}
      aria-label={loading ? 'Loading content' : undefined}
    >
      {loading ? (
        <span className="sr-only">Loading...</span>
      ) : children ? (
        children
      ) : showIcon ? (
        <PlaceholderIcon />
      ) : null}
    </div>
  );
}

export default Placeholder;
