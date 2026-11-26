// features/dsr/shared/routes.js
// URL map + parser for the DSR area (sub-routes of /DailySalesReport).
import { INSIGHT_KINDS } from "./insightKinds";

// ══════════════════════════════════════════════════════════════════════════
//  PAGES  (popups ab full pages hain)
//  /DailySalesReport/customer/new
//  /DailySalesReport/customer/:name/edit
//  /DailySalesReport/customer/:name/history
//  /DailySalesReport/visits/:name/:monthKey
//  /DailySalesReport/analysis/:monthKey/:period/by/:stage|distributor|area[/:value]
//  /DailySalesReport/record/:id/edit
// ══════════════════════════════════════════════════════════════════════════
export const BASE = "/DailySalesReport";
export const ROUTES = {
  base: BASE,
  newCustomer: `${BASE}/customer/new`,
  editCustomer: (n) => `${BASE}/customer/${encodeURIComponent(n)}/edit`,
  history: (n) => `${BASE}/customer/${encodeURIComponent(n)}/history`,
  visits: (n, monthKey, half) =>
    `${BASE}/visits/${encodeURIComponent(n)}/${encodeURIComponent(monthKey)}${half ? `?half=${half}` : ""}`,
  period: (monthKey, period) =>
    `${BASE}/analysis/${encodeURIComponent(monthKey)}/${period}`,
  insight: (monthKey, period, kind, value) =>
    `${BASE}/analysis/${encodeURIComponent(monthKey)}/${period}/by/${kind}${
      value ? `/${encodeURIComponent(value)}` : ""
    }`,
  editRecord: (id) => `${BASE}/record/${encodeURIComponent(id)}/edit`,
};

export const safeDecode = (v) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

export const parseRoute = (pathname) => {
  const m = pathname
    .replace(/\/+$/, "")
    .match(/^\/dailysalesreport(?:\/(.*))?$/i);
  const seg = (m && m[1] ? m[1].split("/") : []).map(safeDecode);
  // legacy link of the former Key Customers page → handled by the list (opens Customers › Key view)
  if (seg[0] === "key-customers" && seg.length === 1)
    return { type: "list", openKeyCustomers: true };
  if (seg[0] === "customer" && seg[1] === "new" && seg.length === 2)
    return { type: "customerNew" };
  if (seg[0] === "customer" && seg[1] && seg[2] === "edit")
    return { type: "customerEdit", name: seg[1] };
  if (seg[0] === "customer" && seg[1] && seg[2] === "history")
    return { type: "history", name: seg[1] };
  if (seg[0] === "visits" && seg[1] && seg[2])
    return { type: "visits", name: seg[1], monthKey: seg[2] };
  if (
    seg[0] === "analysis" &&
    seg[1] &&
    seg[2] &&
    seg[3] === "by" &&
    INSIGHT_KINDS[seg[4]]
  )
    return {
      type: "insight",
      monthKey: seg[1],
      period: seg[2],
      kind: seg[4],
      value: seg[5],
    };
  if (seg[0] === "analysis" && seg[1] && seg[2] && !seg[3])
    return { type: "period", monthKey: seg[1], period: seg[2] };
  if (seg[0] === "record" && seg[1] && seg[2] === "edit")
    return { type: "recordEdit", id: seg[1] };
  return { type: "list" };
};

