import { loadXLSX } from "@/lib/xlsx";
import { normD } from "../shared";
import { daysToExpiry, fmtQty, isPkgTracked, productStatus, suggestedOrder } from "./store";

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Opens a print-friendly report in a NEW TAB (not a popup window). */
const openPrint = (title, body) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;margin:0;padding:32px;color:#0f172a;background:#fff}
h1{font-size:22px;margin:0 0 4px;letter-spacing:-.01em}.sub{color:#64748b;font-size:12px;margin-bottom:20px}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}.st{padding:10px 16px;border-radius:10px;background:#f1f5f9;min-width:120px}
.st b{display:block;font-size:20px}.st span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0f172a;color:#fff;text-align:left;padding:9px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
td{padding:8px 10px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}.r{text-align:right}.c{text-align:center}
.pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:800}
.ok{background:#d1fae5;color:#047857}.low{background:#fef3c7;color:#b45309}.out{background:#fee2e2;color:#b91c1c}
.btn{margin-bottom:18px;padding:9px 18px;background:#0f172a;color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer}
@media print{.btn{display:none}body{padding:12px}}
.inv{page-break-after:always;margin-bottom:36px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}.inv:last-child{page-break-after:auto}
.inv-h{background:#0f172a;color:#fff;padding:18px 24px;display:flex;justify-content:space-between}
.inv-m{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:16px 24px;border-bottom:1px solid #e2e8f0}
.inv-m span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700;margin-bottom:3px}
</style></head><body><button class="btn" onclick="window.print()">Print / Save as PDF</button>${body}</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
};

const statsHtml = (items) =>
  `<div class="stats">${items.map(([v, l]) => `<div class="st"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>`;

export const printStockReport = ({ title, products, company, showLoc = false }) => {
  const low = products.filter((p) => productStatus(p) === "low").length;
  const out = products.filter((p) => productStatus(p) === "out").length;
  const rows = products
    .map((p, i) => {
      const s = productStatus(p);
      return `<tr><td>${i + 1}</td>${showLoc ? `<td>${esc(p._locName)}</td>` : ""}<td><b>${esc(p.name)}</b>${p.batch ? `<br><small style="color:#64748b">Batch ${esc(p.batch)}</small>` : ""}</td>
<td>${esc(p.category)}</td><td class="r"><b>${fmtQty(p.qty)}</b> ${esc(p.unit)}</td>
<td class="c">${isPkgTracked(p) ? `${p.packageCount} × ${p.packageSize}${esc(p.unit)}` : "—"}</td><td class="r">${fmtQty(p.minQty)} ${esc(p.unit)}</td>
<td class="c"><span class="pill ${s}">${s === "ok" ? "OK" : s === "low" ? "LOW" : "OUT"}</span></td><td>${esc(p.expiry || "")}</td></tr>`;
    })
    .join("");
  return openPrint(
    title,
    `<h1>${esc(title)}</h1><div class="sub">${esc(company)} · Generated ${new Date().toLocaleString("en-IN")}</div>
${statsHtml([[products.length, "Products"], [fmtQty(products.reduce((s, p) => s + (p.qty || 0), 0)), "Total quantity"], [low, "Low stock"], [out, "Out of stock"]])}
<table><thead><tr><th>#</th>${showLoc ? "<th>Location</th>" : ""}<th>Product</th><th>Category</th><th class="r">Qty</th><th class="c">Packages</th><th class="r">Min</th><th class="c">Status</th><th>Expiry</th></tr></thead><tbody>${rows}</tbody></table>`,
  );
};

export const printReorderReport = ({ products, company }) => {
  const rows = products
    .map((p, i) => `<tr><td>${i + 1}</td><td><b>${esc(p.name)}</b></td><td>${esc(p._locName)}</td><td class="r">${fmtQty(p.qty)} ${esc(p.unit)}</td><td class="r">${fmtQty(p.minQty)}</td><td class="r"><b>${fmtQty(suggestedOrder(p))} ${esc(p.unit)}</b></td><td>${esc(p.supplier || "")}</td></tr>`)
    .join("");
  return openPrint(
    "Reorder list",
    `<h1>Reorder list</h1><div class="sub">${esc(company)} · ${new Date().toLocaleString("en-IN")}</div>
${statsHtml([[products.length, "Items to reorder"]])}
<table><thead><tr><th>#</th><th>Product</th><th>Location</th><th class="r">In stock</th><th class="r">Min</th><th class="r">Suggested order</th><th>Supplier</th></tr></thead><tbody>${rows}</tbody></table>`,
  );
};

export const printInvoices = ({ list, company, locName }) => {
  const pages = list
    .map((d) => {
      const nd = normD(d);
      const rows = nd.items
        .map((it, i) => `<tr><td class="c">${i + 1}</td><td><b>${esc(it.productName)}</b>${it.shade ? ` <span style="color:#7c3aed">(${esc(it.shade)})</span>` : ""}</td><td class="r"><b>${fmtQty(it.qtyDispatched)} ${esc(it.unit)}</b></td></tr>`)
        .join("");
      return `<div class="inv"><div class="inv-h"><div><div style="font-size:18px;font-weight:800">DISPATCH INVOICE</div><div style="color:#94a3b8;font-size:11px;margin-top:3px">${esc(company)}</div></div>
<div style="text-align:right"><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">Invoice no.</div><div style="font-family:monospace;font-size:17px;font-weight:800">${esc(d.invoiceNo || d.id)}</div></div></div>
<div class="inv-m"><div><span>Dispatched to</span><b>${esc(d.customerName)}</b></div><div><span>Date</span><b>${esc(d.date)}</b></div><div><span>From location</span><b>${esc(locName(d.location, d.locationName))}</b></div></div>
<table><thead><tr><th class="c">#</th><th>Product</th><th class="r">Quantity</th></tr></thead><tbody>${rows}</tbody></table>
<div style="padding:14px 24px;display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">${esc(d.note || "")}</span><b>Total: ${fmtQty(nd.items.reduce((s, i) => s + i.qtyDispatched, 0))}</b></div></div>`;
    })
    .join("");
  return openPrint("Dispatch invoices", pages);
};

/* ── Excel ── */
const save = (XLSX, wb, name) => XLSX.writeFile(wb, name);
const prodRow = (p, i) => ({
  "S.N": i + 1,
  Location: p._locName || "",
  Product: p.name,
  Category: p.category,
  Qty: p.qty,
  Unit: p.unit,
  "Min Qty": p.minQty,
  "Package Size": p.packageSize || "",
  "No. of Packages": p.packageCount || "",
  Status: productStatus(p).toUpperCase(),
  Batch: p.batch || "",
  Expiry: p.expiry || "",
  "Days to expiry": daysToExpiry(p) ?? "",
  Supplier: p.supplier || "",
  Note: p.reorderNote || "",
});
export const exportProductsExcel = async (products, sheet, filename) => {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products.map(prodRow)), sheet.slice(0, 28));
  save(XLSX, wb, filename);
};
export const exportAllExcel = async (locations, stocks, filename) => {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  locations.forEach((l) =>
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet((stocks[l.id] || []).map((p, i) => prodRow({ ...p, _locName: l.name }, i))),
      l.name.replace(/[\\/?*[\]:]/g, " ").slice(0, 28) || l.id,
    ),
  );
  if (!locations.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No locations yet"]]), "Stock");
  save(XLSX, wb, filename);
};
export const exportReorderExcel = async (products, filename) => {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  const rows = products.map((p, i) => ({
    "S.N": i + 1,
    Product: p.name,
    Location: p._locName,
    "In stock": p.qty,
    Unit: p.unit,
    "Min qty": p.minQty,
    "Suggested order": suggestedOrder(p),
    Supplier: p.supplier || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Reorder");
  save(XLSX, wb, filename);
};
export const exportDispatchExcel = async (list, locName, filename) => {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  const rows = list.flatMap((d) =>
    normD(d).items.map((it) => ({
      Invoice: d.invoiceNo || d.id,
      Date: d.date,
      Customer: d.customerName,
      Location: locName(d.location, d.locationName),
      Product: it.productName,
      Shade: it.shade || "",
      Quantity: it.qtyDispatched,
      Unit: it.unit,
      Note: d.note || "",
    })),
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Dispatches");
  save(XLSX, wb, filename);
};
export const parseProductSheet = async (arrayBuffer, detectColumns) => {
  const XLSX = await loadXLSX();
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (!rows.length) return [];
  const { nameCol, qtyCol, minQtyCol } = detectColumns(rows[0]);
  return rows
    .slice(1)
    .filter((r) => r[nameCol] && String(r[nameCol]).trim())
    .map((r) => ({
      name: String(r[nameCol]).trim(),
      qty: parseFloat(r[qtyCol]) || 0,
      minQty: parseFloat(r[minQtyCol]) || 0,
    }));
};
