# PRD: flexdesk-utils -- Deployment Readiness

## Introduction

`flexdesk-utils` is a pure TypeScript utility library with zero framework dependencies, consumed by every package in the FlexDesk monorepo (server, admin, agent, preview, website). It is built with tsup and exposes four modules via subpath exports: `date`, `format`, `validation`, and `string`. Currently the library has reasonable function coverage but zero tests, incomplete JSDoc documentation, and gaps in timezone-aware date handling and international phone formatting. This PRD brings the package to production-grade quality.

## Goals

- Achieve 100% unit test coverage for all exported utility functions
- Harden edge-case handling in validation and formatting functions
- Add timezone-aware date utilities required by service businesses scheduling in local time
- Ensure international phone number formatting works beyond US-only
- Add missing currency formatting edge cases (zero amounts, negative amounts, large numbers)
- Add complete JSDoc documentation with `@param`, `@returns`, and `@example` tags on every export
- Verify the package.json exports map produces correct builds via tsup
- Keep the library at zero runtime dependencies

## User Stories

### US-001: Add Jest Test Infrastructure

**Description:** As a developer, I want a working Jest configuration so that I can run `pnpm test` in `flexdesk-utils` and see test results.

**Acceptance Criteria:**
- [ ] Add `jest.config.ts` with TypeScript support (ts-jest or @swc/jest)
- [ ] Add `@types/jest` and test runner to devDependencies
- [ ] Create test file structure: `src/date/index.test.ts`, `src/format/index.test.ts`, `src/validation/index.test.ts`, `src/string/index.test.ts`
- [ ] Confirm `tsconfig.json` exclude pattern `**/*.test.ts` already covers test files (it does)
- [ ] Running `pnpm test` executes Jest and exits cleanly with 0 tests initially
- [ ] Typecheck passes

### US-002: Unit Tests for Date Module

**Description:** As a developer, I want comprehensive tests for all 8 date functions (`isToday`, `isPast`, `isFuture`, `startOfDay`, `endOfDay`, `addDays`, `differenceInDays`, `toISODateString`, `parseISODate`) so that regressions are caught.

**Acceptance Criteria:**
- [ ] `isToday` tested with today's date (true), yesterday (false), tomorrow (false)
- [ ] `isPast` tested with past date (true), future date (false), edge case near now
- [ ] `isFuture` tested with future date (true), past date (false)
- [ ] `startOfDay` returns Date with hours/minutes/seconds/ms all zero
- [ ] `endOfDay` returns Date with 23:59:59.999
- [ ] `addDays` tested with positive, negative, and zero days; month/year boundary crossing
- [ ] `differenceInDays` tested with same day (0 or 1 given ceil behavior), multi-day, reversed argument order
- [ ] `toISODateString` returns `YYYY-MM-DD` format string
- [ ] `parseISODate` correctly parses `2024-01-15` and `2024-12-31T23:59:59Z`
- [ ] All tests pass via `pnpm test`
- [ ] Typecheck passes

### US-003: Unit Tests for Format Module

**Description:** As a developer, I want comprehensive tests for all 6 format functions (`formatCurrency`, `formatNumber`, `formatPercent`, `formatPhoneNumber`, `formatBytes`, `formatDuration`) so edge cases are covered.

**Acceptance Criteria:**
- [ ] `formatCurrency` tested with: default USD ($1,234.56), zero ($0.00), negative (-$5.00), custom locale (e.g., de-DE with EUR), custom fraction digits
- [ ] `formatNumber` tested with: small numbers, thousands (1,000), millions, zero, negative
- [ ] `formatPercent` tested with: 0.5 -> 50%, 1.0 -> 100%, 0.0 -> 0%, custom decimals
- [ ] `formatPhoneNumber` tested with: 10-digit US number, number with country code prefix, number with existing formatting, non-matching input returns original
- [ ] `formatBytes` tested with: 0 -> "0 Bytes", 1024 -> "1 KB", 1048576 -> "1 MB", custom decimal places
- [ ] `formatDuration` tested with: 30 -> "30m", 60 -> "1h", 90 -> "1h 30m", 0 -> "0m"
- [ ] All tests pass via `pnpm test`
- [ ] Typecheck passes

### US-004: Unit Tests for Validation Module

**Description:** As a developer, I want comprehensive tests for all 8 validation functions so that edge cases in email, phone, URL, UUID, and ZIP validation are covered.

**Acceptance Criteria:**
- [ ] `isValidEmail`: valid standard emails, emails with + and . in local part, reject missing domain, reject double dots, reject trailing dot
- [ ] `isValidPhone`: valid 10-digit, valid 11-digit with country code, valid 15-digit international, reject 9 digits, reject 16+ digits, phone with dashes/parens/spaces cleaned correctly
- [ ] `isValidUrl`: valid https URL, valid http URL, reject plain string, reject missing protocol
- [ ] `isEmpty`: null (true), undefined (true), "" (true), " " (true), [] (true), {} (true), "hello" (false), [1] (false), {a:1} (false), 0 (false), false (false)
- [ ] `isValidUuid`: valid v4 UUID (true), uppercase UUID (true), reject short string, reject wrong version nibble position
- [ ] `isValidZipCode`: "12345" (true), "12345-6789" (true), reject "1234", reject "123456", reject "abcde"
- [ ] `isValidLength`: within bounds (true), at min boundary (true), at max boundary (true), below min (false), above max (false)
- [ ] `isInRange`: within range, at boundaries, outside range
- [ ] All tests pass via `pnpm test`
- [ ] Typecheck passes

### US-005: Unit Tests for String Module

**Description:** As a developer, I want comprehensive tests for all 10 string functions so that string transformations are reliable.

**Acceptance Criteria:**
- [ ] `capitalize`: "hello" -> "Hello", "" -> "", single char "a" -> "A"
- [ ] `toTitleCase`: "hello world" -> "Hello World", already title case preserved, single word
- [ ] `toCamelCase`: "hello world" -> "helloWorld", "hello-world" -> "helloWorld", "hello_world" -> "helloWorld"
- [ ] `toSnakeCase`: "helloWorld" -> "hello_world", "Hello World" -> "hello_world", "hello-world" -> "hello_world"
- [ ] `toKebabCase`: "helloWorld" -> "hello-world", "Hello World" -> "hello-world", "hello_world" -> "hello-world"
- [ ] `truncate`: short string unchanged, long string truncated with "...", custom suffix, exact boundary length
- [ ] `removeWhitespace`: spaces removed, tabs removed, newlines removed, multiple consecutive whitespace
- [ ] `getInitials`: "John Doe" -> "JD", "Alice Bob Charlie" -> "AB" (default max 2), single name "Alice" -> "A", custom maxLength
- [ ] `pluralize`: count=1 returns singular, count=2 returns default plural, custom plural form used
- [ ] `slugify`: "Hello World!" -> "hello-world", leading/trailing hyphens removed, multiple spaces collapsed
- [ ] All tests pass via `pnpm test`
- [ ] Typecheck passes

### US-006: International Phone Number Formatting

**Description:** As a service business user, I want phone numbers formatted correctly for international customers, not just US format.

**Acceptance Criteria:**
- [ ] `formatPhoneNumber` continues to format 10-digit US numbers as `(XXX) XXX-XXXX`
- [ ] Numbers with leading `1` (11 digits) format as `+1 (XXX) XXX-XXXX`
- [ ] Add an optional `country` parameter or detection: if the number starts with a recognized country code and has the right length, prefix with `+`
- [ ] Numbers that do not match any known pattern are returned unchanged (current fallback behavior preserved)
- [ ] Existing tests updated to cover new behavior
- [ ] Typecheck passes

### US-007: Timezone-Aware Date Utilities

**Description:** As a service business scheduling jobs in local time, I want date utilities that handle timezone context so that job start/end times display correctly for the business's local timezone.

**Acceptance Criteria:**
- [ ] Add `formatDateInTimezone(date: Date, timezone: string, formatStr: string): string` that formats a UTC date in a given IANA timezone (e.g., "America/New_York") using `Intl.DateTimeFormat`
- [ ] Add `getLocalDateParts(date: Date, timezone: string): { year, month, day, hour, minute }` that returns date parts in a given timezone
- [ ] Add `isSameLocalDay(dateA: Date, dateB: Date, timezone: string): boolean` that compares two dates in a given timezone
- [ ] All new functions have unit tests
- [ ] Zero new runtime dependencies (use built-in `Intl.DateTimeFormat` only)
- [ ] JSDoc with `@example` tags on each new function
- [ ] Typecheck passes

### US-008: Currency Formatting Edge Cases

**Description:** As a developer, I want `formatCurrency` to handle edge cases correctly so that invoices and pricing display properly.

**Acceptance Criteria:**
- [ ] `formatCurrency(0)` returns "$0.00"
- [ ] `formatCurrency(-50)` returns "-$50.00" (or locale-appropriate negative format)
- [ ] `formatCurrency(999999.99)` returns "$999,999.99"
- [ ] `formatCurrency(0.1 + 0.2)` does not produce floating-point artifacts (returns "$0.30")
- [ ] Add `formatCurrencyCompact(amount, options)` that formats large amounts as "$1.2K", "$3.5M" using `Intl.NumberFormat` compact notation
- [ ] All new functions have unit tests
- [ ] Typecheck passes

### US-009: JSDoc Documentation for All Exports

**Description:** As a developer consuming this library, I want every exported function to have complete JSDoc with `@param`, `@returns`, and `@example` tags so that IDE autocomplete is useful.

**Acceptance Criteria:**
- [ ] Every function in `src/date/index.ts` has `@param`, `@returns`, `@example`
- [ ] Every function in `src/format/index.ts` has `@param`, `@returns`, `@example`
- [ ] Every function in `src/validation/index.ts` has `@param`, `@returns`, `@example`
- [ ] Every function in `src/string/index.ts` has `@param`, `@returns`, `@example`
- [ ] The `CurrencyFormatOptions` interface has JSDoc on each property
- [ ] Typecheck passes

### US-010: Verify Package Exports and Build

**Description:** As a monorepo maintainer, I want to verify that `package.json` exports map, `tsup.config.ts` entry points, and the built output all align correctly so that consumers can import from both root and subpath exports.

**Acceptance Criteria:**
- [ ] Run `pnpm build` in flexdesk-utils and confirm it exits cleanly
- [ ] Verify `dist/index.js`, `dist/index.mjs`, `dist/index.d.ts` exist
- [ ] Verify `dist/date/index.js`, `dist/date/index.mjs`, `dist/date/index.d.ts` exist
- [ ] Verify `dist/format/index.js`, `dist/format/index.mjs`, `dist/format/index.d.ts` exist
- [ ] Verify `dist/validation/index.js`, `dist/validation/index.mjs`, `dist/validation/index.d.ts` exist
- [ ] Verify `dist/string/index.js`, `dist/string/index.mjs`, `dist/string/index.d.ts` exist
- [ ] Confirm that `import { isValidEmail } from 'flexdesk-utils'` resolves in consuming packages
- [ ] Confirm that `import { isValidEmail } from 'flexdesk-utils/validation'` resolves in consuming packages
- [ ] Typecheck passes

## Non-Goals

- Adding runtime dependencies (e.g., date-fns, libphonenumber) -- this library must remain zero-dependency
- Adding React components or hooks -- this is a pure TypeScript utility library
- Adding build-time code generation or macros
- Internationalization (i18n) of error messages -- functions return booleans or formatted strings, not error messages
- Adding a CLI interface to the utility functions
- Supporting Node.js-only APIs (must work in browser and Node.js)

## Technical Considerations

- **Test runner:** Jest is already configured in `package.json` scripts and `project.json`. Need to add `jest.config.ts` and `ts-jest` or `@swc/jest` as devDependencies.
- **Timezone handling:** Use `Intl.DateTimeFormat` with `timeZone` option (supported in all modern runtimes). Do NOT add `date-fns-tz` or similar.
- **Floating point:** `formatCurrency` already uses `Intl.NumberFormat` which handles floating-point correctly. Verify with `0.1 + 0.2` test case.
- **Phone formatting:** The current `formatPhoneNumber` strips all non-digits then matches exactly 10 digits. International support must preserve the fallback behavior for unrecognized formats.
- **tsup build:** Entry points in `tsup.config.ts` already match the `package.json` exports map. Both CJS and ESM formats are generated. Sourcemaps and declaration files are enabled.
- **Consumed by:** flexdesk-server (NestJS), flexdesk-admin (React), flexdesk-agent (React), flexdesk-preview-v2 (React), flexdesk-website (Next.js). Changes must not break any consumer.
- **CI integration:** Tests should be runnable via `pnpm nx run flexdesk-utils:test` in the monorepo pipeline.
