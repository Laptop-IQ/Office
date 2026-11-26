# Key Customers feature

Priority accounts: mark customers as **key**, see who needs a visit, log a visit / call /
WhatsApp in one tap, set a visit frequency per customer, download Excel.

Where: **Customers tab → "Key customers" view** (a switch inside the Customer Master card — not a separate page),
⭐ on every Customer Master row, `Records → Key only` filter. The old `/DailySalesReport/key-customers` link
still works: it opens that view.

## Layers (dependencies point downwards only)

```
KeyCustomersPanel.jsx       container of the key view: UI state (sort / filter / search / add-panel)
components/KeyViewSwitch    "All customers | ★ Key customers (n)" switch of the Customer Master card
  └─ components/*           presentational, props in → JSX out (no fetch, no business rules)
useKeyCustomers.js          actions: call API → update `customers` map → toast  (optimistic frequency)
  └─ keyCustomersApi.js     the only file that knows the endpoints
keyStatus.js                ALL business rules as pure functions (due / overdue / sort / filter …)
constants.js                numbers & option lists, no imports
exportKeyCustomers.js       Excel columns
../dsr/shared/*             design tokens, Icon, format helpers, http, routes (shared by all DSR screens)
```

Public API (`index.js`): `KeyCustomersPanel`, `KeyViewSwitch`, `KeyStarButton`, `useKeyCustomers`,
`countKeyCustomers`, `pickKeyFields`, `mergeKeyFields`. Import from the folder, not from inner files.

## Business rules (keyStatus.js)

* Each key customer has `keyVisitDays` (default 14). **Due** = never visited, or days since last visit ≥ that value.
* Sort "Needs visit first" = most overdue first; never-visited on top.

## API contract (backend: `routes/keyCustomerRoutes.js`)

| Method | Path | Body | Result |
|---|---|---|---|
| PUT   | `/api/dsr/key-customers`     | `{ ids: string[], isKey: boolean }` | `{ success, matched }` |
| PATCH | `/api/dsr/key-customers/:id` | `{ keyVisitDays: 1..365 }`          | `{ success, data: { _id, isKey, keyVisitDays } }` |

Both require login; every query is scoped to the logged-in user. Errors: `{ success:false, message }`
with 400 (validation) / 404 (not your key customer) / 500.
`isKey` and `keyVisitDays` also come back on every customer from `GET /api/dsr/customers`.

Backend layers: `constants/keyCustomer.js → validators/ → services/keyCustomerService.js (model injected)
→ controllers/keyCustomerController.js → routes/keyCustomerRoutes.js`.

## Styles

Tailwind utilities in JSX (tokens: `bg-ds-*`, `text-ds-*`, `border-ds-*`). Feature-only component classes
(prefix `kc-`) are in `keyCustomers.css` inside `@layer components`, so utilities override them. Generic DSR
classes (`dsr-customer-row`, `dsr-filter-chip`, `dsr-rise` …) come from `features/dsr/dsr.css`.
See `../dsr/shared/README.md` → "Styling" for the conventions and the cascade-layer gotcha.

## Tests

```
cd backend   && npm test     # validators, service (fake model), controller wiring + schema
cd portfolio && npm test     # keyStatus.js business rules (plain node:test, no extra deps)
```
Component/integration tests need a DOM (vitest + @testing-library/react); not added to avoid new dev-dependencies.

## Adding things

* New rule / status → `keyStatus.js` + a test next to it.
* New column in Excel → `KEY_EXTRA_COLUMNS` in `exportKeyCustomers.js`.
* New endpoint → validator → service → controller → route (backend), then `keyCustomersApi.js` + `useKeyCustomers.js`.
