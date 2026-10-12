import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

// ---------------------------------------------------------------------------
// Avatar sub-component (display-only)
// ---------------------------------------------------------------------------

export type AvatarSize = 'small' | 'base' | 'large';

export interface AvatarProps {
  /** URL of the avatar image */
  imageUrl?: string;
  /** User name for accessibility (aria-label) */
  name?: string;
  /** Initials to display when no image is set (max 3 chars) */
  initials?: string;
  /** Background / border colour */
  color?: string;
  /** @default "base" */
  size?: AvatarSize;
  className?: string;
}

const AVATAR_SIZES: Record<AvatarSize, { box: number; text: string; icon: 'small' | 'base' | 'large' }> = {
  small: { box: 24, text: 'text-[10px]', icon: 'small' },
  base: { box: 32, text: 'text-xs', icon: 'base' },
  large: { box: 72, text: 'text-lg', icon: 'large' },
};

/**
 * Determines whether a CSS colour value is "dark" so we can pick white vs dark
 * text. We use a simple heuristic: if the colour is a hex value we convert to
 * luminance, otherwise we assume dark.
 */
function isColorDark(color?: string): boolean {
  if (!color) return true;
  const hex = color.replace('#', '');
  if (!/^[0-9a-fA-F]{3,6}$/.test(hex)) return true;
  const full = hex.length === 3
    ? hex.split('').map(c => c + c).join('')
    : hex;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  // ITU-R BT.601 luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function Avatar({
  imageUrl,
  name,
  initials,
  color,
  size = 'base',
  className = '',
}: AvatarProps) {
  const cfg = AVATAR_SIZES[size];
  const dark = isColorDark(color);

  const baseClasses = [
    'inline-flex items-center justify-center rounded-full overflow-hidden',
    'bg-[var(--color-surface--background)] border border-solid border-transparent',
    'select-none shrink-0',
  ].join(' ');

  const style: React.CSSProperties = {
    width: cfg.box,
    height: cfg.box,
    minWidth: cfg.box,
    minHeight: cfg.box,
    ...(color ? { backgroundColor: color, borderColor: color } : {}),
    ...(imageUrl
      ? {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {}),
  };

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={style}
      role={imageUrl ? 'img' : undefined}
      aria-label={name}
    >
      {!imageUrl && (
        <AvatarInitials
          initials={initials}
          dark={dark}
          size={size}
          textClass={cfg.text}
        />
      )}
    </div>
  );
}

function AvatarInitials({
  initials,
  dark,
  size,
  textClass,
}: {
  initials?: string;
  dark: boolean;
  size: AvatarSize;
  textClass: string;
}) {
  if (!initials) {
    return <Icon name="person" color={dark ? 'white' : 'interactiveSubtle'} size={size} />;
  }

  const display = initials.substring(0, 3);
  return (
    <span
      className={[
        'font-semibold leading-none',
        textClass,
        dark ? 'text-white' : 'text-[var(--color-text)]',
        display.length > 2 ? 'tracking-tighter' : '',
      ].join(' ')}
    >
      {display}
    </span>
  );
}

// ---------------------------------------------------------------------------
// InputAvatar component
// ---------------------------------------------------------------------------

export interface InputAvatarProps extends Omit<AvatarProps, 'size' | 'className'> {
  /** Callback when an image file is selected or removed */
  onChange?: (file?: File) => void;
  /** Accept types for file input (default: images) */
  accept?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Upload progress from 0 to 1. When < 1 an overlay with a ProgressBar is shown. */
  uploadProgress?: number;
  className?: string;
}

export function InputAvatar({
  onChange,
  accept = 'image/*',
  disabled = false,
  uploadProgress = 1,
  className = '',
  ...avatarProps
}: InputAvatarProps) {
  const [internalImageUrl, setInternalImageUrl] = useState<string | undefined>(
    avatarProps.imageUrl,
  );
  const blobUrlRef = useRef<string | null>(null);

  // Revoke blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const displayUrl = avatarProps.imageUrl ?? internalImageUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke the previous blob URL before creating a new one
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    // Create a local preview URL
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    setInternalImageUrl(url);
    onChange?.(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  }

  function handleRemove() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setInternalImageUrl(undefined);
    onChange?.(undefined);
  }

  return (
    <div className={`flex items-center gap-[var(--space-small,8px)] ${className}`}>
      {/* Avatar preview */}
      <div className="relative">
        <Avatar {...avatarProps} imageUrl={displayUrl} size="large" />

        {/* Upload progress overlay */}
        {uploadProgress < 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Dark overlay */}
            <div className="absolute inset-0 rounded-full bg-[var(--color-interactive--subtle,#1b3a5c)] opacity-30 mix-blend-multiply" />
            <div className="relative flex items-center h-full mx-[var(--space-small,8px)]">
              <ProgressBar
                size="small"
                currentStep={Math.round(uploadProgress * 100)}
                totalSteps={100}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upload / Change button */}
      <label
        className={[
          'cursor-pointer',
          disabled ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        <Button
          type="secondary"
          size="small"
          label={displayUrl ? 'Change Image' : 'Upload Image'}
          onClick={() => {
            // The click will propagate to the label which triggers the hidden input
          }}
          disabled={disabled}
        />
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="sr-only"
        />
      </label>

      {/* Remove button */}
      {displayUrl && uploadProgress >= 1 && (
        <Button
          label="Remove"
          size="small"
          type="secondary"
          variation="destructive"
          onClick={handleRemove}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export default InputAvatar;
