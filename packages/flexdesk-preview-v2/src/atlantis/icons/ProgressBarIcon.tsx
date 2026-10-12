import React from 'react';

export interface ProgressBarIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width of the icon (height scales proportionally) */
  size?: number;
  /** Progress value from 0 to 100 */
  value?: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Whether to show indeterminate/pulsing state */
  indeterminate?: boolean;
}

/**
 * ProgressBarIcon - Converted from packages/atlantis/packages/site/public/ProgressBar.svg
 *
 * Displays the Atlantis ProgressBar design reference illustration showing
 * a horizontal track with a filled progress portion, used for progress indicators.
 */
export const ProgressBarIcon: React.FC<ProgressBarIconProps> = ({
  size = 224,
  value = 50,
  max = 100,
  indeterminate: _indeterminate = false,
  className,
  ...props
}) => {
  const clampedValue = Math.max(0, Math.min(value, max));
  const fillWidth = max > 0 ? (clampedValue / max) * 200 : 0;

  return (
    <svg
      width={size}
      height={Math.round(size * (117 / 224))}
      viewBox="0 0 224 117"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      {/* Background track with inner shadow */}
      <g filter="url(#progressbar_filter0)">
        <rect x="12" y="51" width="200" height="16" rx="8" fill="#F1F0E9" />
      </g>
      {/* Filled progress portion */}
      {fillWidth > 0 && (
        <rect x="12" y="51" width={fillWidth} height="16" rx="8" fill="#388523" />
      )}
      <defs>
        <filter
          id="progressbar_filter0"
          x="12"
          y="51"
          width="200"
          height="18"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
          />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>
      </defs>
    </svg>
  );
};

export default ProgressBarIcon;
