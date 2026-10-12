/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback } from "react";
import { Checkbox } from "@/components/atlantis";
import { FormError, FormField } from "@/components/admin/form";
import { useInput, FieldTitle } from "ra-core";
import { InputHelperText } from "./input-helper-text";

/**
 * Checkbox input for boolean (true/false) values.
 *
 * Use `<BooleanInput>` for binary settings like "is published", "is active", or agreement checkboxes.
 * Uses the Atlantis Checkbox component for consistent styling. Note: this input doesn't
 * support `null` values—use `<SelectInput>` for nullable booleans.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/booleaninput/ BooleanInput documentation}
 * @see {@link https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-checkbox--docs Checkbox documentation}
 *
 * @example
 * import {
 *   Edit,
 *   SimpleForm,
 *   BooleanInput,
 *   TextInput,
 * } from '@/components/admin';
 *
 * const PostEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <TextInput source="title" />
 *       <BooleanInput source="is_published" />
 *       <BooleanInput source="allow_comments" />
 *     </SimpleForm>
 *   </Edit>
 * );
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
  } = props;
  const { id, field, isRequired, fieldState } = useInput({
    defaultValue,
    format,
    parse,
    resource,
    source,
    onBlur,
    onChange,
    type: "checkbox",
    validate,
    disabled,
    readOnly,
    ...rest,
  });

  const handleChange = useCallback(
    (checked: boolean) => {
      field.onChange(checked);
      // Ensure field is considered as touched
      field.onBlur();
    },
    [field],
  );

  // Build label with required indicator
  const checkboxLabel = label ? (
    <FieldTitle
      label={label}
      source={source}
      resource={resource}
      isRequired={isRequired}
    />
  ) : undefined;

  return (
    <FormField className={className} id={id} name={field.name}>
      <Checkbox
        id={id}
        checked={Boolean(field.value)}
        onChange={handleChange}
        disabled={disabled || readOnly}
        invalid={fieldState?.invalid}
        label={checkboxLabel}
        onFocus={onFocus}
        onBlur={field.onBlur}
      />
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};

export interface BooleanInputProps {
  className?: string;
  defaultValue?: boolean;
  format?: (value: any) => any;
  helperText?: React.ReactNode;
  label?: React.ReactNode;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onChange?: (value: any) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  disabled?: boolean;
  parse?: (value: any) => any;
  resource?: string;
  source: string;
  validate?: any;
}
