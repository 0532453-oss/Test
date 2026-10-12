import { useCallback, useMemo, useState } from 'react'
import { useInput, useTranslate, type Validator } from 'ra-core'
import { Combobox, type ComboboxOption } from '@/atlantis'
import { cn } from '@/lib/utils'

export interface AutocompleteInputProps {
  /** Source field - optional when used inside ReferenceInput (will be injected) */
  source?: string
  label?: string | false
  placeholder?: string
  optionText?: string | ((record: Record<string, unknown>) => string)
  optionValue?: string
  choices?: Array<{ id: string | number; [key: string]: unknown }>
  validate?: Validator | Validator[]
  className?: string
  disabled?: boolean
  isLoading?: boolean
  error?: string
  debounce?: number
  filterToQuery?: (searchText: string) => Record<string, unknown>
}

/**
 * AutocompleteInput provides a searchable dropdown for selecting from a list of choices.
 * It integrates with react-admin's form context and supports validation.
 *
 * @example
 * <AutocompleteInput
 *   source="clientId"
 *   optionText="name"
 *   choices={clients}
 * />
 */
export function AutocompleteInput({
  source = '',
  label,
  placeholder = 'Search...',
  optionText = 'name',
  optionValue = 'id',
  choices = [],
  validate,
  className,
  disabled = false,
  isLoading = false,
  error,
  debounce = 300,
}: AutocompleteInputProps) {
  const translate = useTranslate()
  const [searchValue, setSearchValue] = useState('')

  const {
    field,
    fieldState: { isTouched, error: fieldError },
    isRequired,
  } = useInput({
    source,
    validate,
  })

  // Get the display text from an option
  const getOptionText = useCallback(
    (record: Record<string, unknown>): string => {
      if (typeof optionText === 'function') {
        return optionText(record)
      }
      return String(record[optionText] || '')
    },
    [optionText]
  )

  // Transform choices to ComboboxOption format
  const options: ComboboxOption[] = useMemo(() => {
    const lowerSearch = searchValue.toLowerCase()
    return choices
      .filter((choice) => {
        if (!searchValue) return true
        const text = getOptionText(choice).toLowerCase()
        return text.includes(lowerSearch)
      })
      .map((choice) => ({
        id: choice[optionValue] as string | number,
        label: getOptionText(choice),
      }))
  }, [choices, searchValue, optionValue, getOptionText])

  // Get currently selected option
  const selected: ComboboxOption[] = useMemo(() => {
    if (!field.value) return []
    const selectedChoice = choices.find(
      (choice) => choice[optionValue] === field.value
    )
    if (!selectedChoice) return []
    return [
      {
        id: selectedChoice[optionValue] as string | number,
        label: getOptionText(selectedChoice),
      },
    ]
  }, [field.value, choices, optionValue, getOptionText])

  const handleSelect = useCallback(
    (selection: ComboboxOption[]) => {
      const selectedOption = selection[0]
      field.onChange(selectedOption?.id ?? null)
    },
    [field]
  )

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  const hasError = isTouched && (fieldError || error)
  const errorMessage = fieldError?.message || error

  return (
    <div className={cn('space-y-1', className)}>
      {label !== false && label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {translate(label, { _: label })}
          {isRequired && <span className="text-[var(--color-critical)]"> *</span>}
        </label>
      )}
      <Combobox
        options={options}
        selected={selected}
        onSelect={handleSelect}
        onSearch={handleSearch}
        onSearchDebounce={debounce}
        placeholder={placeholder}
        loading={isLoading}
        disabled={disabled}
        invalid={!!hasError}
        className="w-full"
      />
      {hasError && errorMessage && (
        <p className="text-sm text-[var(--color-critical)]">{errorMessage}</p>
      )}
    </div>
  )
}
