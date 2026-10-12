/**
 * ProgressBar - Local implementation matching @jobber/components ProgressBar API
 *
 * Displays a horizontal bar indicating progress through a task or process.
 * Supports both continuous progress (percentage) and stepped progress variations,
 * as well as an indeterminate state for unknown durations.
 *
 * Uses Atlantis design tokens for colors, border-radius, and sizing.
 */
import React from 'react';
import { cn } from '@/lib/utils';

// Inject indeterminate animation keyframes into document
const indeterminateKeyframes = `
@keyframes progressIndeterminate {
  0% { left: -33%; }
  100% { left: 100%; }
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'atlantis-progressbar-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = indeterminateKeyframes;
    document.head.appendChild(styleEl);
  }
}

export type ProgressBarSize = 'smaller' | 'small' | 'base';
export type ProgressBarVariation = 'progress' | 'stepped';

export interface ProgressBarProps {
  /**
   * Current step or value of the progress bar.
   * For percentage-based: use values 0–100 with totalSteps=100.
   */
  readonly currentStep: number;

  /**
   * Total number of steps. For percentages, set this to 100.
   */
  readonly totalSteps: number;

  /**
   * Size of the progress bar track.
   * @default "base"
   */
  readonly size?: ProgressBarSize;

  /**
   * Display variation.
   * - "progress": continuous bar fill
   * - "stepped": segmented steps
   * @default "progress"
   */
  readonly variation?: ProgressBarVariation;

  /**
   * When true, shows an animated indeterminate state (unknown completion).
   * Overrides currentStep/totalSteps visually.
   * @default false
   */
  readonly indeterminate?: boolean;

  /**
   * Additional CSS class name
   */
  readonly className?: string;
}

const sizeHeightMap: Record<ProgressBarSize, string> = {
  smaller: 'h-1',   // 4px
  small: 'h-2',     // 8px
  base: 'h-4',      // 16px
};

/**
 * Continuous progress bar — shows a single filled track.
 */
function ProgressBarContinuous({
  currentStep,
  totalSteps,
  size = 'base',
  indeterminate = false,
  className,
}: Omit<ProgressBarProps, 'variation'>) {
  const percentage = totalSteps > 0 ? Math.min((currentStep / totalSteps) * 100, 100) : 0;
  const heightClass = sizeHeightMap[size];

  if (indeterminate) {
    return (
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        className={cn(
          'relative w-full overflow-hidden rounded-full',
          'bg-[--color-interactive--background]',
          'shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]',
          heightClass,
          className,
        )}
      >
        <div
          className={cn(
            'absolute inset-y-0 w-1/3 rounded-full',
            'bg-[--color-interactive]',
            'animate-[progressIndeterminate_1.5s_ease-in-out_infinite]',
          )}
        />
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-valuetext={`${Math.round(percentage)}%`}
      className={cn(
        'relative w-full overflow-hidden rounded-full',
        'bg-[--color-interactive--background]',
        'shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]',
        heightClass,
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          'bg-[--color-interactive]',
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

/**
 * Stepped progress bar — shows discrete step segments.
 */
function ProgressBarStepped({
  currentStep,
  totalSteps,
  size = 'base',
  className,
}: Omit<ProgressBarProps, 'variation' | 'indeterminate'>) {
  const heightClass = sizeHeightMap[size];
  const ariaLabel = `progress, ${currentStep} out of ${totalSteps}`;

  return (
    <div
      role="progressbar"
      aria-valuenow={totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0}
      aria-valuetext={ariaLabel}
      className={cn('flex w-full flex-row gap-1', className)}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step <= currentStep;

        return (
          <div
            key={step}
            className={cn(
              'flex-1 overflow-hidden rounded-full transition-colors duration-200',
              'shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]',
              heightClass,
              isActive
                ? 'bg-[--color-interactive]'
                : 'bg-[--color-interactive--background]',
            )}
          />
        );
      })}
    </div>
  );
}

/**
 * ProgressBar component following Atlantis/Jobber design system.
 *
 * @example Percentage progress
 * ```tsx
 * <ProgressBar currentStep={65} totalSteps={100} />
 * ```
 *
 * @example Stepped progress
 * ```tsx
 * <ProgressBar currentStep={2} totalSteps={5} variation="stepped" />
 * ```
 *
 * @example Indeterminate (loading)
 * ```tsx
 * <ProgressBar currentStep={0} totalSteps={100} indeterminate />
 * ```
 */
export function ProgressBar({
  currentStep,
  totalSteps,
  size = 'base',
  variation = 'progress',
  indeterminate = false,
  className,
}: ProgressBarProps) {
  if (variation === 'stepped') {
    return (
      <ProgressBarStepped
        currentStep={currentStep}
        totalSteps={totalSteps}
        size={size}
        className={className}
      />
    );
  }

  return (
    <ProgressBarContinuous
      currentStep={currentStep}
      totalSteps={totalSteps}
      size={size}
      indeterminate={indeterminate}
      className={className}
    />
  );
}

export default ProgressBar;
