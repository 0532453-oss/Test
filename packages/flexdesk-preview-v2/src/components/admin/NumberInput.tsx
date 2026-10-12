import type { InputProps } from 'ra-core'
import { useInput, useResourceContext, FieldTitle } from 'ra-core'
import {
  FormControl,
  FormError,
  FormField,
  FormLabel,
} from '@/components/admin/form'
import { Input } from '@/components/ui/input'
import { InputHelperText } from '@/components/admin/input-helper-text'

export type NumberInputProps = InputProps & {
  min?: number
  max?: number
  step?: number
  inputClassName?: string
} & Omit<React.ComponentProps<'input'>, 'type'>

/**
 * Number input for numeric values.
 */
export const NumberInput = (props: NumberInputProps) => {
  const resource = useResourceContext(props)
  const {
    label,
    source,
    className,
    inputClassName,
    helperText,
    min,
    max,
    step,
    validate: _validateProp,
    format: _formatProp,
    ...rest
  } = props
  const { id, field, isRequired, fieldState } = useInput({
    ...props,
    // Convert string input to number for form state
    parse: (value: string) => {
      if (value === '' || value === null || value === undefined) return null
      const parsed = parseFloat(value)
      return isNaN(parsed) ? null : parsed
    },
    // Convert number to string for input display
    format: (value: number | null | undefined) => {
      if (value === null || value === undefined) return ''
      return String(value)
    },
  })

  return (
    <FormField id={id} className={className} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle
            label={label}
            source={source}
            resource={resource}
            isRequired={isRequired}
          />
        </FormLabel>
      )}
      <FormControl>
        <Input
          {...rest}
          {...field}
          type="number"
          min={min}
          max={max}
          step={step}
          className={inputClassName}
          aria-invalid={fieldState.invalid}
        />
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  )
}
