import type { InputProps } from 'ra-core'
import { useInput, useResourceContext, FieldTitle } from 'ra-core'
import {
  FormControl,
  FormError,
  FormField,
  FormLabel,
} from '@/components/admin/form'
import { InputPhoneNumber, validatePhoneNumber } from '@/atlantis'
import { InputHelperText } from '@/components/admin/input-helper-text'

export type PhoneInputProps = InputProps & {
  className?: string
  inputClassName?: string
  pattern?: string
} & Partial<Pick<React.ComponentProps<typeof InputPhoneNumber>, 'placeholder' | 'autoFocus'>>

/**
 * Phone input with built-in phone formatting using Atlantis InputPhoneNumber component.
 */
export const PhoneInput = (props: PhoneInputProps) => {
  const resource = useResourceContext(props)
  const {
    label,
    source,
    className,
    inputClassName,
    helperText,
    placeholder,
    autoFocus,
    pattern,
    validate: _validateProp,
    format: _formatProp,
    ...rest
  } = props
  const { id, field, isRequired, fieldState } = useInput(props)

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
        <InputPhoneNumber
          id={id}
          name={field.name}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          pattern={pattern}
          required={isRequired}
          invalid={!!fieldState.error}
          className={inputClassName}
          {...rest}
        />
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  )
}

export { validatePhoneNumber }
