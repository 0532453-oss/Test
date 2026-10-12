import React from 'react';

export interface BoxIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width of the icon (height scales proportionally) */
  size?: number;
  /** Visual variant */
  variant?: 'default';
}

/**
 * BoxIcon - Converted from packages/atlantis/packages/site/public/Box.svg
 *
 * Displays the Atlantis Box design reference illustration showing
 * a white rounded rectangle with a border and an inner gray content area,
 * representing the Box UI component used for container shapes.
 */
export const BoxIcon: React.FC<BoxIconProps> = ({
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
    {/* Outer box with white fill and border */}
    <path
      d="M68 10.5H156C157.933 10.5 159.5 12.067 159.5 14V102C159.5 103.933 157.933 105.5 156 105.5H68C66.067 105.5 64.5 103.933 64.5 102V14C64.5 12.067 66.067 10.5 68 10.5Z"
      fill="white"
    />
    <path
      d="M68 10.5H156C157.933 10.5 159.5 12.067 159.5 14V102C159.5 103.933 157.933 105.5 156 105.5H68C66.067 105.5 64.5 103.933 64.5 102V14C64.5 12.067 66.067 10.5 68 10.5Z"
      stroke="#DADFE2"
    />
    {/* Inner content area */}
    <path
      d="M72 22C72 19.7909 73.7909 18 76 18H148C150.209 18 152 19.7909 152 22V94C152 96.2091 150.209 98 148 98H76C73.7909 98 72 96.2091 72 94V22Z"
      fill="#DADFE2"
    />
  </svg>
);

export default BoxIcon;
