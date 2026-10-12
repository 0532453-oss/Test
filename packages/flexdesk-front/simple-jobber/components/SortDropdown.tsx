import { useListContext } from 'ra-core';
import { Button as AtlantisButton } from './atlantis/Button';
import { Text, Menu, Icon, useBool } from './atlantis';
import { cn } from '@/lib/utils';

export interface SortOption {
  field: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  defaultField?: string;
  className?: string;
}

export function SortDropdown({ options, defaultField, className }: SortDropdownProps) {
  const { sort, setSort } = useListContext();
  const menu = useBool(false);

  const currentField = sort?.field || defaultField || options[0]?.field;
  const currentOrder = sort?.order || 'ASC';
  const currentOption = options.find((opt) => opt.field === currentField);

  const handleFieldChange = (field: string) => {
    setSort({ field, order: currentOrder });
  };

  const handleOrderChange = (order: 'ASC' | 'DESC') => {
    setSort({ field: currentField, order });
  };

  const toggleOrder = () => {
    handleOrderChange(currentOrder === 'ASC' ? 'DESC' : 'ASC');
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Menu open={menu.value} onOpenChange={menu.setValue} placement="bottom-start" closeOnSelect={false}>
        <Menu.Trigger>
          <AtlantisButton type="secondary" variation="subtle" size="small" className="h-8 gap-2">
            <Icon name="sort" size="small" />
            <Text element="span" variation="subdued">Sorted by</Text>
            <Text element="span" className="font-medium">{currentOption?.label || currentField}</Text>
          </AtlantisButton>
        </Menu.Trigger>
        <Menu.Content width={192}>
          <Menu.RadioGroup
            value={currentField}
            onValueChange={(value) => {
              handleFieldChange(value);
              menu.setFalse();
            }}
          >
            {options.map((option) => (
              <Menu.RadioItem key={option.field} value={option.field}>
                {option.label}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
          <Menu.Separator />
          <Menu.RadioGroup
            value={currentOrder}
            onValueChange={(value) => {
              handleOrderChange(value as 'ASC' | 'DESC');
              menu.setFalse();
            }}
          >
            <Menu.RadioItem value="ASC">
              <Icon name="arrowUp" size="small" className="mr-2" />
              Ascending
            </Menu.RadioItem>
            <Menu.RadioItem value="DESC">
              <Icon name="arrowDown" size="small" className="mr-2" />
              Descending
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu>
      <AtlantisButton
        type="tertiary"
        variation="subtle"
        size="small"
        className="h-8 w-8 p-0"
        onClick={toggleOrder}
        ariaLabel={`Sort ${currentOrder === 'ASC' ? 'descending' : 'ascending'}`}
      >
        <Icon name={currentOrder === 'ASC' ? 'arrowUp' : 'arrowDown'} size="small" />
      </AtlantisButton>
    </div>
  );
}

// Pre-configured sort options for common entities
export const jobSortOptions: SortOption[] = [
  { field: 'scheduledStartAt', label: 'Scheduled Date' },
  { field: 'createdAt', label: 'Created Date' },
  { field: 'title', label: 'Title' },
  { field: 'status', label: 'Status' },
  { field: 'priority', label: 'Priority' },
];

export const clientSortOptions: SortOption[] = [
  { field: 'createdAt', label: 'Created Date' },
  { field: 'name', label: 'Name' },
  { field: 'status', label: 'Status' },
];

export const requestSortOptions: SortOption[] = [
  { field: 'createdAt', label: 'Created Date' },
  { field: 'title', label: 'Title' },
  { field: 'status', label: 'Status' },
  { field: 'preferredDate', label: 'Preferred Date' },
  { field: 'estimatedValue', label: 'Estimated Value' },
];

export const invoiceSortOptions: SortOption[] = [
  { field: 'createdAt', label: 'Created Date' },
  { field: 'dueDate', label: 'Due Date' },
  { field: 'invoiceNumber', label: 'Invoice Number' },
  { field: 'total', label: 'Amount' },
  { field: 'status', label: 'Status' },
];
