# DatePicker Usage Audit

## 1. Files Containing Date Picker/Selection Components

### Core Atlantis Date Input Components
| File | Component | Input Type |
|------|-----------|------------|
| `components/atlantis/InputDate.tsx` | InputDate | `<input type="date">` |
| `components/atlantis/InputDateTime.tsx` | InputDateTime | `<input type="datetime-local">` |
| `components/atlantis/InputTime.tsx` | InputTime | `<input type="time">` |

### Admin Form Wrappers (react-admin integration)
| File | Component | Wraps |
|------|-----------|-------|
| `../../flexdesk-admin/src/components/admin/date-input.tsx` | DateInput | InputDate |
| `../../flexdesk-admin/src/components/admin/date-time-input.tsx` | DateTimeInput | InputDateTime |

### Display-Only Date Components
| File | Component | Purpose |
|------|-----------|---------|
| `components/atlantis/FormatDate.tsx` | FormatDate | Renders formatted date text |
| `components/atlantis/FormatDateTime.tsx` | FormatDateTime | Renders formatted date+time text |
| `components/atlantis/FormatTime.tsx` | FormatTime | Renders formatted time text |

### Pages Using Date Selection
| File | Date Components Used |
|------|---------------------|
| `jobs/JobCreate.tsx` | DateInput (scheduledStartAt, scheduledEndAt), InputTime (startTime, endTime) |
| `jobs/JobEdit.tsx` | DateTimeInput (scheduledStartAt, scheduledEndAt) |
| `invoices/InvoiceCreate.tsx` | DateInput (issuedDate, dueDate) |
| `invoices/InvoiceEdit.tsx` | DateInput (dueDate, paidAt) |
| `requests/RequestCreate.tsx` | DateInput (preferredDate, preferredEndDate) |
| `requests/RequestEdit.tsx` | DateInput (preferredDate, preferredEndDate) |
| `schedule/SchedulePage.tsx` | date-fns for week navigation (no date picker input) |
| `dashboard/DashboardPage.tsx` | date-fns isToday() for filtering (no date picker input) |
| `insights/components/FilterBar.tsx` | Date preset dropdown (7d, 30d, 90d, this_month, last_month) |

---

## 2. Date-Related Props and State Management Patterns

### Props Pattern (DateInput / DateTimeInput)
```
source: string           // react-admin field name
label?: string           // form label
defaultValue?: string    // initial date value
validate?: Function      // validation rules
disabled?: boolean
readOnly?: boolean
helperText?: string
onChange?: (value) => void
```

### Props Pattern (InputDate / InputDateTime)
```
value?: string           // controlled value (YYYY-MM-DD or YYYY-MM-DDTHH:MM)
defaultValue?: string    // uncontrolled default
minDate?: string         // min selectable date
maxDate?: string         // max selectable date
onChange?: (value) => void
onFocus?: () => void
onBlur?: () => void
disabled?: boolean
readonly?: boolean
required?: boolean
invalid?: boolean
size?: 'small' | 'large'
```

### State Management Patterns

| Pattern | Location | State Variables |
|---------|----------|-----------------|
| react-admin form state | JobCreate, JobEdit, InvoiceCreate, InvoiceEdit, RequestCreate, RequestEdit | Managed by `<SimpleForm>` via `source` prop |
| Local useState | JobCreate.tsx | `startTime`, `endTime`, `scheduleLater` |
| URL-based state | useInsightsFilters.ts | `dateRange.start`, `dateRange.end`, `dateRange.preset` |
| Derived state | SchedulePage.tsx | `currentDate` (Date), computed `weekStart`, `weekEnd`, `weekDays` |
| Derived filtering | DashboardPage.tsx | `isToday()` comparison, `>= new Date()` for upcoming |

---

## 3. Job Creation, Editing, and Rescheduling Flows

### Job Creation (`jobs/JobCreate.tsx`)
- **Date fields:** `scheduledStartAt` (DateInput), `scheduledEndAt` (DateInput)
- **Time fields:** `startTime` (InputTime, local state '09:00'), `endTime` (InputTime, local state '17:00')
- **Toggle:** `scheduleLater` boolean hides/shows date fields
- **Format:** Dates stored as ISO strings via react-admin

### Job Editing (`jobs/JobEdit.tsx`)
- **Date+Time fields:** `scheduledStartAt` (DateTimeInput), `scheduledEndAt` (DateTimeInput)
- **Duration:** `estimatedDuration` (NumberInput, minutes)
- **Pre-populated:** Current job dates loaded from record
- **Format:** ISO 8601 strings (YYYY-MM-DDTHH:MM)

### Job Rescheduling
- **No dedicated reschedule modal/form exists**
- Rescheduling currently happens via the Job Edit form
- `JobList.tsx` and `JobActionBar.tsx` reference "reschedule" in action labels
- The edit form serves as the reschedule mechanism (change dates and save)

---

## 4. Date Range Selection Requirements

### Current Date Range Implementations

1. **Insights FilterBar** (`insights/components/FilterBar.tsx`)
   - Preset-based: 7d, 30d, 90d, this_month, last_month
   - Custom range: start + end Date objects
   - State managed in `useInsightsFilters.ts` hook
   - Persisted via URL search params

2. **Job Creation** (`jobs/JobCreate.tsx`)
   - Start date + End date (two separate DateInput components)
   - No validation preventing end < start (potential gap)

3. **Request Creation** (`requests/RequestCreate.tsx`)
   - Preferred date + Preferred end date (two separate DateInputs)
   - Represents a flexible scheduling window

4. **Schedule Page** (`schedule/SchedulePage.tsx`)
   - Week-based range: `weekStart` to `weekEnd`
   - Navigation via prev/next week buttons
   - Not user-selectable (programmatic)

### Date Utility Library
- **date-fns** is used throughout for: `format`, `parseISO`, `isToday`, `startOfDay`, `endOfDay`, `subDays`, `startOfMonth`, `endOfMonth`, `subMonths`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, `addWeeks`, `subWeeks`, `getHours`

---

## 5. Migration Notes for Atlantis DatePicker

### Current State
All date inputs use native HTML `<input type="date">` and `<input type="datetime-local">` wrapped in custom Atlantis-styled components (InputDate, InputDateTime). These provide browser-native date pickers.

### Migration Targets
To migrate to the Atlantis legacy DatePicker (`@jobber/components`), the following files need updates:
1. `components/atlantis/InputDate.tsx` - Replace native input with Atlantis DatePicker
2. `components/atlantis/InputDateTime.tsx` - Replace native input with Atlantis DatePicker + TimePicker
3. All consumer files automatically benefit since they use the wrapper components

### Key Considerations
- Atlantis DatePicker is a calendar-style picker (not native browser)
- Need to handle date format conversion (DatePicker may use Date objects vs strings)
- Time selection may need separate handling (Atlantis may not have combined datetime picker)
- Mobile experience differs from native pickers
