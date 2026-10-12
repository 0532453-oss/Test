import type { ChoicesProps, InputProps } from "ra-core";
import {
  FieldTitle,
  useChoices,
  useChoicesContext,
  useGetRecordRepresentation,
  useInput,
  useTranslate,
} from "ra-core";
import type { ComponentProps, ReactElement } from "react";
import { useCallback, useEffect, useMemo } from "react";

import { FormError, FormField, FormLabel } from "@/components/admin/form";
import { InputHelperText } from "@/components/admin/input-helper-text";
import { Select as AtlantisSelect, type SelectOption } from "@/components/atlantis";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportCreateSuggestionOptions } from "@/hooks/useSupportCreateSuggestion";
import { useSupportCreateSuggestion } from "@/hooks/useSupportCreateSuggestion";
import { cn } from "@/lib/utils";

/**
 * Dropdown select input for choosing a single value from a list of options.
 *
 * Use `<SelectInput>` for fields with many possible values (5+) like categories, statuses, or
 * countries. Supports creating new options on the fly with the `create` or `onCreate` props.
 * Wrap in `<ReferenceInput>` to select from related resources.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/selectinput/ SelectInput documentation}
 * @see {@link https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-select--docs Atlantis Select documentation}
 *
 * @example
 * import { Edit, SimpleForm, TextInput, SelectInput } from '@/components/admin';
 *
 * const PostEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <TextInput source="title" />
 *       <SelectInput
 *         source="category"
 *         choices={[
 *           { id: 'tech', name: 'Tech' },
 *           { id: 'lifestyle', name: 'Lifestyle' },
 *           { id: 'people', name: 'People' },
 *         ]}
 *       />
 *     </SimpleForm>
 *   </Edit>
 * );
 */
export const SelectInput = (props: SelectInputProps) => {
  const {
    choices: choicesProp,
    isLoading: isLoadingProp,
    isFetching: isFetchingProp,
    isPending: isPendingProp,
    resource: resourceProp,
    source: sourceProp,

    optionText,
    optionValue,
    disableValue = "disabled",
    translateChoice,
    createValue,
    createHintValue,

    alwaysOn,
    defaultValue,
    format,
    label,
    helperText,
    name,
    onBlur,
    onChange,
    parse,
    validate,
    readOnly,
    disabled,

    className,
    emptyText = "",
    emptyValue = "",
    filter: _filter,
    create,
    createLabel,
    onCreate,

    ...rest
  } = props;
  const translate = useTranslate();

  useEffect(() => {
    if (emptyValue == null) {
      throw new Error(
        `emptyValue being set to null or undefined is not supported. Use parse to turn the empty string into null.`,
      );
    }
  }, [emptyValue]);

  const {
    allChoices,
    isPending,
    error: fetchError,
    source,
    resource,
    isFromReference,
  } = useChoicesContext({
    choices: choicesProp,
    isLoading: isLoadingProp,
    isFetching: isFetchingProp,
    isPending: isPendingProp,
    resource: resourceProp,
    source: sourceProp,
  });

  if (source === undefined) {
    throw new Error(
      `If you're not wrapping the SelectInput inside a ReferenceInput, you must provide the source prop`,
    );
  }

  if (!isPending && !fetchError && allChoices === undefined) {
    throw new Error(
      `If you're not wrapping the SelectInput inside a ReferenceInput, you must provide the choices prop`,
    );
  }

  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const { getChoiceText, getChoiceValue, getDisableValue } = useChoices({
    optionText:
      optionText ?? (isFromReference ? getRecordRepresentation : undefined),
    optionValue,
    disableValue,
    translateChoice: translateChoice ?? !isFromReference,
    createValue,
    createHintValue,
  });
  const { id, field, isRequired, fieldState } = useInput({
    alwaysOn,
    defaultValue,
    format,
    label,
    helperText,
    name,
    onBlur,
    onChange,
    parse,
    resource,
    source,
    validate,
    readOnly,
    disabled,
  });

  const renderEmptyItemOption = useCallback(() => {
    return typeof emptyText === "string"
      ? emptyText === ""
        ? " " // em space, forces the display of an empty line of normal height
        : translate(emptyText, { _: emptyText })
      : emptyText;
  }, [emptyText, translate]);

  const renderMenuItemOption = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (choice: any) => getChoiceText(choice),
    [getChoiceText],
  );

  const handleChange = useCallback(
    async (value: string | number | undefined) => {
      const stringValue = value?.toString() ?? emptyValue;
      if (stringValue === emptyValue) {
        field.onChange(emptyValue);
      } else {
        // Find the choice by value and pass it to field.onChange
        const choice = allChoices?.find(
          (choice) => getChoiceValue(choice)?.toString() === stringValue,
        );
        field.onChange(choice ? getChoiceValue(choice) : stringValue);
      }
    },
    [field, getChoiceValue, emptyValue, allChoices],
  );

  const {
    getCreateItem,
    handleChange: handleChangeWithCreateSupport,
    createElement,
  } = useSupportCreateSuggestion({
    create,
    createLabel,
    createValue,
    createHintValue,
    onCreate,
    handleChange: (value: string) => handleChange(value),
    optionText,
  });

  // Convert choices to Atlantis SelectOption format
  const selectOptions = useMemo(() => {
    const createItem = create || onCreate ? getCreateItem() : null;
    let finalChoices = fetchError ? [] : (allChoices ?? []);
    if (createItem) {
      finalChoices = [...finalChoices, createItem];
    }

    return finalChoices
      .filter((choice) => choice != null)
      .map((choice) => {
        const value = getChoiceValue(choice);
        const isDisabled = getDisableValue(choice);

        return {
          value: value?.toString() ?? '',
          label: renderMenuItemOption(
            createItem && choice?.id === createItem.id ? createItem : choice
          )?.toString() ?? '',
          disabled: isDisabled,
        } as SelectOption;
      });
  }, [allChoices, fetchError, create, onCreate, getCreateItem, getChoiceValue, getDisableValue, renderMenuItemOption]);

  if (isPending) {
    return (
      <FormField
        id={id}
        name={field.name}
        className={cn("w-full min-w-20", className)}
      >
        {label !== "" && label !== false && (
          <FormLabel>
            <FieldTitle
              label={label}
              source={source}
              resource={resourceProp}
              isRequired={isRequired}
            />
          </FormLabel>
        )}
        <div className="relative">
          <Skeleton className="w-full h-10" />
        </div>
        <InputHelperText helperText={helperText} />
        <FormError />
      </FormField>
    );
  }

  // Get placeholder text
  const placeholderText = typeof renderEmptyItemOption() === 'string'
    ? renderEmptyItemOption() as string
    : '';

  return (
    <>
      <FormField
        id={id}
        name={field.name}
        className={cn("w-full min-w-20", className)}
        {...rest}
      >
        {label !== "" && label !== false && (
          <FormLabel>
            <FieldTitle
              label={label}
              source={source}
              resource={resourceProp}
              isRequired={isRequired}
            />
          </FormLabel>
        )}
        <AtlantisSelect
          id={id}
          name={field.name}
          value={field.value?.toString() || emptyValue}
          options={selectOptions}
          placeholder={placeholderText || undefined}
          disabled={field.disabled}
          invalid={fieldState?.invalid}
          clearable={Boolean(field.value && field.value !== emptyValue)}
          onChange={(value) => {
            const stringValue = value?.toString() ?? emptyValue;
            handleChangeWithCreateSupport(stringValue);
          }}
          onBlur={field.onBlur}
        />
        <InputHelperText helperText={helperText} />
        <FormError />
      </FormField>
      {createElement}
    </>
  );
};

export type SelectInputProps = ChoicesProps &
  // Source is optional as SelectInput can be used inside a ReferenceInput that already defines the source
  Partial<InputProps> &
  Omit<SupportCreateSuggestionOptions, "handleChange"> & {
    emptyText?: string | ReactElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emptyValue?: any;
    onChange?: (value: string) => void;
  } & Omit<ComponentProps<typeof FormField>, "id" | "name" | "children">;
