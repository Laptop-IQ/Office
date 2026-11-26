// features/keyCustomers/keyStatus.js
// All the business rules of the feature as PURE functions (no React, no DOM, no network).
// `now` is injectable everywhere → deterministic tests.
//
// NOTE: relative imports with the .js extension on purpose, so this file can be run by
// plain Node (`npm test`) without the Vite "@" alias.
import { daysSince } from "../dsr/shared/format.js";
import {
  KEY_VISIT_GAP_DAYS,
  KEY_FREQ_OPTIONS,
  ADD_PREVIEW_LIMIT,
} from "./constants.js";

const NEVER = 99999; // "never visited" sorts as the most overdue

// ── customer fields ─────────────────────────────────────────────────────────
export const gapOf = (c) => Number(c?.keyVisitDays) || KEY_VISIT_GAP_DAYS;

export const pickKeyFields = (o) => ({
  isKey: !!o?.isKey,
  keyVisitDays: Number(o?.keyVisitDays) || KEY_VISIT_GAP_DAYS,
});

// Keep the key fields when a customer object is replaced by one that lacks them
// (e.g. Excel import result) — prefer the new value, else the previous one.
export const mergeKeyFields = (next, prev) => ({
  ...next,
  isKey: next?.isKey ?? prev?.isKey ?? false,
  keyVisitDays: next?.keyVisitDays ?? prev?.keyVisitDays ?? KEY_VISIT_GAP_DAYS,
});

export const countKeyCustomers = (customers) =>
  Object.values(customers || {}).filter((c) => c?.isKey).length;

// ── dates ───────────────────────────────────────────────────────────────────
export const isThisMonth = (d, now = new Date()) => {
  const x = new Date(d);
  return (
    !isNaN(x.getTime()) &&
    x.getFullYear() === now.getFullYear() &&
    x.getMonth() === now.getMonth()
  );
};

// ── search ──────────────────────────────────────────────────────────────────
export const matchesCustomer = (name, c, query) =>
  `${name} ${c?.area || ""} ${c?.distributor || ""} ${c?.contactPerson || ""} ${c?.mobile || ""}`
    .toLowerCase()
    .includes(String(query).trim().toLowerCase());

// ── partition ───────────────────────────────────────────────────────────────
export const partitionCustomers = (customers) => {
  const allNames = Object.keys(customers || {}).sort((a, b) => a.localeCompare(b));
  return {
    allNames,
    keyNames: allNames.filter((n) => customers[n]?.isKey),
    otherNames: allNames.filter((n) => !customers[n]?.isKey),
  };
};

// ── key list ────────────────────────────────────────────────────────────────
// One row per key customer. `historyMap[name]` = visits, newest first.
export const buildKeyRows = ({ names, customers, historyMap, now = new Date() }) =>
  names.map((name) => {
    const c = customers[name];
    const history = historyMap?.[name] || [];
    const last = history[0];
    const since = last ? daysSince(last.date, now.getTime()) : null;
    const gap = gapOf(c);
    return {
      name,
      c,
      last,
      since,
      gap,
      visits: history.length,
      due: since === null || since >= gap,
      overdueBy: since === null ? NEVER : since - gap,
      visitedThisMonth: !!last && isThisMonth(last.date, now),
    };
  });

export const countRows = (rows) => ({
  all: rows.length,
  due: rows.filter((r) => r.due).length,
  month: rows.filter((r) => !r.visitedThisMonth).length,
});

export const filterRows = (rows, { query = "", chip = "all" } = {}) =>
  rows.filter(
    (r) =>
      (!query.trim() || matchesCustomer(r.name, r.c, query)) &&
      (chip === "all" ||
        (chip === "due" && r.due) ||
        (chip === "month" && !r.visitedThisMonth)),
  );

// returns a NEW array
export const sortRows = (rows, sort = "attention") =>
  [...rows].sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : b.overdueBy - a.overdueBy || a.name.localeCompare(b.name),
  );

// ── presentation helpers ────────────────────────────────────────────────────
export const statusText = (row) => {
  if (row.since === null) return "Never visited";
  const ago = row.since === 0 ? "today" : `${row.since}d ago`;
  if (row.due) {
    const over = row.since - row.gap;
    return `${over === 0 ? "Due today" : `Overdue ${over}d`} · last visit ${ago}`;
  }
  return `Last visit ${ago} · next in ${row.gap - row.since}d`;
};

// dropdown options: the standard list, plus the current value if it is custom (e.g. 15)
export const frequencyOptions = (gap) =>
  KEY_FREQ_OPTIONS.includes(gap)
    ? [...KEY_FREQ_OPTIONS]
    : [...KEY_FREQ_OPTIONS, gap].sort((a, b) => a - b);

// ── "Add customers" panel ───────────────────────────────────────────────────
export const addCandidates = (otherNames, customers, { query = "", showAll = false } = {}) => {
  const q = query.trim();
  const matches = otherNames.filter((n) => !q || matchesCustomer(n, customers[n], q));
  return {
    matches,
    shown: showAll || q ? matches : matches.slice(0, ADD_PREVIEW_LIMIT),
    hiddenCount: showAll || q ? 0 : Math.max(0, matches.length - ADD_PREVIEW_LIMIT),
  };
};
