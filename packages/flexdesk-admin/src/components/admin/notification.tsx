import * as React from "react";
import { useCallback, useEffect } from "react";
import {
  Toaster as AtlantisToaster,
  toast as atlantisToast,
  type ToasterProps as AtlantisToasterProps,
  type ToastVariation,
} from "@/components/atlantis";
import { useTheme } from "@/components/admin/theme-provider";
import {
  CloseNotificationContext,
  useNotificationContext,
  useTakeUndoableMutation,
  useTranslate,
} from "ra-core";

/**
 * Props for the Notification component
 */
export interface NotificationProps extends Partial<AtlantisToasterProps> {
  /** Duration in milliseconds for auto-dismiss (default 4000) */
  duration?: number;
}

// Map React Admin notification types to Atlantis toast variations
const typeToVariation: Record<string, ToastVariation> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

/**
 * Displays notifications triggered with the useNotify hook.
 *
 * Supports different notification types (info, success, warning, error) and undoable mutations.
 * Automatically adapts to the current theme (light/dark).
 * Uses the Atlantis Toast component for consistent styling.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/notification Notification documentation}
 * @see {@link https://marmelab.com/ra-core/usenotify/ useNotify hook}
 *
 * @example
 * // Trigger a notification
 * import { useNotify } from 'ra-core';
 *
 * const NotifyButton = () => {
 *   const notify = useNotify();
 *   const handleClick = () => {
 *     notify('Comment approved', { type: 'success' });
 *   };
 *   return <button onClick={handleClick}>Notify</button>;
 * };
 */
export const Notification = ({
  duration = 4000,
  position = "bottom-center",
  ...props
}: NotificationProps) => {
  const translate = useTranslate();
  const { notifications, takeNotification } = useNotificationContext();
  const takeMutation = useTakeUndoableMutation();
  const { theme } = useTheme();

  useEffect(() => {
    if (notifications.length) {
      const notification = takeNotification();
      if (notification) {
        const { message, type = "info", notificationOptions } = notification;
        const { messageArgs, undoable } = notificationOptions || {};

        const beforeunload = (e: BeforeUnloadEvent) => {
          e.preventDefault();
          const confirmationMessage = "";
          e.returnValue = confirmationMessage;
          return confirmationMessage;
        };

        if (undoable) {
          window.addEventListener("beforeunload", beforeunload);
        }

        const mutation = takeMutation();

        const handleExited = () => {
          if (undoable) {
            if (mutation) {
              mutation({ isUndo: false });
            }
            window.removeEventListener("beforeunload", beforeunload);
          }
        };

        const handleUndo = () => {
          if (mutation) {
            mutation({ isUndo: true });
          }
          window.removeEventListener("beforeunload", beforeunload);
        };

        const finalMessage = message
          ? typeof message === "string"
            ? translate(message, messageArgs)
            : React.isValidElement(message)
              ? message
              : undefined
          : undefined;

        // Map to Atlantis toast variation
        const variation = typeToVariation[type] || "info";

        // Use Atlantis toast
        atlantisToast(finalMessage, {
          variation,
          duration,
          action: undoable
            ? {
                label: translate("ra.action.undo"),
                onClick: handleUndo,
              }
            : undefined,
          onDismiss: handleExited,
          onAutoClose: handleExited,
        });
      }
    }
  }, [notifications, takeMutation, takeNotification, translate, duration]);

  const handleRequestClose = useCallback(() => {
    // Dismiss all toasts
    atlantisToast.dismiss();
  }, []);

  return (
    <CloseNotificationContext.Provider value={handleRequestClose}>
      <AtlantisToaster
        richColors
        theme={theme}
        closeButton
        position={position}
        duration={duration}
        {...props}
      />
    </CloseNotificationContext.Provider>
  );
};
