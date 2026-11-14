import JSZip from "jszip";
import fs from "node:fs/promises";

// Fills ecofast-template.xlsx / ecosol-template.xlsx by editing the template's own XML.
// Nothing is re-written by a spreadsheet library, so the pictures, ink mark, merged cells,
// column widths, print setup and every style stay exactly as in the template.

// ── small XML helpers ────────────────────────────────────────────────────────
const esc = (v) =>
  String(v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const colNum = (letters) =>
  [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const splitAddr = (a) => {
  const m = a.match(/^([A-Z]+)(\d+)$/);
  return { col: colNum(m[1]), row: Number(m[2]) };
};
const textNode = (t) =>
  `<t${/^\s|\s$|\n/.test(t) ? ' xml:space="preserve"' : ""}>${esc(t)}</t>`;

// "3%" / "3 %" / "3.5 percent" -> 0.03, else null
function parsePercent(v) {
  const m = String(v)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(?:%|percent)$/i);
  if (!m) return null;
  const dec = (m[1].split(".")[1] || "").length;
  return Number((Number(m[1]) / 100).toFixed(dec + 2));
}
// "1:12" -> 0.05 (time of day, as the template's M:L:R cell stores it)
function parseTime(v) {
  const m = String(v)
    .trim()
    .match(/^(\d{1,2}):(\d{1,2})$/);
  return m ? (Number(m[1]) * 60 + Number(m[2])) / 1440 : null;
}
// "2026-11-13" -> Excel date serial
function parseDate(v) {
  const m = String(v)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 + 25569;
}
// "2026-11-13" -> "13-11-2026" (Ecosol's Process sheet shows the date as text: "DATE :13-11-2026")
function dmy(v) {
  const m = String(v)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).trim();
}
// "16" -> 16 (real number). Kept as text: "007", >10 digits, anything with units ("4 gpl")
function plainNumber(v) {
  const t = String(v).trim();
  return /^-?(0|[1-9]\d*)(\.\d+)?$/.test(t) &&
    t.replace(/[-.]/g, "").length <= 10
    ? Number(t)
    : null;
}

class Sheet {
  constructor(xml, percentStyles) {
    this.xml = xml;
    this.percentStyles = percentStyles;
    // merged cells: only the top-left cell of a merge may hold a value
    this.slaves = new Set();
    for (const m of xml.matchAll(/<mergeCell ref="([A-Z]+\d+):([A-Z]+\d+)"/g)) {
      const a = splitAddr(m[1]);
      const b = splitAddr(m[2]);
      for (let r = a.row; r <= b.row; r++)
        for (let c = a.col; c <= b.col; c++)
          if (r !== a.row || c !== a.col) this.slaves.add(`${c},${r}`);
    }
  }
  isSlave(addr) {
    const { col, row } = splitAddr(addr);
    return this.slaves.has(`${col},${row}`);
  }
  _find(addr) {
    return new RegExp(`<c r="${addr}"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)`).exec(
      this.xml,
    );
  }
  _style(addr) {
    const m = this._find(addr);
    return m ? m[1].match(/\bs="(\d+)"/)?.[1] : undefined;
  }
  _put(addr, cellXml) {
    const m = this._find(addr);
    if (m) {
      this.xml =
        this.xml.slice(0, m.index) +
        cellXml +
        this.xml.slice(m.index + m[0].length);
      return;
    }
    // cell not in the template: add it to its row, in column order
    const { col, row } = splitAddr(addr);
    const rowRe = new RegExp(
      `(<row r="${row}"[^>]*?)(?:/>|>([\\s\\S]*?)</row>)`,
    );
    const rm = rowRe.exec(this.xml);
    if (!rm) throw new Error(`Template has no row ${row} (cell ${addr}).`);
    const open = rm[1].replace(/\/$/, "");
    const cells = [
      ...(rm[2] || "").matchAll(
        /<c r="([A-Z]+)\d+"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g,
      ),
    ];
    let inner = rm[2] || "";
    const next = cells.find((c) => colNum(c[1]) > col);
    inner = next
      ? inner.slice(0, next.index) + cellXml + inner.slice(next.index)
      : inner + cellXml;
    this.xml =
      this.xml.slice(0, rm.index) +
      `${open}>${inner}</row>` +
      this.xml.slice(rm.index + rm[0].length);
  }
  clear(addr) {
    if (this.isSlave(addr)) return;
    const s = this._style(addr);
    this._put(addr, `<c r="${addr}"${s ? ` s="${s}"` : ""}/>`);
  }
  // kind: "auto" (numbers / percent / text) | "date" | "time"
  set(addr, value, kind = "auto") {
    if (this.isSlave(addr)) return;
    const s = this._style(addr);
    const sAttr = s ? ` s="${s}"` : "";
    const v = value === undefined || value === null ? "" : String(value);
    if (v.trim() === "") return this.clear(addr);
    let num = null;
    if (kind === "date") num = parseDate(v);
    else if (kind === "time") num = parseTime(v);
    else {
      const pct = parsePercent(v);
      // a percentage only becomes a real number if the cell is formatted as %
      num = pct !== null && this.percentStyles.has(s) ? pct : plainNumber(v);
    }
    if (num !== null)
      this._put(addr, `<c r="${addr}"${sAttr}><v>${num}</v></c>`);
    else
      this._put(
        addr,
        `<c r="${addr}"${sAttr} t="inlineStr"><is>${textNode(v.trim())}</is></c>`,
      );
  }
  // "DYE ADDITION" + bold product name, like the template
  setRich(addr, plain, boldText) {
    if (this.isSlave(addr)) return;
    const s = this._style(addr);
    const rPr =
      '<rPr><b/><sz val="12"/><color theme="1"/><rFont val="Calibri"/><family val="2"/><scheme val="minor"/></rPr>';
    this._put(
      addr,
      `<c r="${addr}"${s ? ` s="${s}"` : ""} t="inlineStr"><is><r>${textNode(plain)}</r><r>${rPr}${textNode(" " + boldText)}</r></is></c>`,
    );
  }
  // cell that holds a formula: keep the formula, refresh its cached result
  refreshFormula(addr, value, isText) {
    const m = this._find(addr);
    if (!m || !m[2]) return;
    const f = m[2].match(/<f[\s\S]*?(?:<\/f>|\/>)/)?.[0] || "";
    const attrs = m[1].replace(/\s+t="[^"]*"/, "").replace(/\/$/, "");
    this._put(
      addr,
      `<c r="${addr}"${attrs}${isText ? ' t="str"' : ""}>${f}<v>${esc(value)}</v></c>`,
    );
  }
}

// ── the form / bulk import sends the dye on its own row ─────────────────────
//   DYE ADDITION | BLUE BR (3%, 90 gm) | SODIUM SULPHIDE ...
// The template keeps it on ONE row ("DYE ADDITION" + bold product) followed by SODIUM SULPHIDE.
const isDye = (s) => s.details.trim().toUpperCase() === "DYE ADDITION";
const isSulphide = (s) => s.details.trim().toUpperCase() === "SODIUM SULPHIDE";
export function compactSteps(steps) {
  const out = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const next = steps[i + 1];
    if (isDye(s) && next && !isSulphide(next)) {
      out.push({
        ...s,
        product: next.details,
        dosage: next.dosage || s.dosage,
        totalQty: next.totalQty || s.totalQty,
        ph: s.ph || next.ph,
        temp: s.temp || next.temp,
        time: s.time || next.time,
        costPerKg: s.costPerKg || next.costPerKg,
        cost: s.cost || next.cost,
      });
      i++;
    } else out.push(s);
  }
  return out;
}

// ── cell maps of the two templates ───────────────────────────────────────────
// Ecofast = the original template. Ecosol = BLACK_Q2ELW template (different cells on the Report
// sheet, different process rows, and the Process header holds plain text instead of formulas).
export const BRANDS = ["ecofast", "ecosol"];
export const LAYOUTS = {
  ecofast: {
    report: {
      date: "D2",
      customer: "B8",
      visitedBy: "B10",
      dmuMet: "B12",
      objective: "B14",
      reason: "B17",
      quality: "B22",
      qualityType: "C22",
      trialDetails: "D22",
      machinery: "B24",
      mlr: "B26",
      processFollowed: "A29",
      observations: "A33",
      conclusion: "B36",
      product: "B37",
      action: "B41",
    },
    // rows of the template that hold process steps (17 rows)
    processRows: [
      18, 19, 20, 21, 23, 24, 25, 26, 28, 30, 32, 33, 34, 36, 37, 39, 41,
    ],
    rawCell: "G8",
    headerFromFormulas: true, // Process!B7 = Report!B8, Process!H2 = Report!D2
  },
  ecosol: {
    report: {
      date: "F2",
      customer: "B8",
      visitedBy: "B10",
      dmuMet: "B12",
      objective: "B14",
      reason: "B17",
      quality: "B22",
      qualityType: "E22",
      trialDetails: "F22",
      machinery: "B24",
      mlr: "B26",
      processFollowed: "A29",
      observations: "A33",
      conclusion: "B34",
      product: "B35",
      action: "B40",
    },
    processRows: [
      17, 18, 19, 20, 21, 23, 24, 25, 26, 28, 30, 31, 32, 34, 35, 37, 39,
    ],
    rawCell: "B15", // "RFD Garment" label above the steps
    headerFromFormulas: false,
  },
};
// kept for older imports
export const PROCESS_ROWS = LAYOUTS.ecofast.processRows;

// Quantity above this (in kg) is a "Bulk" trial, anything else is a "Sample" trial
const BULK_ABOVE_KG = 25;
// "6 kg" -> 6, "500 gm" -> 0.5, "1 ton" -> 1000, "30" -> 30, unreadable -> NaN
export function quantityKg(quantity) {
  const m = String(quantity ?? "").match(/(-?\d+(?:\.\d+)?)\s*([a-z]*)/i);
  if (!m) return NaN;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (/^(g|gm|gms|gram|grams)$/.test(unit)) return n / 1000;
  if (/^(t|ton|tons|tonne|tonnes|mt)$/.test(unit)) return n * 1000;
  return n;
}

function percentStyleSet(stylesXml) {
  // custom number formats that show a % (e.g. 0.0%)
  const customPct = new Set(
    [...stylesXml.matchAll(/<numFmt\b[^>]*>/g)]
      .filter((m) => /formatCode="[^"]*%/.test(m[0]))
      .map((m) => m[0].match(/numFmtId="(\d+)"/)[1]),
  );
  const block =
    stylesXml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] || "";
  const set = new Set();
  [...block.matchAll(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)].forEach((m, i) => {
    const id = Number(m[0].match(/numFmtId="(\d+)"/)?.[1]);
    if (id === 9 || id === 10 || customPct.has(String(id))) set.add(String(i));
  });
  return set;
}

export async function fillTemplate(templateFile, entry, brand = "ecofast") {
  const L = LAYOUTS[brand] || LAYOUTS.ecofast;
  const zip = await JSZip.loadAsync(await fs.readFile(templateFile));
  const wb = await zip.file("xl/workbook.xml").async("string");
  const rels = await zip.file("xl/_rels/workbook.xml.rels").async("string");
  const target = {};
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g))
    target[m[0].match(/\bId="([^"]*)"/)[1]] =
      m[0].match(/\bTarget="([^"]*)"/)[1];
  const pathOf = (name) => {
    const tag = [...wb.matchAll(/<sheet\b[^>]*>/g)].find((m) =>
      m[0].includes(`name="${name}"`),
    );
    if (!tag) throw new Error(`Template has no "${name}" sheet.`);
    return (
      "xl/" +
      target[tag[0].match(/r:id="([^"]*)"/)[1]].replace(/^\/?(xl\/)?/, "")
    );
  };
  const reportPath = pathOf("Report");
  const processPath = pathOf("Process");
  const pct = percentStyleSet(await zip.file("xl/styles.xml").async("string"));
  const R = new Sheet(await zip.file(reportPath).async("string"), pct);
  const P = new Sheet(await zip.file(processPath).async("string"), pct);

  // ── Report sheet ──
  const r = entry.report;
  const c = L.report;
  R.set(c.date, r.date, "date");
  R.set(c.customer, r.customer);
  R.set(c.visitedBy, r.visitedBy);
  R.set(c.dmuMet, r.dmuMet);
  R.set(c.objective, r.objective);
  R.set(c.reason, r.reason);
  R.set(c.quality, r.quality);
  R.set(c.qualityType, r.qualityType);
  R.set(c.trialDetails, r.trialDetails);
  R.set(c.machinery, r.machinery);
  R.set(c.mlr, r.mlr, "time");
  R.set(c.processFollowed, r.processFollowed);
  R.set(c.observations, r.observations);
  R.set(c.conclusion, r.conclusion);
  R.set(c.product, r.product);
  R.set(c.action, r.action);

  // ── Process sheet header (values go in the cell NEXT to each label) ──
  const p = entry.process;
  const serial = parseDate(r.date);
  if (L.headerFromFormulas) {
    P.refreshFormula("B7", r.customer, true); // =Report!B8
    if (serial !== null) P.refreshFormula("H2", serial, false); // =Report!D2
  } else {
    P.set("B7", r.customer);
    P.set("H2", r.date ? `DATE :${dmy(r.date)}` : "");
  }
  P.set("B8", p.quality);
  P.set("C8", p.qualityType);
  P.set(L.rawCell, p.raw);
  P.set("F9", p.speed); //            label SPEED in E9
  P.set("B10", p.quantity);
  P.set("D10", p.standardSolution); // label "Standard solution" in C10
  P.set("F10", p.machine); //          label M/C in E10
  P.set("B12", p.liquorQuantity);
  // C12 label: "Bulk" when Quantity is above 25 kg, otherwise "Sample". The cell next to it stays empty.
  P.set("C12", quantityKg(p.quantity) > BULK_ABOVE_KG ? "Bulk" : "Sample");
  P.clear("D12");
  P.set("F12", p.method);

  // ── process steps: clear the template's sample rows, then fill ──
  for (const row of L.processRows)
    for (const col of "ABCDEFGHI") P.clear(`${col}${row}`);
  compactSteps(p.steps)
    .slice(0, L.processRows.length)
    .forEach((step, i) => {
      const row = L.processRows[i];
      const cols = {
        A: step.no,
        C: step.dosage,
        D: step.totalQty,
        E: step.ph,
        F: step.temp,
        G: step.time,
        H: step.costPerKg,
        I: step.cost,
      };
      if (step.product) P.setRich(`B${row}`, step.details, step.product);
      else P.set(`B${row}`, step.details);
      for (const [col, v] of Object.entries(cols)) P.set(`${col}${row}`, v);
    });

  zip.file(reportPath, R.xml);
  zip.file(processPath, P.xml);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
