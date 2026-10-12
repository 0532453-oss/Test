import type { InputProps } from "ra-core";
import { useInput, useResourceContext, FieldTitle } from "ra-core";
import {
  FormControl,
  FormError,
  FormField,
  FormLabel,
} from "@/components/admin/form";
import { InputEmail, validateEmail } from "@/components/atlantis";
import { InputHelperText } from "@/components/admin/input-helper-text";

export type EmailInputProps = InputProps & {
  className?: string;
  inputClassName?: string;
} & Partial<Pick<React.ComponentProps<typeof InputEmail>, 'placeholder' | 'autoFocus'>>;

/**
 * Email input with built-in email validation using Atlantis InputEmail component.
 *
 * Use `<EmailInput>` for email address fields. Provides:
 * - Built-in email format validation
 * - Email icon prefix
 * - Proper input type for mobile keyboards
 * - Autocomplete support
 *
 * @see {@link https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputemail--docs InputEmail documentation}
 *
 * @example
 * import { Edit, SimpleForm, EmailInput } from '@/components/admin';
 *
 * const ClientEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <EmailInput source="email" />
 *     </SimpleForm>
 *   </Edit>
 * );
 */
export const EmailInput = (props: EmailInputProps) => {
  const resource = useResourceContext(props);
  const {
    label,
    source,
    className,
    inputClassName,
    helperText,
    placeholder,
    autoFocus,
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
        <InputEmail
          id={id}
          name={field.name}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
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

// Re-export validateEmail utility for use in form validation
export { validateEmail };
