import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button as AtlantisButton, StatusIndicator, Text, Icon, InputText, Checkbox, Drawer, FormatDate } from '../components/atlantis';
import type { StatusIndicatorStatus } from '../components/atlantis/StatusIndicator';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Map employee status identifiers to StatusIndicator statuses
const employeeColorToStatus: Record<string, StatusIndicatorStatus> = {
  'inactive': 'inactive',
  'warning': 'warning',
  'informative': 'informative',
  'success': 'success',
};

interface JobsSidebarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  selectedEmployees?: string[];
  onEmployeeToggle?: (employeeId: string) => void;
  filterText?: string;
  onFilterTextChange?: (text: string) => void;
  /**
   * Whether the sidebar is open (for mobile drawer mode)
   */
  open?: boolean;
  /**
   * Callback when the drawer should close
   */
  onRequestClose?: () => void;
  /**
   * Whether to render as a drawer (mobile) or inline sidebar (desktop)
   * @default false
   */
  asDrawer?: boolean;
}

// Mini calendar component
const MiniCalendar = ({
  selectedDate,
  onDateSelect,
}: {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  // FormatDate is used for month/year display in the calendar header
  const monthYearFormat = 'MMMM yyyy'; // e.g., "January 2024"

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onDateSelect?.(newDate);
  };

  const days = [];
  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-7 w-7" />);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={cn(
          'h-7 w-7 rounded-full text-sm font-medium transition-colors',
          'hover:bg-[--color-surface--hover] hover:text-[--color-text]',
          isToday(day) && 'bg-[--color-interactive] text-[--color-text--reverse]',
          isSelected(day) &&
            !isToday(day) &&
            'bg-[--color-interactive--subtle] text-[--color-interactive] ring-1 ring-[--color-interactive]'
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Text element="span" size="small" className="font-medium">
          <FormatDate date={currentMonth} format={monthYearFormat} />
        </Text>
        <div className="flex items-center gap-1">
          <AtlantisButton
            type="tertiary"
            variation="subtle"
            size="small"
            icon="arrowLeft"
            ariaLabel="Previous month"
            onClick={prevMonth}
            className="h-6 w-6"
          />
          <AtlantisButton
            type="tertiary"
            variation="subtle"
            size="small"
            icon="arrowRight"
            ariaLabel="Next month"
            onClick={nextMonth}
            className="h-6 w-6"
          />
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            className="h-7 w-7 text-xs font-medium text-[--color-text--secondary] flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">{days}</div>
    </div>
  );
};

// Mock employee data - in production, this would come from an API
const mockEmployees = [
  { id: 'unassigned', name: 'Unassigned', color: 'inactive' },
  { id: 'emp-1', name: 'Alex Demo', color: 'warning' },
  { id: 'emp-2', name: 'John Smith', color: 'informative' },
  { id: 'emp-3', name: 'Sarah Johnson', color: 'success' },
];

// Shared filter content component
const JobsFilterContent = ({
  selectedDate,
  onDateSelect,
  selectedEmployees = [],
  onEmployeeToggle,
  filterText = '',
  onFilterTextChange,
}: Omit<JobsSidebarProps, 'open' | 'onRequestClose' | 'asDrawer'>) => {
  const [isTeamOpen, setIsTeamOpen] = useState(true);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Mini Calendar */}
      <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />

      <Separator />

      {/* Filter Input */}
      <InputText
        placeholder="Filter by name or tag"
        value={filterText}
        onChange={(value) => onFilterTextChange?.(value)}
        prefix="search"
        size="small"
      />

      {/* Team Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Text element="span" variation="subdued" size="small" className="font-medium">
            Areas
          </Text>
          <AtlantisButton
            type="tertiary"
            variation="subtle"
            size="small"
            icon="edit"
            ariaLabel="Edit areas"
            className="h-6 w-6"
          />
        </div>

        <Collapsible open={isTeamOpen} onOpenChange={setIsTeamOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[--color-surface--hover]">
              <Checkbox
                checked={selectedEmployees.length === mockEmployees.length}
                indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < mockEmployees.length}
                onChange={(checked) => {
                  if (checked) {
                    mockEmployees.forEach((emp) => onEmployeeToggle?.(emp.id));
                  } else {
                    selectedEmployees.forEach((id) => onEmployeeToggle?.(id));
                  }
                }}
              />
              <Icon name="clients" size="small" />
              <span className="flex-1 text-left">Team calendars</span>
              <Icon
                name="arrowRight"
                size="small"
                className={cn(
                  'transition-transform',
                  isTeamOpen && 'rotate-90'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-4 pt-1">
            {mockEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[--color-surface--hover]"
              >
                <Checkbox
                  checked={selectedEmployees.includes(employee.id)}
                  onChange={() => onEmployeeToggle?.(employee.id)}
                />
                <StatusIndicator
                  status={employeeColorToStatus[employee.color] || 'inactive'}
                />
                <span className="flex-1">{employee.name}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export const JobsSidebar = ({
  selectedDate,
  onDateSelect,
  selectedEmployees = [],
  onEmployeeToggle,
  filterText = '',
  onFilterTextChange,
  open = false,
  onRequestClose,
  asDrawer = false,
}: JobsSidebarProps) => {
  // When rendered as a drawer (mobile)
  if (asDrawer) {
    return (
      <Drawer
        open={open}
        title="Filter Jobs"
        onRequestClose={onRequestClose || (() => {})}
        side="left"
        width="280px"
      >
        <JobsFilterContent
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          selectedEmployees={selectedEmployees}
          onEmployeeToggle={onEmployeeToggle}
          filterText={filterText}
          onFilterTextChange={onFilterTextChange}
        />
      </Drawer>
    );
  }

  // Desktop: render as fixed sidebar
  return (
    <aside className="w-64 shrink-0 border-r bg-[--color-surface]/95 backdrop-blur supports-[backdrop-filter]:bg-[--color-surface]/60">
      <JobsFilterContent
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        selectedEmployees={selectedEmployees}
        onEmployeeToggle={onEmployeeToggle}
        filterText={filterText}
        onFilterTextChange={onFilterTextChange}
      />
    </aside>
  );
};
