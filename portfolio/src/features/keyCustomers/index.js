// features/keyCustomers — public API of the feature (import from here, not from inner files).
//
//   KeyViewSwitch      "All customers | ★ Key customers (n)" switch for the Customer Master card
//   KeyCustomersPanel  the key view itself (toolbar, add panel, rows)
//   KeyStarButton      ⭐ toggle for any customer row
//   useKeyCustomers    state actions (mark/unmark, visit frequency) + toasts
//   countKeyCustomers, pickKeyFields, mergeKeyFields   small helpers for the customers map
export { KeyCustomersPanel } from "./KeyCustomersPanel";
export { KeyViewSwitch } from "./components/KeyViewSwitch";
export { KeyStarButton } from "./components/KeyStarButton";
export { useKeyCustomers } from "./useKeyCustomers";
export { countKeyCustomers, pickKeyFields, mergeKeyFields } from "./keyStatus";
