import React from 'react';

/**
 * Spinner component - Atlantis-compatible loading spinner
 *
 * Matches @jobber/components Spinner API
 * @see https://atlantis.getjobber.com/components/Spinner
 */

export type SpinnerSize = 'small' | 'base' | 'large';

export interface SpinnerProps {
  /**
   * Size of the spinner
   * @default 'base'
   */
  size?: SpinnerSize;

  /**
   * Accessible label for screen readers
   * @default 'Loading'
   */
  ariaLabel?: string;

  /**
   * Whether to use the inline variant (smaller, inline with text)
   * @default false
   */
  inline?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;
}

const sizeStyles: Record<SpinnerSize, { wrapper: string; spinner: string }> = {
  small: {
    wrapper: 'h-4 w-4',
    spinner: 'h-4 w-4 border-2',
  },
  base: {
    wrapper: 'h-6 w-6',
    spinner: 'h-6 w-6 border-2',
  },
  large: {
    wrapper: 'h-10 w-10',
    spinner: 'h-10 w-10 border-[3px]',
  },
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'base',
  ariaLabel = 'Loading',
  inline = false,
  className = '',
}) => {
  const styles = sizeStyles[size];

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`
        ${inline ? 'inline-flex' : 'flex'}
        items-center justify-center
        ${styles.wrapper}
        ${className}
      `.trim()}
    >
      <div
        className={`
          ${styles.spinner}
          rounded-full
          border-current
          border-t-transparent
          animate-spin
          text-[var(--color-interactive,hsl(var(--primary)))]
        `.trim()}
      />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export default Spinner;
