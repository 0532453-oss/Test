import * as React from "react";
import type { InputProps } from "ra-core";
import { useInput, FieldTitle, useEvent, useResourceContext } from "ra-core";
import {
  FormControl,
  FormError,
  FormField,
  FormLabel,
} from "@/components/admin/form";
import { InputTime as AtlantisInputTime } from "@/components/atlantis";
import { InputHelperText } from "@/components/admin/input-helper-text";
import { cn } from "@/lib/utils";

/**
 * Time picker input for editing time values in "HH:MM" format.
 *
 * Use `<TimeInput>` for start times, end times, or any standalone time field.
 * Renders a native browser time picker. Handles time parsing from various formats.
 *
 * @example
 * import {
 *   Edit,
 *   SimpleForm,
 *   TimeInput,
 *   DateInput,
 * } from '@/components/admin';
 *
 * const EventEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <DateInput source="date" />
 *       <TimeInput source="startTime" label="Start Time" />
 *       <TimeInput source="endTime" label="End Time" />
 *     </SimpleForm>
 *   </Edit>
 * );
 *
 * @example
 * // With step intervals (15-minute increments)
 * <TimeInput source="appointmentTime" step={900} />
 */
export const TimeInput = (props: TimeInputProps) => {
  const {
    className,
    inputClassName,
    defaultValue,
    format = defaultFormat,
    label,
    source,
    helperText,
    onChange,
    onFocus,
    validate,
    disabled,
    readOnly,
    minTime,
    maxTime,
    step,
    ...rest
  } = props;

  const resource = useResourceContext(props);

  const {
    field,
    fieldState: _fieldState,
    id,
    isRequired,
  } = useInput({
    defaultValue,
    source,
    validate,
    disabled,
    readOnly,
    format,
    ...rest,
  });
  const localInputRef = React.useRef<HTMLInputElement | null>(null);
  // TimeInput is not a really controlled input to ensure users can start entering a time, go to another input and come back to complete it.
  // This ref stores the value that is passed to the input defaultValue prop to solve this issue.
  const initialDefaultValueRef = React.useRef(field.value);
  // As the defaultValue prop won't trigger a remount of the HTML input, we will force it by changing the key.
  const [inputKey, setInputKey] = React.useState(1);
  // This ref let us track that the last change of the form state value was made by the input itself
  const wasLastChangedByInput = React.useRef(false);

  // This effect ensures we stays in sync with the react-hook-form state when the value changes from outside the input
  // for instance by using react-hook-form reset or setValue methods.
  React.useEffect(() => {
    // Ignore react-hook-form state changes if it came from the input itself
    if (wasLastChangedByInput.current) {
      // Resets the flag to ensure futures changes are handled
      wasLastChangedByInput.current = false;
      return;
    }

    const hasNewValueFromForm =
      localInputRef.current?.value !== field.value &&
      !(localInputRef.current?.value === "" && field.value == null);

    if (hasNewValueFromForm) {
      // The value has changed from outside the input, we update the input value
      initialDefaultValueRef.current = field.value;
      // Trigger a remount of the HTML input
      setInputKey((r) => r + 1);
      // Resets the flag to ensure futures changes are handled
      wasLastChangedByInput.current = false;
    }
  }, [setInputKey, field.value]);

  const { onBlur: onBlurFromField } = field;
  const hasFocus = React.useRef(false);

  // Update the input text when the user types in the input.
  // Also, update the react-hook-form value if the input value is a valid time string.
  const handleChange = useEvent(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(event);
      }
      if (
        typeof event.target === "undefined" ||
        typeof event.target.value === "undefined"
      ) {
        return;
      }
      const target = event.target;
      const newValue = target.value;
      const isNewValueValid = newValue === "" || timeRegex.test(newValue);

      // Only change react-hook-form value if it's valid
      if (newValue !== "" && newValue != null && isNewValueValid) {
        field.onChange(newValue);
        // Track the fact that the next react-hook-form state change was triggered by the input itself
        wasLastChangedByInput.current = true;
      }
    },
  );

  const handleFocus = useEvent((event: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(event);
    }
    hasFocus.current = true;
  });

  const handleBlur = useEvent(() => {
    hasFocus.current = false;

    if (!localInputRef.current) {
      return;
    }

    const newValue = localInputRef.current.value;
    // To ensure users can clear the input, we check its value on blur
    // and submit it to react-hook-form
    const isNewValueValid = newValue === "" || timeRegex.test(newValue);

    if (isNewValueValid && field.value !== newValue) {
      field.onChange(newValue ?? "");
    }

    if (onBlurFromField) {
      onBlurFromField();
    }
  });

  const { ref, name } = field;
  const inputRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && node) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
      localInputRef.current = node;
    },
    [ref],
  );

  return (
    <FormField id={id} className={className} name={name}>
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
        <AtlantisInputTime
          ref={inputRef}
          defaultValue={format(initialDefaultValueRef.current) ?? ""}
          key={inputKey}
          onNativeChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          minTime={minTime}
          maxTime={maxTime}
          step={step}
          className={cn(
            "ra-input",
            `ra-input-${source}`,
            inputClassName,
          )}
          disabled={disabled || readOnly}
          readonly={readOnly}
        />
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};

export type TimeInputProps = InputProps & {
  inputClassName?: string;
  /** Minimum time in HH:MM format */
  minTime?: string;
  /** Maximum time in HH:MM format */
  maxTime?: string;
  /** Step in seconds (default: 60 for 1 minute intervals) */
  step?: number;
} & Omit<React.ComponentProps<"input">, "label" | "defaultValue">;

// HH:MM format regex
const timeRegex = /^\d{2}:\d{2}$/;

/**
 * Format a form state value to a time string for the `<input type="time">` value.
 *
 * Form state values can be:
 * - a string in the "HH:MM" format
 * - a Date object (extracts time)
 * - an ISO datetime string (extracts time)
 * - an empty string
 *
 * The output is always a string in the "HH:MM" format.
 */
const defaultFormat = (value: string | Date | number) => {
  // null, undefined and empty string values should not go through the formatter
  if (value == null || value === "") {
    return null;
  }

  // Already in HH:MM format
  if (typeof value === "string" && timeRegex.test(value)) {
    return value;
  }

  // Date objects - extract time
  if (value instanceof Date) {
    return extractTimeFromDate(value);
  }

  // ISO datetime strings or other date formats - try to parse and extract time
  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return extractTimeFromDate(date);
    }
  }

  // Timestamps
  if (typeof value === "number") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return extractTimeFromDate(date);
    }
  }

  return null;
};

/**
 * Extract HH:MM time string from a Date object using local time
 */
const extractTimeFromDate = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
