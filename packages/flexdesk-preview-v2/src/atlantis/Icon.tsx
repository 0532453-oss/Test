/**
 * Icon - Native SVG implementation matching @jobber/components Icon API
 *
 * This uses SVG path data extracted from @jobber/design icons, providing
 * the same interface as the Atlantis component library without requiring lucide-react.
 *
 * To regenerate icon paths: node generate-icon-map.js
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { iconPaths } from './iconPaths';

/**
 * Icon names matching Atlantis design system
 * Uses native SVG paths from @jobber/design
 */
export type IconNames =
  // Arrows
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowUp'
  | 'longArrowDown'
  | 'longArrowLeft'
  | 'longArrowRight'
  | 'longArrowUp'
  // Calendar & Scheduling
  | 'calendar'
  | 'schedule'
  | 'timer'
  | 'recurring'
  // Files
  | 'file'
  | 'note'
  | 'upload'
  | 'download'
  | 'fileEmpty'
  | 'receipt'
  // Forms
  | 'edit'
  | 'trash'
  | 'star'
  | 'checkbox'
  // Status and Support
  | 'alert'
  | 'warning'
  | 'info'
  | 'help'
  | 'successCircle'
  // Map
  | 'address'
  | 'property'
  | 'building'
  // Messaging
  | 'email'
  | 'phone'
  | 'sms'
  | 'sendMessage'
  | 'reminder'
  // User
  | 'clients'
  | 'person'
  | 'company'
  | 'user'
  | 'userSettings'
  // Transaction
  | 'payment'
  | 'percent'
  | 'money'
  // Work
  | 'work'
  | 'job'
  | 'request'
  | 'quote'
  | 'invoice'
  | 'inbox'
  | 'wrench'
  | 'tools'
  // System Actions
  | 'add'
  | 'remove'
  | 'copy'
  | 'search'
  | 'filter'
  | 'sliders'
  | 'sort'
  | 'sync'
  | 'export'
  | 'externalLink'
  | 'import'
  | 'customize'
  | 'tag'
  | 'tags'
  | 'send'
  | 'print'
  // Analytics
  | 'barChart'
  | 'insights'
  // Other
  | 'checkmark'
  | 'cross'
  | 'cog'
  | 'dashboard'
  | 'eye'
  | 'eyeCrossed'
  | 'home'
  | 'grid'
  | 'list'
  | 'logout'
  | 'menu'
  | 'more'
  | 'link'
  | 'sun'
  | 'moon'
  | 'shell'
  | 'tableColumns'
  | 'plus'
  | 'minus'
  | 'trendUp'
  | 'trendDown'
  | 'trendNeutral'
  | 'hash'
  | 'drag'
  | 'bookmark'
  | 'bookmarkAdd'
  | 'bookmarkRemove'
  | 'refresh'
  | 'external';

export type IconSizes = 'small' | 'base' | 'large';

export type IconColorNames =
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'orange'
  | 'greyBlue'
  | 'greyBlueDark'
  | 'white'
  | 'interactive'
  | 'interactiveSubtle'
  | 'critical'
  | 'success'
  | 'warning'
  | 'informative';

export interface IconProps {
  /** The icon to show */
  readonly name: IconNames;

  /**
   * Changes the size to small or large.
   * @default base
   */
  readonly size?: IconSizes;

  /**
   * Determines the color of the icon.
   */
  readonly color?: IconColorNames;

  /**
   * Sets a custom color for the icon. Can be a rgb() or hex value.
   */
  readonly customColor?: string;

  /**
   * Used to locate this view in end-to-end tests
   */
  readonly testID?: string;

  /**
   * Custom class name for additional styling
   */
  readonly className?: string;
}

/**
 * Map Atlantis icon names to @jobber/design icon names
 * Some icons have aliases or need to map to different base icons
 */
const iconNameMap: Record<IconNames, string> = {
  // Arrows - @jobber/design uses these exact names
  arrowDown: 'arrowDown',
  arrowLeft: 'arrowLeft',
  arrowRight: 'arrowRight',
  arrowUp: 'arrowUp',
  longArrowDown: 'backArrow', // rotated
  longArrowLeft: 'backArrow',
  longArrowRight: 'backArrow', // rotated
  longArrowUp: 'backArrow', // rotated
  // Calendar & Scheduling
  calendar: 'calendar',
  schedule: 'schedule',
  timer: 'timer',
  recurring: 'recurring',
  // Files
  file: 'file',
  note: 'note',
  upload: 'upload',
  download: 'download',
  fileEmpty: 'file', // fallback
  receipt: 'invoice', // using invoice as receipt fallback
  // Forms
  edit: 'edit',
  trash: 'trash',
  star: 'star',
  checkbox: 'checkbox',
  // Status and Support
  alert: 'alert',
  warning: 'warning',
  info: 'info',
  help: 'help',
  successCircle: 'checkmarkCircle',
  // Map
  address: 'address',
  property: 'property',
  building: 'company',
  // Messaging
  email: 'email',
  phone: 'phone',
  sms: 'sms',
  sendMessage: 'sendMessage',
  reminder: 'reminder',
  // User
  clients: 'clients',
  person: 'person',
  company: 'company',
  user: 'person',
  userSettings: 'user', // using user icon
  // Transaction
  payment: 'payment',
  percent: 'percent',
  money: 'money',
  // Work
  work: 'work',
  job: 'job',
  request: 'request',
  quote: 'quote',
  invoice: 'invoice',
  inbox: 'email', // using email as inbox fallback
  wrench: 'engine', // using engine as wrench fallback
  tools: 'engine', // using engine as tools fallback
  // System Actions
  add: 'add',
  remove: 'cross',
  copy: 'copy',
  search: 'search',
  filter: 'filter',
  sliders: 'sliderCenter', // using sliderCenter as sliders fallback
  sort: 'sort',
  sync: 'sync',
  export: 'export',
  externalLink: 'export',
  import: 'import',
  customize: 'customize',
  tag: 'tag',
  tags: 'tag', // using tag as tags fallback
  send: 'sendMessage',
  print: 'printer',
  // Analytics
  barChart: 'reports',
  insights: 'reports',
  // Other
  checkmark: 'checkmark',
  cross: 'cross',
  cog: 'cog',
  dashboard: 'dashboard',
  eye: 'eye',
  eyeCrossed: 'eyeCrossed',
  home: 'home',
  grid: 'grid',
  list: 'list',
  logout: 'logout',
  menu: 'menu',
  more: 'more',
  link: 'link',
  sun: 'sun',
  moon: 'sun', // using sun as moon fallback (no moon in @jobber/design)
  shell: 'sparkles', // Using sparkles as placeholder for app branding
  tableColumns: 'tableColumns',
  plus: 'plus',
  minus: 'minus',
  trendUp: 'arrowUp', // using arrowUp as trendUp fallback
  trendDown: 'arrowDown', // using arrowDown as trendDown fallback
  trendNeutral: 'minus',
  hash: 'number', // using number as hash fallback
  drag: 'drag',
  bookmark: 'star', // fallback
  bookmarkAdd: 'starFill', // using starFill
  bookmarkRemove: 'star', // fallback
  refresh: 'sync',
  external: 'export',
};

/**
 * Rotation transforms for arrow variants
 */
const rotationMap: Record<string, string> = {
  longArrowDown: 'rotate(-90)',
  longArrowRight: 'rotate(180)',
  longArrowUp: 'rotate(90)',
};

/**
 * Map color names to CSS values
 */
const colorMap: Record<IconColorNames, string> = {
  blue: 'var(--color-informative, #0c7bc4)',
  green: 'var(--color-success, #15803d)',
  red: 'var(--color-critical, #dc2626)',
  yellow: 'var(--color-warning, #f59e0b)',
  orange: '#f97316',
  greyBlue: 'var(--color-text--secondary, #6b7280)',
  greyBlueDark: 'var(--color-text, #1f2937)',
  white: '#ffffff',
  interactive: 'var(--color-interactive, #0c7bc4)',
  interactiveSubtle: 'var(--color-interactive--subtle, #e6f0ff)',
  critical: 'var(--color-critical, #dc2626)',
  success: 'var(--color-success, #15803d)',
  warning: 'var(--color-warning, #f59e0b)',
  informative: 'var(--color-informative, #0c7bc4)',
};

/**
 * Map sizes to pixel values
 */
const sizeMap: Record<IconSizes, number> = {
  small: 16,
  base: 20,
  large: 24,
};

/**
 * Icon component following Atlantis/Jobber design system
 * Renders native SVG icons without external dependencies
 */
export function Icon({
  name,
  color,
  customColor,
  size = 'base',
  testID,
  className,
}: IconProps) {
  const jobberIconName = iconNameMap[name];
  const paths = iconPaths[jobberIconName];

  if (!paths || paths.length === 0) {
    if (import.meta.env.DEV) {
      console.warn(`Icon "${name}" (mapped to "${jobberIconName}") not found in icon paths`);
    }
    const fallbackSize = sizeMap[size];
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={fallbackSize}
        height={fallbackSize}
        className={cn('flex-shrink-0', className)}
        data-testid={testID || name}
        aria-hidden="true"
      />
    );
  }

  const iconSize = sizeMap[size];
  const iconColor = customColor || (color ? colorMap[color] : 'currentColor');
  const rotation = rotationMap[name];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={iconSize}
      height={iconSize}
      fill={iconColor}
      className={cn('flex-shrink-0', className)}
      data-testid={testID || name}
      aria-hidden="true"
    >
      <g transform={rotation}>
        {paths.map((path, index) => (
          <path key={index} d={path} />
        ))}
      </g>
    </svg>
  );
}

export default Icon;
