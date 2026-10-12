import React from 'react';

export interface StatusIndicatorIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width of the icon (height scales proportionally) */
  size?: number;
  /** Visual variant */
  variant?: 'default';
}

/**
 * StatusIndicatorIcon - Converted from packages/atlantis/packages/site/public/StatusIndicator.svg
 *
 * Displays the Atlantis StatusIndicator design reference illustration showing
 * five colored status dots in a row: inactive (#3F5D69), success (#388523),
 * warning (#CDB52D), critical (#D24232), and informative (#3B9AE8).
 */
export const StatusIndicatorIcon: React.FC<StatusIndicatorIconProps> = ({
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
    {/* Inactive/default status dot */}
    <rect x="75" y="54" width="10" height="10" rx="5" fill="#3F5D69" />
    {/* Success status dot */}
    <rect x="91" y="54" width="10" height="10" rx="5" fill="#388523" />
    {/* Warning status dot */}
    <rect x="107" y="54" width="10" height="10" rx="5" fill="#CDB52D" />
    {/* Critical status dot */}
    <rect x="123" y="54" width="10" height="10" rx="5" fill="#D24232" />
    {/* Informative status dot */}
    <rect x="139" y="54" width="10" height="10" rx="5" fill="#3B9AE8" />
  </svg>
);

export default StatusIndicatorIcon;
