// features/dsr/shared/format.js
// Pure formatting / parsing helpers (no React, no DOM) — safe to unit-test.

export const toNum = (v) => {
  if (v === "" || v === undefined || v === null) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};
export const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
export const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
// Whole days between `d` and `now` (never negative); null for an invalid date.
// `now` is injectable so the function is deterministic in tests.
export const daysSince = (d, now = Date.now()) => {
  const t = new Date(d).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / 86400000));
};
export const fmtL = (n) => `₹${Math.round((Number(n) || 0) * 10) / 10}L`;
// "+91 98765 43210" -> "9876543210"
export const cleanMobile = (v) =>
  String(v ?? "")
    .replace(/\D/g, "")
    .replace(/^(91|0)(?=\d{10}$)/, "")
    .slice(0, 10);
export const isValidMobile = (v) => /^[6-9]\d{9}$/.test(v || "");
export const fmtMobile = (v) => (v ? `+91 ${v.slice(0, 5)} ${v.slice(5)}` : "");
