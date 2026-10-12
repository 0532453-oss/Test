/**
 * LightBox Component - Atlantis-style image viewer overlay
 *
 * Matches @jobber/components LightBox API for consistent patterns.
 * Provides a fullscreen image viewer with navigation, thumbnails,
 * zoom/fullscreen support, and keyboard controls.
 *
 * @see {@link https://atlantis.getjobber.com/components/LightBox Atlantis LightBox documentation}
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ButtonDismiss } from './ButtonDismiss';
import { Text } from './Text';
import { Button } from './Button';
import { Heading } from './Heading';
import { useBreakpoints } from './hooks/useBreakpoints';

// ============================================================================
// Types
// ============================================================================

export interface PresentedImage {
  /** Optional title displayed below the image */
  title?: string;
  /** Optional caption displayed below the title */
  caption?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Image URL (required) */
  url: string;
}

export interface RequestCloseOptions {
  /** Index of the image the user was viewing when LightBox was closed */
  lastPosition: number;
}

export interface LightBoxProps {
  /** Whether the LightBox is open */
  readonly open: boolean;
  /** Array of images to display */
  readonly images: PresentedImage[];
  /** Initial image index to display (default: 0) */
  readonly imageIndex?: number;
  /**
   * Called when the LightBox requests to close.
   * Must set `open` to false. Receives the last viewed image index.
   */
  onRequestClose(options: RequestCloseOptions): void;
}

// ============================================================================
// Constants
// ============================================================================

const MOUSE_HIDE_DELAY = 2000;

// ============================================================================
// LightBox Component
// ============================================================================

export function LightBox({
  open,
  images,
  imageIndex = 0,
  onRequestClose,
}: LightBoxProps) {
  const [currentIndex, setCurrentIndex] = useState(imageIndex);
  const [mouseIsStationary, setMouseIsStationary] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const mouseTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Sync imageIndex when open state or imageIndex prop changes
  useEffect(() => {
    setCurrentIndex(imageIndex);
    setIsZoomed(false);
  }, [imageIndex, open]);

  // Scroll selected thumbnail into view
  useEffect(() => {
    if (!open) return;
    const selected = thumbnailRef.current?.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex, open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleRequestClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleMovePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMoveNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, images.length]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus the lightbox on open
  useEffect(() => {
    if (open && lightboxRef.current) {
      lightboxRef.current.focus();
    }
  }, [open]);

  const handleMovePrevious = useCallback(() => {
    setCurrentIndex((prev: number) => (prev + images.length - 1) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  const handleMoveNext = useCallback(() => {
    setCurrentIndex((prev: number) => (prev + 1) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  const handleRequestClose = useCallback(() => {
    onRequestClose({ lastPosition: currentIndex });
  }, [onRequestClose, currentIndex]);

  const handleThumbnailClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsZoomed(false);
  }, []);

  const handleMouseMove = useCallback(() => {
    setMouseIsStationary(false);
    if (mouseTimerRef.current) {
      clearTimeout(mouseTimerRef.current);
    }
    mouseTimerRef.current = setTimeout(() => {
      setMouseIsStationary(true);
    }, MOUSE_HIDE_DELAY);
  }, []);

  // Cleanup mouse timer
  useEffect(() => {
    return () => {
      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }
    };
  }, []);

  const handleToggleZoom = useCallback(() => {
    setIsZoomed((prev: boolean) => !prev);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleRequestClose();
    }
  }, [handleRequestClose]);

  if (!open) return null;

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  const template = (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-[9999] flex flex-col"
      tabIndex={0}
      aria-label="Lightbox"
      onMouseMove={handleMouseMove}
    >
      {/* Background blur overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Blurred background image */}
      <div
        className="absolute inset-0 bg-center bg-cover opacity-20 blur-2xl"
        style={{ backgroundImage: `url("${currentImage.url}")` }}
      />

      {/* Click-to-close overlay */}
      <div
        className="absolute inset-0"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="text-white/90">
          <Text size="small" element="span">
            {`${currentIndex + 1} / ${images.length}`}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom/Fullscreen toggle */}
          <Button
            ariaLabel={isZoomed ? 'Zoom out' : 'Zoom in'}
            icon={isZoomed ? 'search' : 'search'}
            onClick={handleToggleZoom}
            type="tertiary"
            variation="subtle"
          />
          <ButtonDismiss ariaLabel="Close" onClick={handleRequestClose} />
        </div>
      </div>

      {/* Main image area */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center overflow-hidden px-16"
        onClick={handleBackdropClick}
      >
        <img
          key={currentIndex}
          src={currentImage.url}
          alt={currentImage.alt || currentImage.title || ''}
          className={`
            max-h-full max-w-full object-contain transition-transform duration-300
            ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleZoom();
          }}
          draggable={false}
        />
      </div>

      {/* Navigation arrows */}
      {hasMultipleImages && (
        <>
          <PreviousButton
            onClick={handleMovePrevious}
            hideButton={mouseIsStationary}
          />
          <NextButton
            onClick={handleMoveNext}
            hideButton={mouseIsStationary}
          />
        </>
      )}

      {/* Caption */}
      {(currentImage.title || currentImage.caption) && (
        <div className="relative z-10 text-center px-4 py-2">
          {currentImage.title && (
            <div className="text-white">
              <Heading level={4}>{currentImage.title}</Heading>
            </div>
          )}
          {currentImage.caption && (
            <div className="text-white/80">
              <Text size="base">{currentImage.caption}</Text>
            </div>
          )}
        </div>
      )}

      {/* Thumbnail bar */}
      {hasMultipleImages && (
        <div
          ref={thumbnailRef}
          className="relative z-10 flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto"
          data-testid="lightbox-thumbnail-bar"
        >
          {images.map((image, index) => (
            <div
              key={index}
              data-selected={index === currentIndex}
              className={`
                flex-shrink-0 w-14 h-14 rounded-md overflow-hidden cursor-pointer
                border-2 transition-all duration-200
                ${index === currentIndex
                  ? 'border-white opacity-100 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-80'
                }
              `}
              onClick={() => handleThumbnailClick(index)}
            >
              <img
                src={image.url}
                alt={image.alt || image.title || ''}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return isMounted
    ? ReactDOM.createPortal(template, document.body)
    : template;
}

// ============================================================================
// Navigation Button Components
// ============================================================================

interface NavButtonProps {
  readonly onClick: () => void;
  readonly hideButton: boolean;
}

function PreviousButton({ onClick, hideButton }: NavButtonProps) {
  const { mediumAndUp } = useBreakpoints();

  return (
    <div
      className={`
        absolute left-2 top-1/2 -translate-y-1/2 z-20
        transition-opacity duration-300
        ${hideButton ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <Button
        size={mediumAndUp ? 'large' : 'small'}
        variation="subtle"
        type="secondary"
        icon="arrowLeft"
        ariaLabel="Previous image"
        onClick={onClick}
      />
    </div>
  );
}

function NextButton({ onClick, hideButton }: NavButtonProps) {
  const { mediumAndUp } = useBreakpoints();

  return (
    <div
      className={`
        absolute right-2 top-1/2 -translate-y-1/2 z-20
        transition-opacity duration-300
        ${hideButton ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <Button
        size={mediumAndUp ? 'large' : 'small'}
        variation="subtle"
        type="secondary"
        icon="arrowRight"
        ariaLabel="Next image"
        onClick={onClick}
      />
    </div>
  );
}

export default LightBox;
