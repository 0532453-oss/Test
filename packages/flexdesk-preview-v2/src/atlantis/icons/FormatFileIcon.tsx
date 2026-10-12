import React from 'react';

export interface FormatFileIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width of the icon (height scales proportionally) */
  size?: number;
  /** Visual variant */
  variant?: 'default';
}

/**
 * FormatFileIcon - Converted from packages/atlantis/packages/site/public/FormatFile.png
 *
 * Displays the Atlantis FormatFile design reference illustration showing
 * a file attachment card with a thumbnail image, filename "driveway.png",
 * file size "2.04MB", and a red trash/delete icon, representing the
 * FormatFile UI component used for displaying file attachments.
 */
export const FormatFileIcon: React.FC<FormatFileIconProps> = ({
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
    <g clipPath="url(#formatfile_clip0)">
      {/* Card background */}
      <rect x="12" y="24" width="200" height="70" rx="8" fill="white" stroke="#DADFE2" strokeWidth="1" />

      {/* Thumbnail image placeholder */}
      <rect x="20" y="32" width="54" height="54" rx="4" fill="#E8EDF0" />
      {/* Simplified landscape image in thumbnail */}
      {/* Sky */}
      <rect x="20" y="32" width="54" height="30" rx="4" fill="#B8C4CB" />
      {/* Ground */}
      <rect x="20" y="56" width="54" height="30" rx="4" fill="#7B8F9C" />
      {/* House shape */}
      <path d="M35 52L47 42L59 52V62H35V52Z" fill="#C5CDD2" />
      {/* House roof */}
      <path d="M35 52L47 42L59 52" stroke="#9AABB6" strokeWidth="1.5" fill="none" />
      {/* House body */}
      <rect x="38" y="52" width="18" height="10" fill="#D5DCE0" />
      {/* House door */}
      <rect x="44" y="55" width="6" height="7" rx="1" fill="#9AABB6" />

      {/* Filename text: "driveway.png" */}
      <text x="84" y="55" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="500" fill="#233D48">
        driveway.png
      </text>
      {/* File size text: "2.04MB" */}
      <text x="84" y="72" fontFamily="Arial, sans-serif" fontSize="11" fill="#7C8B96">
        2.04MB
      </text>

      {/* Trash/delete icon */}
      <g transform="translate(185, 44)">
        {/* Trash can lid */}
        <path d="M4 4H20" stroke="#D14343" strokeWidth="1.5" strokeLinecap="round" />
        {/* Trash can handle */}
        <path d="M8 4V2.5C8 1.67 8.67 1 9.5 1H14.5C15.33 1 16 1.67 16 2.5V4" stroke="#D14343" strokeWidth="1.5" strokeLinecap="round" />
        {/* Trash can body */}
        <path d="M5 4L6 22H18L19 4" stroke="#D14343" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Trash lines */}
        <path d="M9 8V18" stroke="#D14343" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 8V18" stroke="#D14343" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 8V18" stroke="#D14343" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </g>
    <defs>
      <clipPath id="formatfile_clip0">
        <path
          d="M0 8C0 3.58172 3.58172 0 8 0H216C220.418 0 224 3.58172 224 8V109C224 113.418 220.418 117 216 117H8C3.58172 117 0 113.418 0 109V8Z"
          fill="white"
        />
      </clipPath>
    </defs>
  </svg>
);

export default FormatFileIcon;
