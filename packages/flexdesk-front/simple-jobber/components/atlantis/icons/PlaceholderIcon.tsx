import React from 'react';

export interface PlaceholderIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width of the icon (height scales proportionally) */
  size?: number;
  /** Visual variant */
  variant?: 'default';
}

/**
 * PlaceholderIcon - Converted from packages/atlantis/packages/site/public/Placeholder.svg
 *
 * Displays the Atlantis Placeholder design reference illustration showing
 * a circular background with an image/landscape icon inside a frame outline,
 * used for empty image states and loading skeleton states.
 */
export const PlaceholderIcon: React.FC<PlaceholderIconProps> = ({
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
    <g clipPath="url(#placeholder_clip0)">
      {/* Circular background */}
      <path d="M73 58.5C73 37.237 90.237 20 111.5 20V20C132.763 20 150 37.237 150 58.5V58.5C150 79.763 132.763 97 111.5 97V97C90.237 97 73 79.763 73 58.5V58.5Z" fill="#F1F0E9" />
      {/* Sun/dot element */}
      <path d="M109.042 52.0972C109.042 54.2757 107.276 56.0417 105.097 56.0417C102.919 56.0417 101.153 54.2757 101.153 52.0972C101.153 49.9188 102.919 48.1528 105.097 48.1528C107.276 48.1528 109.042 49.9188 109.042 52.0972Z" fill="#627A84" />
      {/* Mountain/landscape shape */}
      <path d="M123.833 63.5736L118.674 57.3826C118.487 57.1577 118.209 57.0278 117.917 57.0278C117.624 57.0278 117.346 57.1577 117.159 57.3826L110.028 65.9403L107.827 63.2992C107.64 63.0744 107.362 62.9444 107.069 62.9444C106.777 62.9444 106.499 63.0744 106.312 63.2992L100.034 70.8333H123.833V63.5736Z" fill="#627A84" />
      {/* Image frame outline */}
      <path d="M94.25 45.1944C94.25 43.016 96.016 41.25 98.1944 41.25H125.806C127.984 41.25 129.75 43.016 129.75 45.1944V72.8056C129.75 74.9841 127.984 76.75 125.806 76.75H98.1944C96.016 76.75 94.25 74.9841 94.25 72.8056V45.1944ZM98.1944 45.1944V72.8056H125.806V45.1944H98.1944Z" fill="#627A84" />
    </g>
    <defs>
      <clipPath id="placeholder_clip0">
        <path d="M0 8C0 3.58172 3.58172 0 8 0H216C220.418 0 224 3.58172 224 8V109C224 113.418 220.418 117 216 117H8C3.58172 117 0 113.418 0 109V8Z" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default PlaceholderIcon;
