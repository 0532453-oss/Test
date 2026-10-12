# /component — Generate FlexDesk Components

Generate React components, hooks, types, and feature modules that match the FlexDesk codebase conventions exactly.

## Usage

```
/component <ComponentName> [--feature <domain>] [--type display|page|hook|feature]
```

**Examples:**
- `/component TechnicianCard --feature technicians --type display`
- `/component InvoiceDetail --feature invoices --type page`
- `/component useEstimates --feature estimates --type hook`
- `/component equipment --type feature` (scaffolds entire feature module)

---

## Conventions (extracted from codebase)

### File Structure

Feature modules live in `packages/flexdesk-preview-v2/src/features/{domain}/`:

```
features/{domain}/
├── components/
│   ├── {ComponentName}.tsx       ← PascalCase filename
│   └── index.ts                  ← barrel re-exports
├── hooks/
│   ├── use{Domain}.ts            ← camelCase with use- prefix
│   └── index.ts
├── pages/
│   ├── {Domain}List.tsx
│   └── {Domain}Detail.tsx
├── types.ts                      ← single file, NOT a folder
└── index.ts                      ← re-exports all subdirs
```

Shared UI components live in `packages/flexdesk-ui/src/{category}/{component-name}/`.

### No Semicolons

The codebase does **not** use semicolons. Never add them.

### Import Order

Always follow this exact order with blank lines between groups:

```tsx
// 1. React Router / framework
import { useParams, Link, useNavigate } from 'react-router-dom'

// 2. Third-party UI & utilities
import { CCard, CCardBody, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilArrowLeft } from '@coreui/icons'
import { format } from 'date-fns'

// 3. App-level aliases
import { ROUTES, routes } from '@app/routes'
import { PageHeader, EmptyState } from '@shared/components'

// 4. Relative imports (siblings, parent)
import { JobStatusBadge } from './JobStatusBadge'
import { useJob } from '../hooks'

// 5. Types — always use `import type`
import type { Job } from '../types'
```

### Props Interface

- Name it `Props` (not `{Component}Props`) in single-component files
- Define inline in the same file, never in a separate file
- Include `className?: string` on composable/presentational components

```tsx
interface Props {
  job: Job
  onClick?: () => void
  className?: string
}
```

### Component Declaration

- **Named export + function declaration** — never `React.FC`, never `export default` (exception: page components may use `export default`)
- Destructure props in the function signature

```tsx
export function JobCard({ job, onClick, className }: Props) {
  // ...
}
```

### Render Order for Pages

Pages that fetch data must follow this guard pattern:

```tsx
export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: resource, isLoading, error } = useResource(id!)

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  // 2. Error / not found
  if (error || !resource) {
    return (
      <EmptyState
        title="Resource not found"
        description="The resource you're looking for doesn't exist or has been deleted."
        action={
          <CButton color="primary" as={Link} to={ROUTES.RESOURCES}>
            Back to Resources
          </CButton>
        }
      />
    )
  }

  // 3. Main content
  return (
    <>
      <PageHeader title={resource.title} ... />
      {/* content */}
    </>
  )
}
```

### Styling

**In `flexdesk-preview-v2`** (main app): CoreUI components + Bootstrap utility classes.

```tsx
// Use CoreUI components
<CCard className="mb-4 border-0 shadow-sm">
  <CCardBody className="p-4">
    <div className="d-flex justify-content-between align-items-start mb-2">
```

**In `flexdesk-ui`** (shared library): Tailwind CSS utility classes.

```tsx
<div className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${className}`}>
```

**For variant maps** (status badges, priority indicators): use a `Record` config object.

```tsx
const statusConfig: Record<Status, { color: string; label: string }> = {
  SCHEDULED: { color: 'info', label: 'Scheduled' },
  IN_PROGRESS: { color: 'warning', label: 'In Progress' },
  COMPLETED: { color: 'success', label: 'Completed' },
}
```

### Hook Pattern (React Query)

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@shared/hooks'
import type { Resource, ResourceFilters, CreateResourceInput, UpdateResourceInput } from '../types'

const RESOURCE_KEY = ['resources'] as const

// List
export function useResources(filters: ResourceFilters = {}) {
  return useQuery({
    queryKey: [...RESOURCE_KEY, filters],
    queryFn: () => api.get<Resource[]>('/resources', { params: filters as Record<string, string> }),
  })
}

// Single
export function useResource(id: string) {
  return useQuery({
    queryKey: [...RESOURCE_KEY, id],
    queryFn: () => api.get<Resource>(`/resources/${id}`),
    enabled: !!id,
  })
}

// Create
export function useCreateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateResourceInput) => api.post<Resource>('/resources', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEY })
    },
  })
}

// Update
export function useUpdateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateResourceInput & { id: string }) =>
      api.put<Resource>(`/resources/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEY })
      queryClient.invalidateQueries({ queryKey: [...RESOURCE_KEY, id] })
    },
  })
}

// Delete
export function useDeleteResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEY })
    },
  })
}
```

### Type Pattern

```tsx
// Import canonical enums from shared types, re-export
import { ResourceStatus, ResourcePriority } from '@service-flex/types'
export { ResourceStatus, ResourcePriority }

// Entity interface
export interface Resource {
  id: string
  workspaceId: string
  title: string
  description?: string
  status: ResourceStatus
  // Sync metadata (always include for offline support)
  syncStatus: SyncStatus
  lastSyncedAt?: string
  syncVersion: number
  createdAt: string
  updatedAt: string
}

// Filters
export interface ResourceFilters {
  status?: ResourceStatus
  assignedTo?: string
}

// Create input — only user-provided fields
export interface CreateResourceInput {
  title: string
  description?: string
  status?: ResourceStatus
}

// Update input — partial of create
export interface UpdateResourceInput extends Partial<CreateResourceInput> {
  status?: ResourceStatus
}
```

### Barrel Exports

**Component barrel** (`components/index.ts`):
```tsx
export { ResourceStatusBadge } from './ResourceStatusBadge'
export { ResourceCard } from './ResourceCard'
```

**Hook barrel** (`hooks/index.ts`):
```tsx
export { useResources, useResource, useCreateResource, useUpdateResource, useDeleteResource } from './useResources'
```

**Feature barrel** (`index.ts`):
```tsx
export * from './types'
export * from './hooks'
export * from './components'
```

---

## Templates by Type

### `--type display` (Presentational Component)

Creates a single component file + updates the barrel export.

```tsx
import { CBadge } from '@coreui/react'
import type { ResourceStatus } from '../types'

const statusConfig: Record<ResourceStatus, { color: string; label: string }> = {
  ACTIVE: { color: 'success', label: 'Active' },
  INACTIVE: { color: 'secondary', label: 'Inactive' },
}

interface Props {
  status: ResourceStatus
}

export function ResourceStatusBadge({ status }: Props) {
  const config = statusConfig[status] || statusConfig.ACTIVE

  return (
    <CBadge color={config.color} shape="rounded-pill">
      {config.label}
    </CBadge>
  )
}
```

### `--type page` (Page Component)

Creates a page file with data fetching, loading/error guards, and PageHeader.

### `--type hook` (Data Hook)

Creates a `use{Domain}.ts` file with full CRUD hooks using React Query.

### `--type feature` (Full Feature Module)

Scaffolds the complete directory structure:
- `types.ts` with entity, filters, create/update input interfaces
- `hooks/use{Domain}.ts` with CRUD hooks
- `hooks/index.ts` barrel
- `components/` with a status badge and card component
- `components/index.ts` barrel
- `pages/{Domain}List.tsx` and `pages/{Domain}Detail.tsx`
- `index.ts` feature barrel

---

## Checklist (verify before finishing)

- [ ] No semicolons anywhere
- [ ] Import order: router → third-party → app aliases → relative → `import type`
- [ ] Props interface named `Props` (not `{Component}Props`)
- [ ] Named function exports (`export function`), no `React.FC`
- [ ] React Query hooks use `const KEY = ['name'] as const`
- [ ] Barrel `index.ts` files created/updated for every new directory
- [ ] Feature `index.ts` re-exports `./types`, `./hooks`, `./components`
- [ ] Types import enums from `@service-flex/types` and re-export
- [ ] Page components follow loading → error → content guard order
- [ ] CoreUI components + Bootstrap classes in preview-v2; Tailwind in flexdesk-ui
