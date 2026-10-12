/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback } from 'react'
import { Checkbox } from '@/atlantis'
import { FormError, FormField } from '@/components/admin/form'
import { useInput, FieldTitle } from 'ra-core'
import { InputHelperText } from './input-helper-text'

/**
 * Checkbox input for boolean (true/false) values.
 */
export const BooleanInput = (props: BooleanInputProps) => {
  const {
    className,
    defaultValue = false,
    format,
    label,
    helperText,
    onBlur,
    onChange,
    onFocus,
    readOnly,
    disabled,
    parse,
    resource,
    source,
    validate,
    ...rest
  } = props
  const { id, field, isRequired, fieldState } = useInput({
    defaultValue,
    format,
    parse,
    resource,
    source,
    onBlur,
    onChange,
    type: 'checkbox',
    validate,
    disabled,
    readOnly,
    ...rest,
  })

  const handleChange = useCallback(
    (checked: boolean) => {
      field.onChange(checked)
      field.onBlur()
    },
    [field]
  )

  const checkboxLabel = label ? (
    <FieldTitle
      label={label}
      source={source}
      resource={resource}
      isRequired={isRequired}
    />
  ) : undefined

  return (
    <FormField className={className} id={id} name={field.name}>
      <Checkbox
        id={id}
        checked={Boolean(field.value)}
        onChange={handleChange}
        disabled={disabled || readOnly}
        invalid={fieldState?.invalid}
        label={checkboxLabel}
      />
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  )
}

export interface BooleanInputProps {
  className?: string
  defaultValue?: boolean
  format?: (value: any) => any
  helperText?: React.ReactNode
  label?: React.ReactNode
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  onChange?: (value: any) => void
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
  readOnly?: boolean
  disabled?: boolean
  parse?: (value: any) => any
  resource?: string
  source: string
  validate?: any
}
