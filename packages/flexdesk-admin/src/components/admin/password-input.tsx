import type { InputProps } from "ra-core";
import { useInput, useResourceContext, FieldTitle } from "ra-core";
import {
  FormControl,
  FormError,
  FormField,
  FormLabel,
} from "@/components/admin/form";
import { InputPassword } from "@/components/atlantis";
import { InputHelperText } from "@/components/admin/input-helper-text";

export type PasswordInputProps = InputProps & {
  className?: string;
  inputClassName?: string;
} & Partial<Pick<React.ComponentProps<typeof InputPassword>, 'placeholder' | 'autoFocus' | 'hasVisibility' | 'autocomplete'>>;

/**
 * Password input with optional visibility toggle using Atlantis InputPassword component.
 *
 * Use `<PasswordInput>` for password fields. Provides:
 * - Secure password masking
 * - Optional visibility toggle (show/hide password)
 * - Proper input type for password managers
 * - Autocomplete support for current-password or new-password
 *
 * @see {@link https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputpassword--docs InputPassword documentation}
 *
 * @example
 * import { Edit, SimpleForm, PasswordInput } from '@/components/admin';
 *
 * const UserEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <PasswordInput source="password" hasVisibility />
 *     </SimpleForm>
 *   </Edit>
 * );
 *
 * @example
 * // Login form usage
 * <PasswordInput
 *   source="password"
 *   label="Password"
 *   hasVisibility
 *   autocomplete="current-password"
 * />
 */
export const PasswordInput = (props: PasswordInputProps) => {
  const resource = useResourceContext(props);
  const {
    label,
    source,
    className,
    inputClassName,
    helperText,
    placeholder,
    autoFocus,
    hasVisibility = true, // Default to true for better UX
    autocomplete = 'current-password',
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
        <InputPassword
          id={id}
          name={field.name}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          hasVisibility={hasVisibility}
          autocomplete={autocomplete}
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
