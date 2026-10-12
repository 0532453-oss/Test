/**
 * AtlantisSimpleForm - React Admin form with Atlantis Form behavior
 */
import * as React from 'react'
import type { ReactNode } from 'react'
import { Children, useEffect, useRef } from 'react'
import type { FormProps } from 'ra-core'
import { Form } from 'ra-core'
import { useFormState, useFormContext } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { Button as AtlantisButton } from '@/atlantis'
import type { AtlantisFormState } from '@/atlantis'

// Re-export for backwards compatibility
export type { AtlantisFormState }

export interface AtlantisSimpleFormProps extends Omit<FormProps, 'children'> {
  children: ReactNode
  className?: string
  toolbar?: ReactNode
  onStateChange?: (state: AtlantisFormState) => void
}

/**
 * Internal component to track form state changes
 */
function FormStateTracker({
  onStateChange,
}: {
  onStateChange?: (state: AtlantisFormState) => void
}) {
  const { isDirty, isSubmitting, isValid, touchedFields } = useFormState()
  const isTouched = Object.keys(touchedFields).length > 0

  const prevStateRef = useRef<AtlantisFormState | null>(null)

  useEffect(() => {
    if (!onStateChange) return

    const currentState: AtlantisFormState = {
      isDirty,
      isSubmitting,
      isValid,
      isTouched,
    }

    const prevState = prevStateRef.current
    if (
      !prevState ||
      prevState.isDirty !== currentState.isDirty ||
      prevState.isSubmitting !== currentState.isSubmitting ||
      prevState.isValid !== currentState.isValid ||
      prevState.isTouched !== currentState.isTouched
    ) {
      onStateChange(currentState)
      prevStateRef.current = currentState
    }
  }, [isDirty, isSubmitting, isValid, isTouched, onStateChange])

  return null
}

/**
 * A form layout with Atlantis Form behavior and React Admin integration.
 */
export const AtlantisSimpleForm = ({
  children,
  className,
  toolbar = defaultFormToolbar,
  onStateChange,
  ...rest
}: AtlantisSimpleFormProps) => (
  <Form
    className={cn(`flex flex-col gap-4 w-full`, className)}
    {...rest}
  >
    <FormStateTracker onStateChange={onStateChange} />
    {children}
    {toolbar}
  </Form>
)

/**
 * A sticky form toolbar with default Cancel and Save buttons.
 */
export const AtlantisFormToolbar = ({
  children,
  className,
  ...rest
}: AtlantisFormToolbarProps) => {
  const navigate = useNavigate()

  return (
    <div
      {...rest}
      className={cn(
        'sticky pt-4 pb-4 md:block md:pt-2 md:pb-0 bottom-0 bg-linear-to-b from-transparent to-background to-10%',
        className
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
  )
}

export interface AtlantisFormToolbarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  className?: string
}

const defaultFormToolbar = <AtlantisFormToolbar />

// Re-export useFormContext for convenience
export { useFormContext }
