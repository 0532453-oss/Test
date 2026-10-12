import React from 'react';

export interface BordersIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width of the icon (height scales proportionally) */
  size?: number;
  /** Visual variant */
  variant?: 'default';
}

/**
 * BordersIcon - Converted from packages/atlantis/packages/site/public/Borders.png
 *
 * Displays the Atlantis Borders design reference illustration showing
 * three nested rounded rectangles in a cascading layout, representing
 * different border-radius sizes used in the design system.
 */
export const BordersIcon: React.FC<BordersIconProps> = ({
  size = 224,
  className,
  variant: _variant = 'default',
  ...props
}) => (
  <svg
    width={size}
    height={Math.round(size * (117 / 224))}
    viewBox="0 0 224 117"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Outer border rectangle - radius-larger (24px) with base border (1px) */}
    <rect
      x="8"
      y="4"
      width="200"
      height="100"
      rx="12"
      ry="12"
      stroke="var(--color-border, #D9D9D9)"
      strokeWidth="1"
      fill="none"
      opacity="0.6"
    />
    {/* Middle border rectangle - radius-large (16px) with base border (1px) */}
    <rect
      x="36"
      y="20"
      width="172"
      height="90"
      rx="10"
      ry="10"
      stroke="var(--color-border, #C8C8C8)"
      strokeWidth="1"
      fill="none"
      opacity="0.8"
    />
    {/* Inner border rectangle - radius-base (8px) with thick border (2px) */}
    <rect
      x="64"
      y="36"
      width="144"
      height="76"
      rx="8"
      ry="8"
      stroke="var(--color-border, #B8B8B8)"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export default BordersIcon;
