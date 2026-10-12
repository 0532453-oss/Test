import { useTranslate } from "ra-core";
import * as React from "react";
import { type ComponentType, type MouseEventHandler, useCallback } from "react";

import { ConfirmationModal } from "@/components/atlantis";

/**
 * Generic confirmation dialog component for destructive actions.
 *
 * Displays a dialog with customizable title, content, and action buttons.
 * Used internally for delete operations and other confirmations.
 * Supports custom icons, button labels, and loading states.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/confirm Confirm documentation}
 *
 * @example
 * import { useState } from "react";
 * import { useDelete, useRecordContext, useResourceContext, useRedirect } from "ra-core";
 * import { Button } from "@/components/ui/button";
 * import { Confirm } from "@/components/admin/confirm";
 *
 * const DeleteButton = () => {
 *   const resource = useResourceContext();
 *   const record = useRecordContext();
 *   const [isOpen, setIsOpen] = useState(false);
 *   const [deleteOne, { isPending }] = useDelete();
 *   const redirect = useRedirect();
 *
 *   const handleDelete = () => {
 *     deleteOne(
 *       resource,
 *       { id: record?.id, previousData: record },
 *       {
 *         onSuccess: () => {
 *           setIsOpen(false);
 *           redirect("list", resource);
 *         },
 *       },
 *     );
 *   };
 *
 *   return (
 *     <>
 *       <Button variant="destructive" onClick={() => setIsOpen(true)}>
 *         Delete
 *       </Button>
 *       <Confirm
 *         isOpen={isOpen}
 *         title="Are you sure you want to delete this element?"
 *         content="This action cannot be undone."
 *         onConfirm={handleDelete}
 *         onClose={() => setIsOpen(false)}
 *         loading={isPending}
 *       />
 *     </>
 *   );
 * };
 */
export const Confirm = (props: ConfirmProps) => {
  const {
    className,
    isOpen = false,
    loading,
    title,
    content,
    cancel = "ra.action.cancel",
    confirm = "ra.action.confirm",
    confirmColor = "primary",
    ConfirmIcon,
    CancelIcon,
    onClose,
    onConfirm,
    translateOptions = {},
    titleTranslateOptions = translateOptions,
    contentTranslateOptions = translateOptions,
  } = props;

  const translate = useTranslate();

  const handleConfirm = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      e?.stopPropagation();
      onConfirm(e as React.MouseEvent<HTMLButtonElement>);
    },
    [onConfirm],
  );

  const translatedTitle =
    typeof title === "string"
      ? translate(title, { _: title, ...titleTranslateOptions })
      : title;

  const translatedContent =
    typeof content === "string"
      ? translate(content, { _: content, ...contentTranslateOptions })
      : content;

  // Convert React.ReactNode content to string if possible, or use children prop
  const messageString =
    typeof translatedContent === "string" ? translatedContent : undefined;
  const contentElement =
    typeof translatedContent !== "string" ? translatedContent : undefined;

  const sharedProps = {
    open: isOpen,
    onRequestClose: onClose,
    onConfirm: () => handleConfirm(),
    onCancel: onClose,
    title: typeof translatedTitle === "string" ? translatedTitle : undefined,
    confirmLabel: translate(confirm, { _: confirm }),
    cancelLabel: translate(cancel, { _: cancel }),
    variation: confirmColor === "warning" ? "destructive" as const : "work" as const,
    loading,
    size: "small" as const,
  };

  if (messageString) {
    return <ConfirmationModal {...sharedProps} message={messageString} />;
  }

  return (
    <ConfirmationModal {...sharedProps}>
      {contentElement}
    </ConfirmationModal>
  );
};

export interface ConfirmProps {
  cancel?: string;
  className?: string;
  confirm?: string;
  confirmColor?: "primary" | "warning";
  ConfirmIcon?: ComponentType;
  CancelIcon?: ComponentType;
  content?: React.ReactNode;
  isOpen?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: MouseEventHandler;
  title: React.ReactNode;
  /**
   * @deprecated use `titleTranslateOptions` and `contentTranslateOptions` instead
   */
  translateOptions?: object;
  titleTranslateOptions?: object;
  contentTranslateOptions?: object;
}
