/**
 * AtlantisSimpleForm - React Admin form with Atlantis Form behavior
 *
 * This wraps React Admin's Form component to provide Atlantis-style form handling
 * with onStateChange callback for dirty tracking and consistent styling.
 *
 * @see SimpleForm for the base implementation
 */
import * as React from "react";
import type { ReactNode } from "react";
import { Children, useEffect, useRef } from "react";
import type { FormProps } from "ra-core";
import { Form } from "ra-core";
import { useFormState, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { Button as AtlantisButton } from "../atlantis";

// Import AtlantisFormState from the Atlantis component library
import type { AtlantisFormState } from "../atlantis";
// Re-export for backwards compatibility
export type { AtlantisFormState };

export interface AtlantisSimpleFormProps extends Omit<FormProps, "children"> {
  /**
   * Form children (fields and content)
   */
  children: ReactNode;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Custom toolbar component
   */
  toolbar?: ReactNode;

  /**
   * Called when form state changes (dirty, valid, etc.)
   * Useful for tracking unsaved changes and enabling/disabling actions
   */
  onStateChange?: (state: AtlantisFormState) => void;
}

/**
 * Internal component to track form state changes
 */
function FormStateTracker({
  onStateChange,
}: {
  onStateChange?: (state: AtlantisFormState) => void;
}) {
  const { isDirty, isSubmitting, isValid, touchedFields } = useFormState();
  const isTouched = Object.keys(touchedFields).length > 0;

  const prevStateRef = useRef<AtlantisFormState | null>(null);

  useEffect(() => {
    if (!onStateChange) return;

    const currentState: AtlantisFormState = {
      isDirty,
      isSubmitting,
      isValid,
      isTouched,
    };

    // Only call onStateChange if state actually changed
    const prevState = prevStateRef.current;
    if (
      !prevState ||
      prevState.isDirty !== currentState.isDirty ||
      prevState.isSubmitting !== currentState.isSubmitting ||
      prevState.isValid !== currentState.isValid ||
      prevState.isTouched !== currentState.isTouched
    ) {
      onStateChange(currentState);
      prevStateRef.current = currentState;
    }
  }, [isDirty, isSubmitting, isValid, isTouched, onStateChange]);

  return null;
}

/**
 * A form layout with Atlantis Form behavior and React Admin integration.
 *
 * Provides form state tracking via onStateChange callback, which is useful for:
 * - Showing unsaved changes warnings
 * - Enabling/disabling navigation
 * - Tracking form progress
 *
 * @example
 * ```tsx
 * import { Create, AtlantisSimpleForm, TextInput } from '@/components/admin';
 *
 * const PostCreate = () => {
 *   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
 *
 *   return (
 *     <Create>
 *       <AtlantisSimpleForm
 *         onStateChange={(state) => setHasUnsavedChanges(state.isDirty)}
 *       >
 *         <TextInput source="title" />
 *         <TextInput source="body" />
 *       </AtlantisSimpleForm>
 *     </Create>
 *   );
 * };
 * ```
 */
export const AtlantisSimpleForm = ({
  children,
  className,
  toolbar = defaultFormToolbar,
  onStateChange,
  ...rest
}: AtlantisSimpleFormProps) => (
  <Form
    className={cn(`flex flex-col gap-4 w-full max-w-lg`, className)}
    {...rest}
  >
    <FormStateTracker onStateChange={onStateChange} />
    {children}
    {toolbar}
  </Form>
);

/**
 * A sticky form toolbar with default Cancel and Save buttons.
 *
 * Provides a consistent action bar for forms that sticks to the bottom of the viewport.
 */
export const AtlantisFormToolbar = ({
  children,
  className,
  ...rest
}: AtlantisFormToolbarProps) => {
  const navigate = useNavigate();

  return (
    <div
      {...rest}
      className={cn(
        "sticky pt-4 pb-4 md:block md:pt-2 md:pb-0 bottom-0 bg-linear-to-b from-transparent to-background to-10%",
        className,
      )}
      role="toolbar"
    >
      {Children.count(children) === 0 ? (
        <div className="flex flex-row gap-3 justify-end">
          <AtlantisButton
            type="secondary"
            size="base"
            label="Cancel"
            onClick={() => navigate(-1)}
          />
          <AtlantisButton
            type="primary"
            size="base"
            label="Save"
            submit
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export interface AtlantisFormToolbarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

const defaultFormToolbar = <AtlantisFormToolbar />;
