/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  FormError,
  FormField,
  FormLabel,
} from "@/components/admin/form";
import { Combobox, type ComboboxOption } from "@/components/atlantis";
import type { ChoicesProps, InputProps } from "ra-core";
import {
  useChoices,
  useChoicesContext,
  useGetRecordRepresentation,
  useInput,
  useTranslate,
  FieldTitle,
  useEvent,
} from "ra-core";
import { InputHelperText } from "./input-helper-text";
import type { SupportCreateSuggestionOptions } from "@/hooks/useSupportCreateSuggestion";
import { useSupportCreateSuggestion } from "@/hooks/useSupportCreateSuggestion";

/**
 * Form control that lets users choose a value from a list using a dropdown with autocompletion.
 *
 * This input allows editing scalar values with a searchable dropdown interface. It supports creating
 * new choices on the fly and works seamlessly inside ReferenceInput for editing foreign key relationships.
 *
 * Uses Atlantis Combobox component for consistent styling across the application.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/autocompleteinput/ AutocompleteInput documentation}
 * @see {@link https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-combobox--docs Atlantis Combobox documentation}
 *
 * @example
 * import {
 *   Create,
 *   SimpleForm,
 *   AutocompleteInput,
 *   ReferenceInput,
 * } from '@/components/admin';
 *
 * const PostCreate = () => (
 *   <Create>
 *     <SimpleForm>
 *       <AutocompleteInput
 *         source="category"
 *         choices={[
 *           { id: 'tech', name: 'Tech' },
 *           { id: 'lifestyle', name: 'Lifestyle' },
 *           { id: 'people', name: 'People' },
 *         ]}
 *       />
 *       <ReferenceInput label="Author" source="author_id" reference="authors">
 *         <AutocompleteInput />
 *       </ReferenceInput>
 *     </SimpleForm>
 *   </Create>
 * );
 */
export const AutocompleteInput = (
  props: Omit<InputProps, "source"> &
    Omit<SupportCreateSuggestionOptions, "handleChange" | "filter"> &
    Partial<Pick<InputProps, "source">> &
    ChoicesProps & {
      className?: string;
      disableValue?: string;
      filterToQuery?: (searchText: string) => any;
      translateChoice?: boolean;
      placeholder?: string;
      inputText?:
        | React.ReactNode
        | ((option: any | undefined) => React.ReactNode);
    },
) => {
  const {
    filterToQuery = DefaultFilterToQuery,
    inputText,
    create,
    createValue,
    createLabel,
    createHintValue,
    createItemLabel,
    onCreate,
    optionText,
  } = props;
  const {
    allChoices = [],
    source,
    resource,
    isFromReference,
    setFilters,
    isPending,
  } = useChoicesContext(props);
  const { id, field, isRequired, fieldState } = useInput({ ...props, source });
  const translate = useTranslate();
  const { placeholder = translate("ra.action.search", { _: "Search..." }) } =
    props;

  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const { getChoiceText, getChoiceValue } = useChoices({
    optionText:
      props.optionText ?? (isFromReference ? getRecordRepresentation : "name"),
    optionValue: props.optionValue ?? "id",
    disableValue: props.disableValue,
    translateChoice: props.translateChoice ?? !isFromReference,
  });

  const [filterValue, setFilterValue] = React.useState("");

  const selectedChoice = allChoices.find(
    (choice) => getChoiceValue(choice) === field.value,
  );

  const handleChange = useCallback(
    (choice: any) => {
      if (field.value === getChoiceValue(choice) && !isRequired) {
        field.onChange("");
        setFilterValue("");
        if (isFromReference) {
          setFilters(filterToQuery(""));
        }
        return;
      }
      field.onChange(getChoiceValue(choice));
    },
    [
      field.value,
      field.onChange,
      getChoiceValue,
      isRequired,
      setFilterValue,
      isFromReference,
      setFilters,
      filterToQuery,
    ],
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
    createItemLabel,
    onCreate,
    handleChange,
    optionText,
    filter: filterValue,
  });

  // Handle search debounce for reference inputs
  const handleSearch = useEvent((searchValue: string) => {
    setFilterValue(searchValue);
    if (isFromReference) {
      setFilters(filterToQuery(searchValue));
    }
  });

  // Handle combobox close - reset filter
  const handleClose = useEvent(() => {
    if (isFromReference) {
      setFilters(filterToQuery(""));
    }
    setFilterValue("");
  });

  // Convert React Admin choices to Combobox options format
  const comboboxOptions: ComboboxOption[] = useMemo(() => {
    const createItem =
      (create || onCreate) && (filterValue !== "" || createLabel)
        ? getCreateItem(filterValue)
        : null;

    let finalChoices = allChoices;
    if (createItem) {
      finalChoices = [...finalChoices, createItem];
    }

    return finalChoices
      .filter((choice) => choice != null)
      .map((choice) => {
        const isCreateItem = !!createItem && choice?.id === createItem.id;
        const value = getChoiceValue(choice);
        const label = getChoiceText(isCreateItem ? createItem : choice);

        return {
          id: value?.toString() ?? '',
          label: label?.toString() ?? '',
        } as ComboboxOption;
      });
  }, [allChoices, create, onCreate, filterValue, createLabel, getCreateItem, getChoiceValue, getChoiceText]);

  // Get selected options for Combobox
  const selectedOptions: ComboboxOption[] = useMemo(() => {
    if (!selectedChoice) return [];
    const value = getChoiceValue(selectedChoice);
    const label = getChoiceText(selectedChoice);
    return [{
      id: value?.toString() ?? '',
      label: label?.toString() ?? '',
    }];
  }, [selectedChoice, getChoiceValue, getChoiceText]);

  // Handle Combobox selection
  const handleSelect = useCallback((selection: ComboboxOption[]) => {
    if (selection.length === 0) {
      // Cleared selection
      field.onChange("");
      setFilterValue("");
      if (isFromReference) {
        setFilters(filterToQuery(""));
      }
      return;
    }

    const selectedOption = selection[0];
    // Find the original choice to pass to handleChangeWithCreateSupport
    const createItem =
      (create || onCreate) && (filterValue !== "" || createLabel)
        ? getCreateItem(filterValue)
        : null;

    const originalChoice = createItem && selectedOption.id === createItem.id?.toString()
      ? createItem
      : allChoices.find((c) => getChoiceValue(c)?.toString() === selectedOption.id);

    if (originalChoice) {
      handleChangeWithCreateSupport(originalChoice);
    }
  }, [
    field,
    isFromReference,
    setFilters,
    filterToQuery,
    create,
    onCreate,
    filterValue,
    createLabel,
    getCreateItem,
    allChoices,
    getChoiceValue,
    handleChangeWithCreateSupport,
  ]);

  return (
    <>
      <FormField className={cn("w-full", props.className)} id={id} name={source}>
        {props.label !== false && (
          <FormLabel>
            <FieldTitle
              label={props.label}
              source={props.source ?? source}
              resource={resource}
              isRequired={isRequired}
            />
          </FormLabel>
        )}
        <Combobox
          options={comboboxOptions}
          selected={selectedOptions}
          onSelect={handleSelect}
          placeholder={placeholder}
          subjectNoun={resource || "items"}
          onSearch={isFromReference ? handleSearch : undefined}
          onSearchDebounce={300}
          onClose={handleClose}
          loading={isPending}
          disabled={field.disabled}
          invalid={fieldState?.invalid}
        >
          {/* Add create action if onCreate is provided */}
          {(create || onCreate) && createLabel && typeof createLabel === 'string' && (
            <Combobox.Action
              label={createLabel}
              onClick={() => {
                const createItem = getCreateItem(filterValue);
                if (createItem) {
                  handleChangeWithCreateSupport(createItem);
                }
              }}
              visible={true}
            />
          )}
        </Combobox>
        <InputHelperText helperText={props.helperText} />
        <FormError />
      </FormField>
      {createElement}
    </>
  );
};

const DefaultFilterToQuery = (searchText: string) => ({ q: searchText });
