// features/dsr/shared/excel.js
// Customer Excel export (shared by Customer Master and Key Customers) + file download helper.
import { XLSX } from "@/lib/xlsx";
import { fmtDate, toNum } from "./format";

export const CUSTOMER_XLSX_COLS = [
  ["Customer", 28, (n) => n],
  ["Area", 18, (n, c) => c.area],
  ["Distributor", 20, (n, c) => c.distributor],
  ["Project Stage", 34, (n, c) => c.stage],
  ["Potential - Dyes (Rs L/mth)", 16, (n, c) => toNum(c.potDyes)],
  ["Potential - Aux (Rs L/mth)", 16, (n, c) => toNum(c.potAux)],
  ["Existing Bus: Dyes (Rs L/mth)", 16, (n, c) => toNum(c.exDyes)],
  ["Existing Bus: Aux (Rs L/mth)", 16, (n, c) => toNum(c.exAux)],
  ["ABP AM26 (Rs L)", 14, (n, c) => toNum(c.abp)],
  ["Contact Person", 22, (n, c) => c.contactPerson || ""],
  ["Designation", 18, (n, c) => c.designation || ""],
  ["Mobile", 15, (n, c) => c.mobile || ""],
  ["Alternate Mobile", 15, (n, c) => c.altMobile || ""],
  ["Email", 28, (n, c) => c.email || ""],
  ["Address", 34, (n, c) => c.address || ""],
  ["GSTIN", 18, (n, c) => c.gstin || ""],
  ["Notes", 36, (n, c) => c.notes || ""],
];
export const XL_HEAD_STYLE = {
  font: { bold: true, color: { rgb: "0A0B10" }, sz: 11 },
  fill: { patternType: "solid", fgColor: { rgb: "D4AF6A" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: "A8823A" } },
    bottom: { style: "thin", color: { rgb: "A8823A" } },
    left: { style: "thin", color: { rgb: "A8823A" } },
    right: { style: "thin", color: { rgb: "A8823A" } },
  },
};
export const XL_CELL_STYLE = (zebra) => ({
  font: { sz: 10.5 },
  fill: zebra
    ? { patternType: "solid", fgColor: { rgb: "F6F1E6" } }
    : undefined,
  alignment: { vertical: "center", wrapText: true },
  border: {
    bottom: { style: "hair", color: { rgb: "CFC7B5" } },
  },
});
export const styleSheet = (ws, widths, nRows, nCols) => {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
  ws["!rows"] = [{ hpt: 34 }];
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(nRows, 1), c: nCols - 1 },
    }),
  };
  for (let c = 0; c < nCols; c++) {
    const a = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[a]) ws[a].s = XL_HEAD_STYLE;
    for (let r = 1; r <= nRows; r++) {
      const b = XLSX.utils.encode_cell({ r, c });
      if (ws[b]) ws[b].s = XL_CELL_STYLE(r % 2 === 0);
    }
  }
};
// opts (all optional): { sheetName, filePrefix, extraCols: [[header, width, (name, customer, history) => value]] }
export const exportCustomersXlsx = (customers, names, historyMap, opts = {}) => {
  const {
    sheetName = "Customers",
    filePrefix = "DSR_Customers",
    extraCols = [],
  } = opts;
  const head = [
    ...CUSTOMER_XLSX_COLS.map((c) => c[0]),
    "Total Visits",
    "Last Visit",
    ...extraCols.map((c) => c[0]),
  ];
  const body = names.map((n) => {
    const c = customers[n] || {};
    const h = historyMap[n] || [];
    return [
      ...CUSTOMER_XLSX_COLS.map((col) => col[2](n, c)),
      h.length,
      h[0] ? fmtDate(h[0].date) : "",
      ...extraCols.map((col) => col[2](n, c, h)),
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
  styleSheet(
    ws,
    [...CUSTOMER_XLSX_COLS.map((c) => c[1]), 12, 16, ...extraCols.map((c) => c[1])],
    body.length,
    head.length,
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${filePrefix}_${stamp}.xlsx`,
  );
  return body.length;
};

export const downloadBlob = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};
