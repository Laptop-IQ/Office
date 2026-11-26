import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gapOf, pickKeyFields, mergeKeyFields, countKeyCustomers, isThisMonth, matchesCustomer,
  partitionCustomers, buildKeyRows, countRows, filterRows, sortRows,
  statusText, frequencyOptions, addCandidates,
} from "../keyStatus.js";
import { daysSince } from "../../dsr/shared/format.js";
import { KEY_VISIT_GAP_DAYS, ADD_PREVIEW_LIMIT } from "../constants.js";

const NOW = new Date("2026-11-22T12:00:00Z");
const ago = (d) => new Date(NOW.getTime() - d * 86400000).toISOString();
const mk = (extra = {}) => ({ area: "Faridabad", distributor: "Supple", potDyes: 2, potAux: 1, ...extra });

const customers = {
  "OVERDUE CO": mk({ isKey: true, mobile: "9812345678" }), // 30d, gap 14 → overdue 16
  "OKAY CO": mk({ isKey: true }),                           // 3d,  gap 14 → next in 11
  "WEEKLY CO": mk({ isKey: true, keyVisitDays: 7 }),        // 10d, gap 7  → overdue 3
  "NEVER CO": mk({ isKey: true }),                          // never
  "PLAIN CO": mk(),
};
const historyMap = {
  "OVERDUE CO": [{ date: ago(30), outcome: "Sample sent" }],
  "OKAY CO": [{ date: ago(3) }],
  "WEEKLY CO": [{ date: ago(10) }],
};
const { keyNames } = partitionCustomers(customers);
const rows = () => buildKeyRows({ names: keyNames, customers, historyMap, now: NOW });
const byName = (n) => rows().find((r) => r.name === n);

test("daysSince: deterministic with injected now, never negative, null for junk", () => {
  assert.equal(daysSince(ago(5), NOW.getTime()), 5);
  assert.equal(daysSince(new Date(NOW.getTime() + 86400000).toISOString(), NOW.getTime()), 0);
  assert.equal(daysSince("not a date", NOW.getTime()), null);
});

test("gapOf / pickKeyFields / mergeKeyFields defaults", () => {
  assert.equal(gapOf({}), KEY_VISIT_GAP_DAYS);
  assert.equal(gapOf({ keyVisitDays: 7 }), 7);
  assert.equal(gapOf({ keyVisitDays: 0 }), KEY_VISIT_GAP_DAYS);
  assert.deepEqual(pickKeyFields({ isKey: 1, keyVisitDays: "21" }), { isKey: true, keyVisitDays: 21 });
  assert.deepEqual(pickKeyFields(undefined), { isKey: false, keyVisitDays: 14 });
  const merged = mergeKeyFields({ name: "X" }, { isKey: true, keyVisitDays: 30 });
  assert.equal(merged.isKey, true); assert.equal(merged.keyVisitDays, 30);
  assert.equal(mergeKeyFields({ isKey: false }, { isKey: true }).isKey, false); // new value wins
});

test("countKeyCustomers + partitionCustomers", () => {
  assert.equal(countKeyCustomers(customers), 4);
  assert.equal(countKeyCustomers(undefined), 0);
  const p = partitionCustomers(customers);
  assert.deepEqual(p.otherNames, ["PLAIN CO"]);
  assert.deepEqual(p.keyNames, [...p.keyNames].sort((a, b) => a.localeCompare(b)));
});

test("isThisMonth uses the injected clock", () => {
  assert.equal(isThisMonth("2026-11-03", NOW), true);
  assert.equal(isThisMonth("2026-10-31", NOW), false);
  assert.equal(isThisMonth("2025-11-03", NOW), false); // same month, other year
  assert.equal(isThisMonth("junk", NOW), false);
});

test("buildKeyRows: since / gap / due / overdueBy per customer rule", () => {
  assert.deepEqual(
    ["OVERDUE CO", "OKAY CO", "WEEKLY CO", "NEVER CO"].map((n) => [byName(n).since, byName(n).gap, byName(n).due, byName(n).overdueBy]),
    [[30, 14, true, 16], [3, 14, false, -11], [10, 7, true, 3], [null, 14, true, 99999]],
  );
});

test("due boundary: exactly at the gap is due", () => {
  const c = { A: mk({ isKey: true, keyVisitDays: 7 }) };
  const r = buildKeyRows({ names: ["A"], customers: c, historyMap: { A: [{ date: ago(7) }] }, now: NOW })[0];
  assert.equal(r.due, true); assert.equal(statusText(r), "Due today · last visit 7d ago");
});

test("sortRows: attention = most overdue first; name = A–Z; input not mutated", () => {
  const input = rows();
  const before = input.map((r) => r.name).join();
  assert.deepEqual(sortRows(input).map((r) => r.name), ["NEVER CO", "OVERDUE CO", "WEEKLY CO", "OKAY CO"]);
  assert.deepEqual(sortRows(input, "name").map((r) => r.name), ["NEVER CO", "OKAY CO", "OVERDUE CO", "WEEKLY CO"]);
  assert.equal(input.map((r) => r.name).join(), before);
});

test("filterRows: chips + query", () => {
  assert.deepEqual(filterRows(rows(), { chip: "due" }).map((r) => r.name).sort(), ["NEVER CO", "OVERDUE CO", "WEEKLY CO"]);
  assert.equal(filterRows(rows(), { chip: "all", query: "9812" }).length, 1);
  assert.equal(filterRows(rows(), { chip: "all", query: "  " }).length, 4);
  assert.equal(filterRows(rows(), { chip: "due", query: "okay" }).length, 0);
});

test("month chip and countRows agree", () => {
  const month = rows().filter((r) => !r.visitedThisMonth).map((r) => r.name); // Nov 22: only 3d & 10d are this month
  assert.deepEqual(filterRows(rows(), { chip: "month" }).map((r) => r.name), month);
  assert.deepEqual(countRows(rows()), { all: 4, due: 3, month: month.length });
});

test("statusText wording", () => {
  assert.equal(statusText(byName("NEVER CO")), "Never visited");
  assert.equal(statusText(byName("OVERDUE CO")), "Overdue 16d · last visit 30d ago");
  assert.equal(statusText(byName("WEEKLY CO")), "Overdue 3d · last visit 10d ago");
  assert.equal(statusText(byName("OKAY CO")), "Last visit 3d ago · next in 11d");
  assert.equal(statusText({ since: 0, gap: 14, due: false }), "Last visit today · next in 14d");
});

test("frequencyOptions keeps a custom current value", () => {
  assert.deepEqual(frequencyOptions(14), [7, 10, 14, 21, 30, 45, 60]);
  assert.deepEqual(frequencyOptions(15), [7, 10, 14, 15, 21, 30, 45, 60]);
});

test("matchesCustomer searches name, area, distributor, contact, mobile (case-insensitive)", () => {
  const c = { area: "KOSI KALAN", distributor: "Supple", contactPerson: "MR. PRAKASH", mobile: "7678635018" };
  ["colour", "kosi", "supple", "prakash", "7678"].forEach((q) => assert.equal(matchesCustomer("COLOUR TOUCH", c, q), true, q));
  assert.equal(matchesCustomer("COLOUR TOUCH", c, "zzz"), false);
});

test("addCandidates: preview limit, search bypasses it, showAll", () => {
  const many = Object.fromEntries(Array.from({ length: 55 }, (_, i) => [`C${String(i).padStart(2, "0")}`, mk()]));
  const names = Object.keys(many);
  const a = addCandidates(names, many);
  assert.equal(a.shown.length, ADD_PREVIEW_LIMIT); assert.equal(a.hiddenCount, 55 - ADD_PREVIEW_LIMIT);
  assert.equal(addCandidates(names, many, { showAll: true }).shown.length, 55);
  const q = addCandidates(names, many, { query: "c5" });
  assert.deepEqual(q.shown, ["C50", "C51", "C52", "C53", "C54"]); assert.equal(q.hiddenCount, 0);
});
