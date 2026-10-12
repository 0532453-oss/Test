/**
 * Button - Local implementation matching @jobber/components Button API
 *
 * Styled to match Atlantis Button.module.css design reference:
 * - Uses CSS custom property-based color variations
 * - Supports primary/secondary/tertiary types with work/learning/subtle/destructive variations
 * - Tertiary buttons use underline decoration per Atlantis spec
 * - Disabled state uses Atlantis disabled color tokens
 * - Loading state uses Atlantis animated diagonal stripes pattern
 * - Sizes use min-height (32px/40px/48px) matching Atlantis sizing
 */
import React, { forwardRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAtlantisTheme } from '../AtlantisThemeContext';
import { Icon, type IconNames } from './Icon';

export type ButtonType = 'primary' | 'secondary' | 'tertiary';
export type ButtonVariation = 'work' | 'learning' | 'subtle' | 'destructive';
export type ButtonSize = 'small' | 'base' | 'large';

export interface ButtonProps {
  /**
   * The visual type of the button
   * @default "primary"
   */
  readonly type?: ButtonType;

  /**
   * The color variation of the button
   * @default "work"
   */
  readonly variation?: ButtonVariation;

  /**
   * The size of the button
   * @default "base"
   */
  readonly size?: ButtonSize;

  /**
   * The button label text
   */
  readonly label?: string;

  /**
   * Icon name to display (optional) - use Atlantis icon names
   * For icon-only buttons, provide icon + ariaLabel (required for accessibility)
   */
  readonly icon?: IconNames;

  /**
   * Whether to display the icon on the right side
   * @default false
   */
  readonly iconOnRight?: boolean;

  /**
   * Whether the button is disabled
   * @default false
   */
  readonly disabled?: boolean;

  /**
   * Whether the button is in a loading state
   * @default false
   */
  readonly loading?: boolean;

  /**
   * Whether the button should take full width
   * @default false
   */
  readonly fullWidth?: boolean;

  /**
   * Whether this is a submit button
   * @default false
   */
  readonly submit?: boolean;

  /**
   * URL to navigate to (renders as anchor)
   */
  readonly url?: string;

  /**
   * External link (opens in new tab)
   */
  readonly external?: boolean;

  /**
   * Accessible label for screen readers
   */
  readonly ariaLabel?: string;

  /**
   * ARIA controls attribute
   */
  readonly ariaControls?: string;

  /**
   * ARIA haspopup attribute
   */
  readonly ariaHaspopup?: boolean;

  /**
   * ARIA expanded attribute
   */
  readonly ariaExpanded?: boolean;

  /**
   * Button ID
   */
  readonly id?: string;

  /**
   * Button name (for form submission)
   */
  readonly name?: string;

  /**
   * Button value (for form submission)
   */
  readonly value?: string;

  /**
   * Click handler
   */
  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;

  /**
   * Mouse down handler
   */
  readonly onMouseDown?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;

  /**
   * Children for custom button content
   */
  readonly children?: React.ReactNode;

  /**
   * Custom class name
   */
  readonly className?: string;
}

/**
 * Inject Atlantis button loading animation keyframes into document head.
 * Uses the same diagonal stripe pattern as Button.module.css.
 */
const KEYFRAMES_ID = 'atlantis-button-loading-keyframes';
function ensureLoadingKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes atlantisButtonStripes {
      0% { background-position: 0 0; }
      100% { background-position: var(--space-larger, 32px) var(--space-larger, 32px); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Get button styles based on type, variation, and size.
 * Aligned with Atlantis Button.module.css design reference.
 */
function getButtonStyles(
  type: ButtonType,
  variation: ButtonVariation,
  size: ButtonSize,
  disabled: boolean,
  loading: boolean,
  fullWidth: boolean,
): string {
  // Base styles matching Atlantis .button class
  const baseStyles = [
    'inline-flex items-center justify-center',
    'box-border m-0',
    'font-medium leading-none text-center no-underline align-middle',
    'appearance-none cursor-pointer',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,112,243,0.4)] focus-visible:outline-transparent',
    'rounded-[var(--radius-base,8px)]',
    'gap-[var(--space-smaller,4px)]',
    'border border-solid',
  ];

  // Size styles matching Atlantis min-height and padding tokens
  const sizeStyles: Record<ButtonSize, string> = {
    small: 'min-h-[32px] py-[var(--space-smaller,4px)] px-[var(--space-small,8px)] text-sm',
    base: 'min-h-[40px] px-[var(--space-base,16px)] text-sm',
    large: 'min-h-[48px] px-[calc(var(--space-base,16px)+var(--space-smaller,4px))] text-base',
  };

  // Type + Variation styles aligned with Atlantis Button.module.css
  const typeVariationStyles: Record<ButtonType, Record<ButtonVariation, string>> = {
    primary: {
      work: [
        'bg-[var(--color-interactive)] text-[var(--color-surface,#fff)] border-[var(--color-interactive)]',
        'hover:bg-[var(--color-interactive--hover)] hover:border-[var(--color-interactive--hover)]',
        'active:bg-[var(--color-interactive--hover)] active:border-[var(--color-interactive--hover)]',
      ].join(' '),
      learning: [
        'bg-[var(--color-informative)] text-[var(--color-surface,#fff)] border-[var(--color-informative)]',
        'hover:bg-[var(--color-informative--hover,var(--color-informative))] hover:border-[var(--color-informative--hover,var(--color-informative))] hover:opacity-90',
        'active:opacity-90',
      ].join(' '),
      subtle: [
        'bg-[var(--color-surface)] text-[var(--color-text--secondary)] border-[var(--color-border--interactive,var(--color-border))]',
        'hover:bg-[var(--color-surface--hover)] hover:border-[var(--color-interactive--hover,var(--color-border--hover))]',
        'hover:text-[var(--color-interactive--hover,var(--color-interactive))]',
      ].join(' '),
      destructive: [
        'bg-[var(--color-critical)] text-[var(--color-surface,#fff)] border-[var(--color-critical)]',
        'hover:bg-[var(--color-critical--hover,var(--color-critical))] hover:border-[var(--color-critical--hover,var(--color-critical))] hover:opacity-90',
        'active:opacity-90',
      ].join(' '),
    },
    secondary: {
      work: [
        'bg-[var(--color-surface)] text-[var(--color-interactive)] border-[var(--color-interactive)]',
        'hover:bg-[var(--color-surface--hover)] hover:text-[var(--color-interactive--hover)] hover:border-[var(--color-interactive--hover)]',
      ].join(' '),
      learning: [
        'bg-[var(--color-surface)] text-[var(--color-informative)] border-[var(--color-informative)]',
        'hover:bg-[var(--color-surface--hover)] hover:text-[var(--color-informative--hover,var(--color-informative))]',
        'hover:border-[var(--color-informative--hover,var(--color-informative))]',
      ].join(' '),
      subtle: [
        'bg-[var(--color-surface)] text-[var(--color-text--secondary)] border-transparent',
        'hover:bg-[var(--color-surface--hover)] hover:text-[var(--color-interactive--hover,var(--color-interactive))]',
      ].join(' '),
      destructive: [
        'bg-[var(--color-surface)] text-[var(--color-critical)] border-[var(--color-critical)]',
        'hover:bg-[var(--color-surface--hover)] hover:text-[var(--color-critical--hover,var(--color-critical))]',
        'hover:border-[var(--color-critical--hover,var(--color-critical))]',
      ].join(' '),
    },
    tertiary: {
      work: [
        'bg-transparent text-[var(--color-interactive)] border-transparent',
        'underline decoration-[var(--border-thick,2px)] underline-offset-[var(--space-smallest,2px)]',
        'hover:text-[var(--color-interactive--hover)] hover:border-transparent',
      ].join(' '),
      learning: [
        'bg-transparent text-[var(--color-informative)] border-transparent',
        'underline decoration-[var(--border-thick,2px)] underline-offset-[var(--space-smallest,2px)]',
        'hover:text-[var(--color-informative--hover,var(--color-informative))] hover:border-transparent',
      ].join(' '),
      subtle: [
        'bg-transparent text-[var(--color-text--secondary)] border-transparent',
        'hover:text-[var(--color-interactive--hover,var(--color-interactive))]',
        'hover:bg-[var(--color-surface--hover)] hover:border-transparent',
      ].join(' '),
      destructive: [
        'bg-transparent text-[var(--color-critical)] border-transparent',
        'underline decoration-[var(--border-thick,2px)] underline-offset-[var(--space-smallest,2px)]',
        'hover:text-[var(--color-critical--hover,var(--color-critical))] hover:border-transparent',
      ].join(' '),
    },
  };

  // Disabled styles matching Atlantis .button.disabled
  const disabledStyles = [
    'border-[var(--color-disabled--secondary,#d4d4d4)]',
    'text-[var(--color-disabled,#a3a3a3)]',
    'bg-[var(--color-disabled--secondary,#d4d4d4)]',
    'select-none pointer-events-none cursor-not-allowed',
    '!no-underline',
  ].join(' ');

  // Loading styles matching Atlantis .loading animated stripes
  const loadingStyles = 'pointer-events-none cursor-not-allowed animate-[atlantisButtonStripes_1.5s_linear_infinite]';

  // Full width styles
  const fullWidthStyles = 'w-full';

  return cn(
    baseStyles,
    sizeStyles[size],
    !disabled && typeVariationStyles[type][variation],
    disabled && disabledStyles,
    loading && !disabled && loadingStyles,
    fullWidth && fullWidthStyles,
  );
}

/**
 * Get inline style for loading state stripe pattern.
 * Matches Atlantis Button.module.css .loading background-image.
 */
function getLoadingStyle(
  loading: boolean,
  type: ButtonType,
  variation: ButtonVariation,
): React.CSSProperties | undefined {
  if (!loading) return undefined;
  // Primary non-subtle buttons use white stripes; others use dark stripes
  const isPrimaryNonSubtle = type === 'primary' && variation !== 'subtle';
  const stripeColor = isPrimaryNonSubtle
    ? 'rgba(255, 255, 255, 0.25)'
    : 'rgba(0, 0, 0, 0.1)';

  return {
    backgroundImage: `linear-gradient(
      135deg,
      ${stripeColor} 0%,
      ${stripeColor} 25%,
      transparent 25%,
      transparent 50%,
      ${stripeColor} 50%,
      ${stripeColor} 75%,
      transparent 75%,
      transparent 100%
    )`,
    backgroundSize: 'var(--space-larger, 32px) var(--space-larger, 32px)',
  };
}

/**
 * Button component following Atlantis/Jobber design system.
 * Styled per Atlantis Button.module.css reference.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      type = 'primary',
      variation = 'work',
      size = 'base',
      label,
      icon,
      iconOnRight = false,
      disabled = false,
      loading = false,
      fullWidth = false,
      submit = false,
      url,
      external = false,
      ariaLabel,
      ariaControls,
      ariaHaspopup,
      ariaExpanded,
      id,
      name,
      value,
      onClick,
      onMouseDown,
      children,
      className,
    } = props;

    // Get theme context (for CSS variable fallbacks)
    useAtlantisTheme();

    // Inject loading animation keyframes on first render if loading
    useEffect(() => {
      if (loading) ensureLoadingKeyframes();
    }, [loading]);

    // Determine if this is an icon-only button
    const isIconOnly = icon && !label && !children;

    const buttonStyles = getButtonStyles(type, variation, size, disabled, loading, fullWidth);

    // Icon-only buttons get square sizing matching Atlantis .buttonChildren:has(> svg:only-child)
    const iconOnlyStyles = isIconOnly ? 'px-0 aspect-square' : '';

    const combinedClassName = cn(buttonStyles, iconOnlyStyles, className);

    // Get icon size based on button size
    const iconSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'base';

    // Loading state: show content (no spinner) with stripe overlay per Atlantis pattern
    const content = children || (
      <>
        {icon && !iconOnRight && <Icon name={icon} size={iconSize} />}
        {label && <span>{label}</span>}
        {icon && iconOnRight && <Icon name={icon} size={iconSize} />}
      </>
    );

    const loadingStyle = getLoadingStyle(loading, type, variation);

    const commonProps = {
      id,
      className: combinedClassName,
      style: loadingStyle,
      'aria-label': ariaLabel,
      'aria-controls': ariaControls,
      'aria-haspopup': ariaHaspopup,
      'aria-expanded': ariaExpanded,
      'aria-busy': loading,
      'aria-disabled': disabled,
    };

    // Render as anchor if URL is provided
    if (url) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={disabled ? undefined : url}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          onClick={disabled ? undefined : onClick}
          onMouseDown={disabled ? undefined : onMouseDown}
          {...commonProps}
        >
          {content}
        </a>
      );
    }

    // Render as button
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={submit ? 'submit' : 'button'}
        disabled={disabled || loading}
        name={name}
        value={value}
        onClick={disabled || loading ? undefined : onClick}
        onMouseDown={disabled || loading ? undefined : onMouseDown}
        {...commonProps}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
