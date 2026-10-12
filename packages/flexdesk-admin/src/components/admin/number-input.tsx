import type { InputProps } from "ra-core";
import { FieldTitle, useInput, useResourceContext } from "ra-core";
import { FormControl, FormField, FormLabel } from "@/components/admin/form";
import { InputNumber as AtlantisInputNumber } from "@/components/atlantis";
import { FormError } from "@/components/admin/form";
import { InputHelperText } from "@/components/admin/input-helper-text";

/**
 * Input component for numeric values (integers and floats) using Atlantis InputNumber.
 *
 * Use `<NumberInput>` for prices, quantities, counts, duration, or any numeric field.
 * Supports min/max constraints and step increments.
 *
 * @see {@link https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputnumber--docs InputNumber documentation}
 *
 * @example
 * import { Edit, SimpleForm, NumberInput, TextInput } from '@/components/admin';
 *
 * const ProductEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <TextInput source="name" />
 *       <NumberInput source="price" step={0.01} min={0} currency />
 *       <NumberInput source="quantity" min={0} />
 *     </SimpleForm>
 *   </Edit>
 * );
 */
export const NumberInput = (props: NumberInputProps) => {
  const {
    label,
    source,
    className,
    inputClassName,
    resource: resourceProp,
    validate: _validateProp,
    format: _formatProp,
    parse: _parseProp,
    helperText,
    min,
    max,
    step,
    currency,
    placeholder,
    align,
    prefix: _prefix,
    ...rest
  } = props;
  const resource = useResourceContext({ resource: resourceProp });

  const { id, field, isRequired, fieldState } = useInput(props);

  const handleChange = (value: number | undefined) => {
    field.onChange(value ?? null);
  };

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
        <AtlantisInputNumber
          id={id}
          name={field.name}
          value={field.value ?? undefined}
          onChange={handleChange}
          onBlur={field.onBlur}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          prefixText={currency ? "$" : undefined}
          align={align ?? (currency ? "right" : "left")}
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

export interface NumberInputProps
  extends InputProps,
    Omit<
      React.ComponentProps<"input">,
      "defaultValue" | "onBlur" | "onChange" | "type" | "size"
    > {
  /**
   * Parse function for custom string to number conversion
   */
  parse?: (value: string) => number;
  /**
   * Input class name (applied to the actual input element)
   */
  inputClassName?: string;
  /**
   * Whether to show currency prefix ($)
   */
  currency?: boolean;
  /**
   * Minimum value
   */
  min?: number;
  /**
   * Maximum value
   */
  max?: number;
  /**
   * Step increment
   */
  step?: number;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Text alignment
   */
  align?: "left" | "center" | "right";
}
