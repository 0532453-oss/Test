This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Atlantis Component Library

FlexDesk uses the Atlantis design system for consistent UI components. The local implementation is located in `src/components/atlantis/`.

### AtlantisContext Configuration

The app is wrapped with Atlantis context providers in `AppLayout`. Configuration includes:

```tsx
import { AtlantisContext, AtlantisThemeContext, AtlantisPortalContent } from '@/components/atlantis';

<AtlantisContext
  locale="en-US"
  dateFormat="MM/dd/yyyy"
  timeFormat="hh:mm a"
  currencySymbol="$"
  floatSeparators={{ decimalSeparator: '.', thousandsSeparator: ',' }}
>
  <AtlantisThemeContext mode="light" overrideTokens={customTokens}>
    <AtlantisPortalContent>
      {/* App content */}
    </AtlantisPortalContent>
  </AtlantisThemeContext>
</AtlantisContext>
```

### Available Components

| Component | Usage |
|-----------|-------|
| `Button` | Primary/Secondary/Tertiary buttons with icon support |
| `Card` | Container with accent colors and elevation |
| `StatusLabel` | Status badges with semantic colors |
| `StatusIndicator` | Compact status dots |
| `InputText` | Text inputs with multiline support |
| `InputEmail` | Email inputs with validation |
| `InputPhoneNumber` | Phone inputs with formatting |
| `InputNumber` | Numeric inputs with min/max/step |
| `InputDate` | Date picker inputs |
| `InputTime` | Time picker inputs |
| `InputPassword` | Password inputs with visibility toggle |
| `InputFile` | File upload with drag-and-drop |
| `Select` | Dropdown selects |
| `MultiSelect` | Multi-value selects |
| `Combobox` | Searchable selects with lazy loading |
| `Checkbox` | Checkbox inputs |
| `RadioGroup` | Radio button groups |
| `Switch` | Toggle switches |
| `Form` / `FormField` | Form containers with validation |
| `Modal` | Dialog modals |
| `ConfirmationModal` | Delete/action confirmation dialogs |
| `Drawer` | Side panel drawers |
| `Popover` | Floating popovers |
| `Tooltip` | Hover tooltips |
| `Menu` | Dropdown menus |
| `Toast` | Notification toasts |
| `Banner` | Page-level alerts |
| `DataTable` | Data tables with sorting/pagination |
| `Tabs` | Tab navigation |
| `Heading` | Typography headings (level 1-6) |
| `Text` | Typography text with variations |
| `Icon` | SVG icons from @jobber/design |
| `Spinner` | Loading spinners |
| `Glimmer` | Loading skeletons |

### Component Usage Patterns

**Buttons with icons:**
```tsx
import { Button } from '@/components/atlantis';

<Button type="primary" onClick={handleSave}>Save</Button>
<Button type="secondary" icon="edit" onClick={handleEdit}>Edit</Button>
<Button type="tertiary" icon="trash" ariaLabel="Delete" onClick={handleDelete} />
```

**Status badges:**
```tsx
import { StatusLabel, clientStatusToSemantic, formatStatusLabel } from '@/components/atlantis';

<StatusLabel
  label={formatStatusLabel(client.status)}
  status={clientStatusToSemantic[client.status]}
/>
```

**Form inputs:**
```tsx
import { InputText, InputEmail, Select, FormField } from '@/components/atlantis';

<FormField label="Email" required error={errors.email}>
  <InputEmail value={email} onChange={setEmail} />
</FormField>
```

### Theme Tokens

Available CSS variables for theming:
- `--color-surface`, `--color-surface-secondary`
- `--color-text`, `--color-text-secondary`
- `--color-interactive`, `--color-interactive-hover`
- `--color-critical`, `--color-warning`, `--color-success`, `--color-informative`
- `--spacing-base`, `--spacing-tight`, `--spacing-loose`
- `--border-radius`, `--shadow-base`, `--shadow-elevated`

### Migration from Shadcn/Tailwind

When migrating existing components:
1. Replace `<button className="...">` with `<Button type="primary/secondary/tertiary">`
2. Replace `<Card>` from shadcn with Atlantis `<Card accent="blue">`
3. Replace status badges with `<StatusLabel status="success/warning/critical/informative">`
4. Replace icons from lucide-react with `<Icon name="iconName">`
5. Wrap forms with `<Form onSubmit={...}>` and use `<FormField>` for validation

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
