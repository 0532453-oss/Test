import type { InputProps } from "ra-core";
import { useInput, useResourceContext, FieldTitle } from "ra-core";
import {
  FormControl,
  FormError,
  FormField,
  FormLabel,
} from "@/components/admin/form";
import { Input } from "@/components/ui/input";
import { InputText as AtlantisInputText } from "@/components/atlantis";
import { InputHelperText } from "@/components/admin/input-helper-text";

export type TextInputProps = InputProps & {
  multiline?: boolean;
  inputClassName?: string;
  rows?: number;
} & React.ComponentProps<"textarea"> &
  React.ComponentProps<"input">;

/**
 * Single-line or multiline text input for string values.
 *
 * Use `<TextInput>` for short text fields like titles or names. Set `multiline` to `true`
 * for longer content like descriptions or comments. For multiline, uses Atlantis InputText
 * with multiline prop for consistent styling.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/textinput/ TextInput documentation}
 *
 * @example
 * import { Edit, SimpleForm, TextInput } from '@/components/admin';
 *
 * const PostEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <TextInput source="title" />
 *       <TextInput source="description" multiline rows={4} />
 *     </SimpleForm>
 *   </Edit>
 * );
 */
export const TextInput = (props: TextInputProps) => {
  const resource = useResourceContext(props);
  const {
    label,
    source,
    multiline,
    className,
    inputClassName,
    helperText,
    rows,
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
        {multiline ? (
          <AtlantisInputText
            id={id}
            name={field.name}
            value={field.value ?? ""}
            onNativeChange={field.onChange}
            onBlur={field.onBlur}
            multiline
            rows={rows ?? 3}
            placeholder={rest.placeholder}
            disabled={rest.disabled}
            required={isRequired}
            invalid={fieldState.invalid}
            className={inputClassName}
          />
        ) : (
          <Input {...rest} {...field} className={inputClassName} />
        )}
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
