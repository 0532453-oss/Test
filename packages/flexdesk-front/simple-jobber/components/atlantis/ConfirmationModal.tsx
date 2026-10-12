import * as React from "react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useReducer,
  type ReactNode,
  type Ref,
} from "react";
import { Modal, type ModalAction } from "./Modal";
import { Text } from "./Text";

/**
 * State for the ConfirmationModal reducer
 */
interface ConfirmationModalState {
  readonly title?: string;
  readonly message?: string;
  readonly open: boolean;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  onConfirm?(): void;
  onCancel?(): void;
}

interface ConfirmOrCancelAction {
  type: "confirm" | "cancel";
}

interface DisplayAction {
  type: "display";
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm(): void;
  onCancel?(): void;
}

interface ResetAction {
  type: "reset";
  state: ConfirmationModalState;
}

type ConfirmationModalAction =
  | ConfirmOrCancelAction
  | ResetAction
  | DisplayAction;

function confirmationModalReducer(
  state: ConfirmationModalState,
  action: ConfirmationModalAction
): ConfirmationModalState {
  switch (action.type) {
    case "display":
      return {
        ...state,
        title: action.title,
        message: action.message,
        open: true,
        confirmLabel: action.confirmLabel,
        cancelLabel: action.cancelLabel || "Cancel",
        onConfirm: action.onConfirm,
        onCancel: action.onCancel,
      };

    case "confirm":
      return {
        ...state,
        open: false,
      };

    case "cancel":
      return {
        ...state,
        open: false,
      };

    case "reset":
      return { ...state, ...action.state };

    default:
      return state;
  }
}

/**
 * Ref methods exposed by ConfirmationModal for imperative control
 */
export interface ConfirmationModalRef {
  /**
   * Show the confirmation modal with the provided options
   */
  show(props: Omit<DisplayAction, "type">): void;
}

interface BaseConfirmationModalProps {
  /**
   * Title for the modal header
   */
  readonly title?: string;

  /**
   * Text content for the body of the modal.
   * Not displayed if **children** prop is passed.
   */
  readonly message?: string;

  /**
   * Controls if the modal is open or not.
   * When using controlled mode, this prop is required.
   */
  readonly open?: boolean;

  /**
   * Label for the confirm button
   * @default "Confirm"
   */
  readonly confirmLabel?: string;

  /**
   * Label for the cancel button
   * @default "Cancel"
   */
  readonly cancelLabel?: string;

  /**
   * Variation of the confirm button (work for normal, destructive for delete actions)
   * @default "work"
   */
  readonly variation?: "work" | "destructive";

  /**
   * Size of the modal
   * @default "small"
   */
  readonly size?: "small" | "large";

  /**
   * Child components. Displayed instead of message if provided.
   */
  readonly children?: ReactNode;

  /**
   * Whether the confirm action is loading
   */
  readonly loading?: boolean;

  /**
   * Callback for when the confirm button is pressed
   */
  onConfirm?(): void;

  /**
   * Callback for when the cancel button is pressed
   */
  onCancel?(): void;

  /**
   * Callback for whenever a user's action should close the modal
   */
  onRequestClose?(): void;
}

export interface SimpleConfirmationModalProps
  extends BaseConfirmationModalProps {
  readonly open: boolean;
  readonly confirmLabel: string;
}

export interface ComplexConfirmationModalProps
  extends BaseConfirmationModalProps {
  readonly open?: undefined;
}

export interface ChildrenMessage extends BaseConfirmationModalProps {
  message?: never;
  children: ReactNode;
}

export interface StringMessage extends BaseConfirmationModalProps {
  message: string;
  children?: never;
}

export type ConfirmationModalProps =
  | (SimpleConfirmationModalProps & (StringMessage | ChildrenMessage))
  | (ComplexConfirmationModalProps & (StringMessage | ChildrenMessage));

/**
 * ConfirmationModal - A specialized modal for confirm/cancel actions
 *
 * Displays a modal dialog with confirm and cancel buttons, typically used for
 * delete confirmations or other destructive actions that require user confirmation.
 *
 * Can be used in two modes:
 * 1. Controlled mode: Pass `open` prop to control visibility
 * 2. Imperative mode: Use ref to call `show()` method
 *
 * @example Controlled mode
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <ConfirmationModal
 *   open={isOpen}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   confirmLabel="Delete"
 *   variation="destructive"
 *   onConfirm={() => { deleteItem(); setIsOpen(false); }}
 *   onCancel={() => setIsOpen(false)}
 * />
 * ```
 *
 * @example Imperative mode
 * ```tsx
 * const modalRef = useRef<ConfirmationModalRef>(null);
 *
 * const handleDelete = () => {
 *   modalRef.current?.show({
 *     title: "Delete Item",
 *     message: "Are you sure?",
 *     confirmLabel: "Delete",
 *     onConfirm: () => deleteItem(),
 *   });
 * };
 *
 * <ConfirmationModal ref={modalRef} message="" confirmLabel="" />
 * ```
 */
export const ConfirmationModal = forwardRef(function ConfirmationModalInternal(
  {
    title,
    message,
    open = false,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    onRequestClose,
    variation = "work",
    size = "small",
    loading = false,
    children,
  }: ConfirmationModalProps,
  ref: Ref<ConfirmationModalRef>
) {
  const [state, dispatch] = useReducer(confirmationModalReducer, {
    title,
    message,
    open: false,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  });

  // Expose a `show` method through this component's ref for imperative usage
  useImperativeHandle(ref, () => ({
    show: ({
      title: newTitle,
      message: newMessage,
      confirmLabel: newConfirmLabel,
      cancelLabel: newCancelLabel,
      onConfirm: newOnConfirm,
      onCancel: newOnCancel,
    }: Omit<DisplayAction, "type">) => {
      dispatch({
        type: "display",
        title: newTitle,
        message: newMessage,
        confirmLabel: newConfirmLabel,
        cancelLabel: newCancelLabel,
        onConfirm: newOnConfirm,
        onCancel: newOnCancel,
      });
    },
  }));

  // Sync props with internal state
  useEffect(() => {
    dispatch({
      type: "reset",
      state: {
        ...state,
        title,
        message,
        confirmLabel,
        cancelLabel,
        onConfirm,
        onCancel,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, message, confirmLabel, cancelLabel, onConfirm, onCancel]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const isOpen = open || state.open;
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { metaKey, ctrlKey, key, target } = event;

      const shouldTriggerShortcut =
        target instanceof HTMLButtonElement ? metaKey || ctrlKey : true;

      if (!shouldTriggerShortcut) return;

      switch (key) {
        case "Enter": {
          event.preventDefault();
          event.stopPropagation();
          handleAction("confirm")();
          break;
        }
        case "Escape": {
          event.preventDefault();
          event.stopPropagation();
          handleAction("cancel")();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state.open, state.onConfirm, state.onCancel]);

  function handleAction(type: "confirm" | "cancel") {
    return () => {
      if (type === "confirm") {
        state.onConfirm?.();
      } else if (type === "cancel") {
        state.onCancel?.();
      }

      dispatch({ type });
      onRequestClose?.();
    };
  }

  const primaryAction: ModalAction = {
    label: state.confirmLabel,
    onClick: handleAction("confirm"),
    variation: variation === "destructive" ? "destructive" : "work",
    loading,
  };

  const secondaryAction: ModalAction = {
    label: state.cancelLabel,
    onClick: handleAction("cancel"),
    disabled: loading,
  };

  return (
    <Modal
      title={state.title}
      open={open || state.open}
      size={size}
      dismissible={false}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      onRequestClose={handleAction("cancel")}
    >
      {state.message ? (
        <Text variation="subdued">{state.message}</Text>
      ) : (
        children
      )}
    </Modal>
  );
});
