// features/keyCustomers/constants.js
// Pure constants — no imports, so they are usable from tests and any layer.

export const KEY_VISIT_GAP_DAYS = 14; // default: visit a key customer at least every N days
export const KEY_FREQ_OPTIONS = Object.freeze([7, 10, 14, 21, 30, 45, 60]);
export const ADD_PREVIEW_LIMIT = 40; // rows shown in the "Add customers" list before "Show all"

export const KEY_FILTERS = Object.freeze([
  { id: "all", label: "All" },
  { id: "due", label: "Overdue" },
  { id: "month", label: "Not visited this month" },
]);

export const KEY_SORTS = Object.freeze([
  { id: "attention", label: "Needs visit first" },
  { id: "name", label: "A–Z" },
]);

export const KEY_API = Object.freeze({ base: "/api/dsr/key-customers" });
