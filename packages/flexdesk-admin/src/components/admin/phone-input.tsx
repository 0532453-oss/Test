import type { InputProps } from "ra-core";
import { useInput, useResourceContext, FieldTitle } from "ra-core";
import {
  FormControl,
  FormError,
  FormField,
  FormLabel,
} from "@/components/admin/form";
import { InputPhoneNumber, validatePhoneNumber } from "@/components/atlantis";
import { InputHelperText } from "@/components/admin/input-helper-text";

export type PhoneInputProps = InputProps & {
  className?: string;
  inputClassName?: string;
  /**
   * Phone number format pattern
   * Use * as placeholder for digits
   * @default "(***) ***-****"
   */
  pattern?: string;
} & Partial<Pick<React.ComponentProps<typeof InputPhoneNumber>, 'placeholder' | 'autoFocus'>>;

/**
 * Phone input with built-in phone formatting using Atlantis InputPhoneNumber component.
 *
 * Use `<PhoneInput>` for phone number fields. Provides:
 * - Automatic phone number formatting as you type
 * - Phone icon prefix
 * - Proper input type for mobile keyboards
 * - Autocomplete support
 *
 * @see {@link https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputphonenumber--docs InputPhoneNumber documentation}
 *
 * @example
 * import { Edit, SimpleForm, PhoneInput } from '@/components/admin';
 *
 * const ClientEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <PhoneInput source="phone" />
 *     </SimpleForm>
 *   </Edit>
 * );
 *
 * @example
 * // With custom pattern
 * <PhoneInput source="phone" pattern="***-***-****" />
 */
export const PhoneInput = (props: PhoneInputProps) => {
  const resource = useResourceContext(props);
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
  } = props;
  const { id, field, isRequired, fieldState } = useInput(props);

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
  );
};

// Re-export validatePhoneNumber utility for use in form validation
export { validatePhoneNumber };
