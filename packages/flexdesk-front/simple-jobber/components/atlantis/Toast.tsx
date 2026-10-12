import * as React from 'react';
import { useEffect, useCallback, useRef, createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconNames } from './Icon';
import { Text } from './Text';
import { ButtonDismiss } from './ButtonDismiss';

/**
 * Toast Position - where toasts appear on screen
 */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Toast Variation - determines the color and icon of the toast
 */
export type ToastVariation = 'success' | 'error' | 'warning' | 'info';

/**
 * Action configuration for toast with undo/action button
 */
export interface ToastAction {
  /** Label for the action button */
  label: string;
  /** Callback when action button is clicked */
  onClick: () => void;
}

/**
 * Individual toast configuration
 */
export interface ToastConfig {
  /** Unique identifier for the toast */
  id: string;
  /** Toast message content */
  message: React.ReactNode;
  /** Visual variation of the toast */
  variation: ToastVariation;
  /** Duration in milliseconds before auto-dismiss (0 for no auto-dismiss) */
  duration: number;
  /** Optional action button (e.g., for undo) */
  action?: ToastAction;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Callback when toast auto-closes */
  onAutoClose?: () => void;
  /** Whether the toast can be dismissed by clicking X */
  dismissible?: boolean;
  /** Timestamp when toast was created */
  createdAt: number;
}

/**
 * Props for the Toast component (individual toast item)
 */
export interface ToastProps {
  /** Toast configuration */
  toast: ToastConfig;
  /** Position for determining animation direction */
  position: ToastPosition;
  /** Callback to remove the toast */
  onRemove: (id: string) => void;
}

/**
 * Props for the Toaster component (container)
 */
export interface ToasterProps {
  /** Position where toasts appear */
  position?: ToastPosition;
  /** Default duration for toasts in milliseconds */
  duration?: number;
  /** Maximum number of toasts to show at once */
  maxToasts?: number;
  /** Whether to show close button on toasts */
  closeButton?: boolean;
  /** Use rich colors (more saturated) */
  richColors?: boolean;
  /** Theme for the toaster */
  theme?: 'light' | 'dark' | 'system';
}

/**
 * Context value for toast functionality
 */
export interface ToastContextValue {
  /** Add a toast */
  toast: {
    (message: React.ReactNode, options?: Partial<Omit<ToastConfig, 'id' | 'message' | 'createdAt'>>): string;
    success: (message: React.ReactNode, options?: ToastOptions) => string;
    error: (message: React.ReactNode, options?: ToastOptions) => string;
    warning: (message: React.ReactNode, options?: ToastOptions) => string;
    info: (message: React.ReactNode, options?: ToastOptions) => string;
    dismiss: (id?: string) => void;
  };
}

/**
 * Options when creating a toast
 */
export interface ToastOptions {
  /** Duration in milliseconds before auto-dismiss */
  duration?: number;
  /** Optional action button */
  action?: ToastAction;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Callback when toast auto-closes */
  onAutoClose?: () => void;
  /** Whether the toast can be dismissed */
  dismissible?: boolean;
}

// Toast Context
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access toast functionality
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Icon mapping for variations
const variationIcons: Record<ToastVariation, IconNames> = {
  success: 'checkmark',
  error: 'warning',
  warning: 'warning',
  info: 'info',
};

// Color classes for variations (rich colors) using Atlantis design tokens
const variationColorsRich: Record<ToastVariation, string> = {
  success: 'bg-[--color-success] text-[--color-text--reverse] border-[--color-success]',
  error: 'bg-[--color-critical] text-[--color-text--reverse] border-[--color-critical]',
  warning: 'bg-[--color-warning] text-[--color-text] border-[--color-warning]',
  info: 'bg-[--color-informative] text-[--color-text--reverse] border-[--color-informative]',
};

// Color classes for variations (subtle colors) using Atlantis design tokens
const variationColorsSubtle: Record<ToastVariation, string> = {
  success: 'bg-[--color-success--surface] text-[--color-success--text] border-[--color-success--border]',
  error: 'bg-[--color-critical--surface] text-[--color-critical--text] border-[--color-critical--border]',
  warning: 'bg-[--color-warning--surface] text-[--color-warning--text] border-[--color-warning--border]',
  info: 'bg-[--color-informative--surface] text-[--color-informative--text] border-[--color-informative--border]',
};

// Icon colors for subtle mode using Atlantis design tokens
const iconColorsSubtle: Record<ToastVariation, string> = {
  success: 'text-[--color-success--text]',
  error: 'text-[--color-critical--text]',
  warning: 'text-[--color-warning--text]',
  info: 'text-[--color-informative--text]',
};

// Animation classes based on position
const getAnimationClass = (position: ToastPosition, entering: boolean): string => {
  if (entering) {
    if (position.includes('top')) {
      return 'animate-in slide-in-from-top-2 fade-in duration-200';
    }
    return 'animate-in slide-in-from-bottom-2 fade-in duration-200';
  }
  return 'animate-out fade-out slide-out-to-right duration-150';
};

/**
 * Individual Toast component
 */
const ToastItem: React.FC<ToastProps & { richColors: boolean; closeButton: boolean }> = ({
  toast,
  position,
  onRemove,
  richColors,
  closeButton,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Handle auto-close
  useEffect(() => {
    if (toast.duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose(true);
      }, toast.duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toast.duration, toast.id]);

  const handleClose = useCallback((isAutoClose = false) => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
      if (isAutoClose && toast.onAutoClose) {
        toast.onAutoClose();
      } else if (!isAutoClose && toast.onDismiss) {
        toast.onDismiss();
      }
    }, 150); // Match exit animation duration
  }, [onRemove, toast]);

  const handleAction = useCallback(() => {
    if (toast.action) {
      toast.action.onClick();
      handleClose(false);
    }
  }, [toast.action, handleClose]);

  const colorClasses = richColors
    ? variationColorsRich[toast.variation]
    : variationColorsSubtle[toast.variation];

  const iconColor = richColors ? undefined : iconColorsSubtle[toast.variation];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        min-w-[320px] max-w-[420px]
        ${colorClasses}
        ${getAnimationClass(position, !isExiting)}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${iconColor || ''}`}>
        <Icon name={variationIcons[toast.variation]} size="base" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {toast.message}
        </div>

        {/* Action button */}
        {toast.action && (
          <button
            onClick={handleAction}
            className={`
              mt-2 text-sm font-semibold underline underline-offset-2
              hover:opacity-80 transition-opacity
              ${richColors ? '' : 'text-current'}
            `}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {(closeButton || toast.dismissible !== false) && (
        <button
          onClick={() => handleClose(false)}
          className={`
            flex-shrink-0 p-1 rounded-lg
            hover:bg-[--color-surface--hover]
            transition-colors -mr-1 -mt-1
          `}
          aria-label="Dismiss"
        >
          <Icon name="cross" size="small" />
        </button>
      )}
    </div>
  );
};

// Position classes for the container
const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
};

/**
 * Global toast state for imperative API
 */
let toastState: {
  toasts: ToastConfig[];
  setToasts: React.Dispatch<React.SetStateAction<ToastConfig[]>>;
  options: Required<ToasterProps>;
} | null = null;

let toastIdCounter = 0;

/**
 * Create a unique toast ID
 */
const createToastId = () => `toast-${++toastIdCounter}`;

/**
 * Imperative toast API
 */
export const toast = Object.assign(
  (message: React.ReactNode, options?: Partial<Omit<ToastConfig, 'id' | 'message' | 'createdAt'>>): string => {
    const id = createToastId();
    const config: ToastConfig = {
      id,
      message,
      variation: options?.variation ?? 'info',
      duration: options?.duration ?? toastState?.options.duration ?? 4000,
      action: options?.action,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
      dismissible: options?.dismissible,
      createdAt: Date.now(),
    };

    if (toastState) {
      toastState.setToasts((prev) => {
        const newToasts = [...prev, config];
        // Limit to maxToasts
        const maxToasts = toastState!.options.maxToasts;
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts);
        }
        return newToasts;
      });
    }

    return id;
  },
  {
    success: (message: React.ReactNode, options?: ToastOptions): string => {
      return toast(message, { ...options, variation: 'success' });
    },
    error: (message: React.ReactNode, options?: ToastOptions): string => {
      return toast(message, { ...options, variation: 'error' });
    },
    warning: (message: React.ReactNode, options?: ToastOptions): string => {
      return toast(message, { ...options, variation: 'warning' });
    },
    info: (message: React.ReactNode, options?: ToastOptions): string => {
      return toast(message, { ...options, variation: 'info' });
    },
    dismiss: (id?: string): void => {
      if (toastState) {
        if (id) {
          toastState.setToasts((prev) => prev.filter((t) => t.id !== id));
        } else {
          toastState.setToasts([]);
        }
      }
    },
  }
);

/**
 * Toaster - Container component that renders toasts
 *
 * @example
 * ```tsx
 * // Add Toaster to your app root
 * <Toaster position="bottom-center" richColors />
 *
 * // Use the toast function anywhere
 * toast.success('Operation completed!');
 * toast.error('Something went wrong');
 * toast.warning('Please check your input');
 * toast.info('New update available');
 *
 * // With action button (e.g., for undo)
 * toast.success('Item deleted', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => undoDelete(),
 *   },
 * });
 * ```
 */
export const Toaster: React.FC<ToasterProps> = ({
  position = 'bottom-center',
  duration = 4000,
  maxToasts = 5,
  closeButton = true,
  richColors = false,
  theme = 'system',
}) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const [mounted, setMounted] = useState(false);

  // Register global state
  useEffect(() => {
    toastState = {
      toasts,
      setToasts,
      options: { position, duration, maxToasts, closeButton, richColors, theme },
    };

    return () => {
      toastState = null;
    };
  }, [position, duration, maxToasts, closeButton, richColors, theme]);

  // Update toasts in global state
  useEffect(() => {
    if (toastState) {
      toastState.toasts = toasts;
    }
  }, [toasts]);

  // Client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Context value for hook-based API
  const contextValue: ToastContextValue = {
    toast,
  };

  if (!mounted) {
    return null;
  }

  const toastContainer = (
    <div
      className={`fixed z-[9999] flex flex-col gap-2 pointer-events-none ${positionClasses[position]}`}
      aria-label="Notifications"
      role="region"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem
            toast={t}
            position={position}
            onRemove={handleRemove}
            richColors={richColors}
            closeButton={closeButton}
          />
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {createPortal(toastContainer, document.body)}
    </ToastContext.Provider>
  );
};

/**
 * Toast Provider - Alternative to Toaster for context-based usage
 */
export const ToastProvider: React.FC<ToasterProps & { children: React.ReactNode }> = ({
  children,
  ...toasterProps
}) => {
  return (
    <>
      {children}
      <Toaster {...toasterProps} />
    </>
  );
};

export default toast;
