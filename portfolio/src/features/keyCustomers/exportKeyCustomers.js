// features/keyCustomers/exportKeyCustomers.js
// Excel download of key customers: the Customer Master columns + visit-rule columns.
import { exportCustomersXlsx, daysSince } from "../dsr/shared";
import { gapOf, isThisMonth } from "./keyStatus";

const lastDays = (history) => (history[0] ? daysSince(history[0].date) : null);

// [header, column width, (name, customer, history) => cell value]
export const KEY_EXTRA_COLUMNS = [
  ["Days Since Last Visit", 20, (_n, _c, h) => lastDays(h) ?? "Never visited"],
  ["Visit Every (days)", 18, (_n, c) => gapOf(c)],
  [
    "Visit Status",
    14,
    (_n, c, h) => {
      const d = lastDays(h);
      return d === null || d >= gapOf(c) ? "Needs visit" : "OK";
    },
  ],
  ["Visited This Month", 18, (_n, _c, h) => (h[0] && isThisMonth(h[0].date) ? "Yes" : "No")],
];

/** Returns the number of customers exported. */
export const exportKeyCustomers = ({ customers, names, historyMap }) =>
  exportCustomersXlsx(customers, names, historyMap, {
    sheetName: "Key Customers",
    filePrefix: "DSR_Key_Customers",
    extraCols: KEY_EXTRA_COLUMNS,
  });
