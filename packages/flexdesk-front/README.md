# flexdesk-front

Status: **Experimental / Reference** -- this package contains UI component explorations and is not imported by any other package in the monorepo.

## What it contains

- `simple-jobber/` -- a set of React components modeled after the Jobber "Atlantis" design system, including:
  - Dashboard, Clients, Jobs, Invoices, Requests, Schedule, and Stripe views
  - Atlantis-style primitives (Card, Table, Form, Drawer, Combobox, etc.)
  - Skeleton loading states and icon components

## Notes

- This package has no `package.json` and is not buildable as a standalone workspace member.
- Components here may serve as reference material for building FlexDesk's own UI patterns.
- If these components are no longer useful as reference, this directory can be safely deleted.
