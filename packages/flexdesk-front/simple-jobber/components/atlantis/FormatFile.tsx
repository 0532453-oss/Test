import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Text } from './Text';
import { Button } from './Button';
import { ConfirmationModal } from './ConfirmationModal';
import { ProgressBar } from './ProgressBar';
import type { FileUpload } from './InputFile';

/**
 * FormatFile - Atlantis-style file display component
 *
 * Displays a file attachment with thumbnail/icon, name, size,
 * and optional delete action. Supports upload progress indication.
 *
 * Based on @jobber/components FormatFile API.
 *
 * @example
 * <FormatFile
 *   file={fileUpload}
 *   onDelete={() => handleDelete(fileUpload.key)}
 *   onClick={() => handlePreview(fileUpload)}
 * />
 *
 * @example
 * // Compact mode (thumbnail only)
 * <FormatFile file={fileUpload} display="compact" />
 */

// ============================================================================
// Types
// ============================================================================

export interface FormatFileProps {
  /** File upload details object (see FileUpload type from InputFile) */
  readonly file: FileUpload;

  /**
   * Display mode: "expanded" shows row with name + size, "compact" shows thumbnail only
   * @default "expanded"
   */
  readonly display?: 'expanded' | 'compact';

  /**
   * The base dimensions of the thumbnail
   * @default "base"
   */
  readonly displaySize?: 'base' | 'large';

  /** Function to execute when the file is clicked (e.g., preview) */
  onClick?(event: React.MouseEvent<HTMLDivElement | HTMLButtonElement>): void;

  /** Callback when the delete action is triggered */
  onDelete?(): void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size < 10 ? size.toFixed(2) : size < 100 ? size.toFixed(1) : Math.round(size)}${units[i]}`;
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function getFileIconName(mimeType: string): 'file' | 'file' {
  // All non-image files use the generic file icon
  return 'file';
}

// ============================================================================
// Thumbnail sizes
// ============================================================================

const THUMBNAIL_SIZES = {
  base: { width: 54, height: 54 },
  large: { width: 80, height: 80 },
} as const;

// ============================================================================
// FormatFile Component
// ============================================================================

export function FormatFile({
  file,
  display = 'expanded',
  displaySize = 'base',
  onDelete,
  onClick,
}: FormatFileProps) {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  const isComplete = file.progress >= 1;
  const fileSize = formatFileSize(file.size);
  const isImage = isImageType(file.type);
  const thumbSize = THUMBNAIL_SIZES[displaySize];

  // Load thumbnail for image files
  useEffect(() => {
    if (isImage && file.src) {
      let cancelled = false;
      file.src().then((src) => {
        if (!cancelled) {
          setThumbnailSrc(src);
        }
      }).catch(() => {
        if (!cancelled) {
          setThumbnailError(true);
        }
      });
      return () => { cancelled = true; };
    }
  }, [file, isImage]);

  const handleDeleteClick = () => {
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
    setDeleteConfirmationOpen(false);
    onDelete?.();
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
  };

  // Determine if the body should be interactive
  const isInteractive = isComplete && !!onClick;

  const wrapperStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: display === 'expanded' ? '12px' : '0',
    borderRadius: '8px',
    border: display === 'expanded' ? '1px solid var(--color-border, #DADFE2)' : 'none',
    backgroundColor: display === 'expanded' ? 'var(--color-surface, white)' : 'transparent',
    padding: display === 'expanded' ? '8px' : '0',
    overflow: 'hidden',
    opacity: isComplete ? 1 : 0.7,
    transition: 'opacity 0.2s ease',
  };

  const bodyStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: display === 'expanded' ? '12px' : '0',
    flex: 1,
    minWidth: 0,
    cursor: isInteractive ? 'pointer' : 'default',
    background: 'none',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
    outline: 'none',
  };

  const thumbnailContainerStyles: React.CSSProperties = {
    position: 'relative',
    flexShrink: 0,
    width: thumbSize.width,
    height: thumbSize.height,
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: 'var(--color-surface--background, #E8EDF0)',
  };

  const thumbnailImageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  };

  const iconPlaceholderStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text--secondary, #7C8B96)',
  };

  const contentBlockStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  // Render thumbnail content
  const renderThumbnail = () => {
    if (isImage && thumbnailSrc && !thumbnailError) {
      return (
        <img
          src={thumbnailSrc}
          alt={file.name}
          style={thumbnailImageStyles}
          onError={() => setThumbnailError(true)}
        />
      );
    }
    return (
      <div style={iconPlaceholderStyles}>
        <Icon name={getFileIconName(file.type)} size="base" />
      </div>
    );
  };

  // Render progress bar (when uploading)
  const renderProgress = () => {
    if (isComplete) return null;
    return (
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <ProgressBar
          currentStep={Math.round(file.progress * 100)}
          totalSteps={100}
          size="smaller"
        />
      </div>
    );
  };

  // Render expanded details (file name + size)
  const renderExpandedDetails = () => {
    if (display !== 'expanded') return null;
    return (
      <div style={contentBlockStyles}>
        <Text size="base" maxLines="single">{file.name}</Text>
        <Text size="small" variation="subdued">{fileSize}</Text>
      </div>
    );
  };

  // Render delete button
  const renderDeleteButton = () => {
    if (!isComplete || !onDelete) return null;
    return (
      <div style={{ flexShrink: 0 }}>
        <Button
          type="tertiary"
          variation="destructive"
          size="small"
          icon="trash"
          ariaLabel="Delete file"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleDeleteClick();
          }}
        />
        <ConfirmationModal
          title="Confirm Deletion"
          message="Are you sure you want to delete this file?"
          confirmLabel="Delete"
          variation="destructive"
          open={deleteConfirmationOpen}
          onConfirm={handleConfirmDelete}
          onRequestClose={handleCancelDelete}
        />
      </div>
    );
  };

  const BodyTag = isInteractive ? 'button' : 'div';

  return (
    <div style={wrapperStyles}>
      <BodyTag
        type={isInteractive ? 'button' : undefined}
        style={bodyStyles}
        onClick={isComplete ? onClick : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-busy={!isComplete}
      >
        {/* Thumbnail */}
        <div style={thumbnailContainerStyles}>
          {renderThumbnail()}
          {renderProgress()}
        </div>

        {/* File name and size */}
        {renderExpandedDetails()}
      </BodyTag>

      {/* Delete button */}
      {renderDeleteButton()}
    </div>
  );
}

export default FormatFile;
