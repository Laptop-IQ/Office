import React, { useState, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  Trash2,
  Printer,
  RotateCcw,
  Wand2,
  ClipboardList,
  Car,
  Receipt,
  ScrollText,
  CalendarRange,
  FileSpreadsheet,
  IndianRupee,
} from "lucide-react";

/* ============================== helpers ============================== */

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigitWords(n) {
  if (n <= 0) return "";
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10),
    o = n % 10;
  return TENS[t] + (o ? "-" + ONES[o] : "");
}
function threeDigitWords(n) {
  const h = Math.floor(n / 100),
    rest = n % 100;
  let str = "";
  if (h) str += ONES[h] + " Hundred";
  if (h && rest) str += " ";
  if (rest) str += twoDigitWords(rest);
  return str;
}
function numberToWordsIndian(input) {
  let n = Math.floor(Math.max(0, num(input)));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;
  const parts = [];
  if (crore) parts.push(threeDigitWords(crore) + " Crore");
  if (lakh) parts.push(threeDigitWords(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitWords(thousand) + " Thousand");
  if (hundred) parts.push(threeDigitWords(hundred));
  return parts.join(" ");
}

let uidCounter = 0;
const makeEmptyDay = (date = "") => ({
  id: `day-${Date.now()}-${uidCounter++}`,
  date,
  openingKm: "",
  closingKm: "",
  details: "",
  otherConvAmt: "",
  vehicleHireAmt: "",
  lunchAmt: "",
});

/* ============================== data model ============================== */

const CATEGORIES = [
  {
    code: "G9051",
    letter: "A",
    item: "Own Vehicle Usage",
    supportType: "Movement Details",
    auto: true,
  },
  {
    code: "",
    letter: "B",
    item: "Other Conveyance Charges",
    supportType: "Movement Details",
    auto: true,
  },
  {
    code: "",
    letter: "C",
    item: "Vehicle Hire Charges",
    supportType: "Movement Details - Bills",
    auto: true,
  },
  {
    code: "G9003",
    letter: "D",
    item: "Lunch Reimbursement (on duty)",
    supportType: "Movement Details - Bills",
    auto: true,
  },
  {
    code: "G9012",
    letter: "E",
    item: "Mobile Expenses",
    supportType: "Relevant Supportings",
    auto: false,
  },
  {
    code: "",
    letter: "F",
    item: "Telephone Expenses (on duty)",
    supportType: "Bills",
    auto: false,
  },
  {
    code: "G9059",
    letter: "H",
    item: "Business Lunch & Dinner",
    supportType: "Relevant Supportings",
    auto: false,
  },
  {
    code: "",
    letter: "I",
    item: "Other Promotional Expenses",
    supportType: "Relevant Supportings",
    auto: false,
  },
  {
    code: "",
    letter: "J",
    item: "Team Meet (MCM) \u2013 Board/Lodge",
    supportType: "Common",
    auto: false,
  },
  {
    code: "G9032",
    letter: "K",
    item: "Miscellaneous \u2013 Incidentals",
    supportType: "Relevant Supportings",
    auto: false,
  },
  {
    code: "G9021",
    letter: "L",
    item: "Postage & Courier",
    supportType: "Relevant Supportings",
    auto: false,
  },
];
const EXTRA_CATEGORIES = CATEGORIES.filter((c) => !c.auto);
const CATEGORY_MAP = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.letter]: c }),
  {},
);

// Mirrors the exact row grouping of the original printed Annexure - 1/2
// (including the unused reserved "G" line under Telephones, kept for visual fidelity).
const PRINT_GROUPS = [
  { code: "G9051", rows: ["A", "B", "C"] },
  { code: "G9003", rows: ["D"] },
  { code: "G9012", rows: ["E", "F", null] },
  { code: "G9059", rows: ["H", "I", "J"] },
  { code: "G9032", rows: ["K"] },
  { code: "G9021", rows: ["L"] },
];
const DETAILS_PANEL_LABELS = [
  "C) Vehicle Hire Charges",
  "E-G) Telephones",
  "H) Business Lunch & Dinner",
  "I) Other Promotional Exp",
  "J) Team Meet (MCM) Board/Lodge",
  "K) Miscellaneous Incidentals",
  "L) Others",
];

const INITIAL_HEADER = {
  company: "SF Dyes Pvt Ltd",
  name: "",
  empNo: "",
  grade: "",
  office: "",
  region: "",
  date: new Date().toISOString().slice(0, 10),
  periodFrom: "",
  periodTo: "",
  vouNo: "",
  ratePerKm: "4.06",
};
const emptySuppState = () =>
  CATEGORIES.reduce((acc, c) => ({ ...acc, [c.letter]: "" }), {});
const emptyExtraState = () =>
  EXTRA_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.letter]: "" }), {});

const SAMPLE_DAYS_RAW = [
  ["2022-03-01", 24510, 24568, "Bahalgarh to Livashpur", 50],
  ["2022-03-02", 24568, 24626, "Bahalgarh to Livashpur", 50],
  ["2022-03-03", 24626, 24690, "Bahalgarh to Bawana", 50],
  ["2022-03-04", 24690, 24728, "Bahalgarh to Kundli", 50],
  ["2022-03-05", 24728, 24766, "Bahalgarh to Kundli", 50],
  ["2022-03-06", 0, 0, "Sunday", 0],
  ["2022-03-07", 0, 0, "On Leave", 0],
  ["2022-03-08", 0, 0, "On Leave", 0],
  ["2022-03-09", 0, 0, "On Leave", 0],
  ["2022-03-10", 0, 0, "On Leave", 0],
  ["2022-03-11", 24766, 24874, "Bahalgarh to Panipat", 50],
  ["2022-03-12", 24874, 24982, "Bahalgarh to Panipat", 50],
  ["2022-03-13", 0, 0, "Sunday", 0],
  ["2022-03-14", 24982, 25066, "Bahalgarh to Tronica City", 50],
  ["2022-03-15", 25066, 25174, "Bahalgarh to Panipat", 50],
  ["2022-03-16", 25174, 25213, "Bahalgarh to Kundli", 50],
  ["2022-03-17", 0, 0, "Work From Home", 0],
  ["2022-03-18", 0, 0, "Holiday", 0],
  ["2022-03-19", 25213, 25303, "Bahalgarh to Tronica City & Office", 50],
  ["2022-03-20", 0, 0, "Sunday", 0],
  ["2022-03-21", 25303, 25371, "Bahalgarh to Bawana", 50],
  ["2022-03-22", 25371, 25411, "Bahalgarh to Kundli", 50],
  ["2022-03-23", 25411, 25473, "Bahalgarh to Bawana", 50],
  ["2022-03-24", 25473, 25561, "Bahalgarh to Old Mustafabad (Delhi)", 50],
  ["2022-03-25", 25561, 25623, "Bahalgarh to Bawana", 50],
];

function buildSample() {
  return {
    header: {
      company: "SF Dyes Pvt Ltd",
      name: "Sudhir Kumar",
      empNo: "",
      grade: "",
      office: "SF - Delhi NCR",
      region: "",
      date: "2022-03-25",
      periodFrom: "2022-03-01",
      periodTo: "2022-03-25",
      vouNo: "",
      ratePerKm: "4.06",
    },
    days: SAMPLE_DAYS_RAW.map(([date, o, c, details, lunch]) => ({
      id: `day-${Date.now()}-${uidCounter++}`,
      date,
      openingKm: String(o),
      closingKm: String(c),
      details,
      otherConvAmt: "",
      vehicleHireAmt: "",
      lunchAmt: lunch ? String(lunch) : "",
    })),
    supportings: { ...emptySuppState(), A: "1", D: "1", E: "1" },
    extraAmounts: { ...emptyExtraState(), E: "470.82" },
    advanceTaken: "",
  };
}

/* ============================== UI atoms ============================== */

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, dense, ariaLabel }) {
  return (
    <input
      type="text"
      className={`field-input${dense ? " field-input-sm" : ""}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    />
  );
}

function NumberInput({
  value,
  onChange,
  placeholder = "0",
  step = "1",
  dense,
  ariaLabel,
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      className={`field-input mono${dense ? " field-input-sm" : ""}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    />
  );
}

function DateInput({ value, onChange, dense, ariaLabel }) {
  return (
    <input
      type="date"
      className={`field-input${dense ? " field-input-sm" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    />
  );
}

function ToolbarButton({ icon: Icon, children, onClick, solid = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="no-print inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
      style={
        solid
          ? { backgroundColor: "var(--ink)", color: "#fff" }
          : {
              border: "1px solid var(--rule-strong)",
              color: "var(--ink)",
              backgroundColor: "transparent",
            }
      }
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

function SectionCard({ icon: Icon, title, subtitle, actions, children }) {
  return (
    <section
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{
        border: "1px solid var(--rule)",
        backgroundColor: "var(--surface)",
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
            style={{ backgroundColor: "var(--auto-tint)", color: "var(--ink)" }}
          >
            <Icon size={18} />
          </span>
          <div>
            <h2
              className="font-display text-lg font-semibold"
              style={{ color: "var(--ink)" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function StampBadge({ vouNo }) {
  return (
    <div
      className="hidden sm:flex flex-shrink-0 flex-col items-center justify-center text-center font-display select-none"
      style={{
        width: "128px",
        height: "128px",
        borderRadius: "9999px",
        border: "2px dashed var(--stamp)",
        color: "var(--stamp)",
        transform: "rotate(-8deg)",
      }}
    >
      <span className="text-xs font-bold uppercase tracking-widest leading-tight">
        Expense
      </span>
      <span className="text-xs font-bold uppercase tracking-widest leading-tight">
        Claim
      </span>
      <span className="mt-1 text-xs font-mono-ledger leading-tight">
        {vouNo ? `#${vouNo}` : "DRAFT"}
      </span>
    </div>
  );
}

/* ============================== main component ============================== */

export default function ExpenseClaimBuilder() {
  const [header, setHeader] = useState(INITIAL_HEADER);
  const [days, setDays] = useState(() => [makeEmptyDay()]);
  const [supportings, setSupportings] = useState(emptySuppState);
  const [extraAmounts, setExtraAmounts] = useState(emptyExtraState);
  const [advanceTaken, setAdvanceTaken] = useState("");

  const updateHeader = useCallback((field, value) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateDay = useCallback((id, field, value) => {
    setDays((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  }, []);

  const addDay = useCallback(
    () => setDays((prev) => [...prev, makeEmptyDay()]),
    [],
  );
  const removeDay = useCallback(
    (id) => setDays((prev) => prev.filter((d) => d.id !== id)),
    [],
  );

  const fillPeriodDays = useCallback(() => {
    if (!header.periodFrom || !header.periodTo) return;
    const start = new Date(`${header.periodFrom}T00:00:00Z`);
    const end = new Date(`${header.periodTo}T00:00:00Z`);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    )
      return;
    setDays((prev) => {
      const existing = new Set(prev.map((d) => d.date));
      const additions = [];
      for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
        const iso = new Date(t).toISOString().slice(0, 10);
        if (!existing.has(iso)) additions.push(makeEmptyDay(iso));
      }
      const merged = [...prev.filter((d) => d.date), ...additions];
      return merged.length
        ? merged.sort((a, b) => a.date.localeCompare(b.date))
        : prev;
    });
  }, [header.periodFrom, header.periodTo]);

  const updateSupp = useCallback((letter, value) => {
    setSupportings((prev) => ({ ...prev, [letter]: value }));
  }, []);
  const updateExtraAmt = useCallback((letter, value) => {
    setExtraAmounts((prev) => ({ ...prev, [letter]: value }));
  }, []);

  const loadSample = useCallback(() => {
    const s = buildSample();
    setHeader(s.header);
    setDays(s.days);
    setSupportings(s.supportings);
    setExtraAmounts(s.extraAmounts);
    setAdvanceTaken(s.advanceTaken);
  }, []);

  const resetAll = useCallback(() => {
    setHeader(INITIAL_HEADER);
    setDays([makeEmptyDay()]);
    setSupportings(emptySuppState());
    setExtraAmounts(emptyExtraState());
    setAdvanceTaken("");
  }, []);

  /* ---- computed values ---- */

  const dayTotals = useMemo(() => {
    let totalKm = 0,
      otherConv = 0,
      vehicleHire = 0,
      lunch = 0;
    days.forEach((d) => {
      totalKm += Math.max(0, num(d.closingKm) - num(d.openingKm));
      otherConv += num(d.otherConvAmt);
      vehicleHire += num(d.vehicleHireAmt);
      lunch += num(d.lunchAmt);
    });
    return { totalKm, otherConv, vehicleHire, lunch };
  }, [days]);

  const ownVehicleAmount = useMemo(
    () => dayTotals.totalKm * num(header.ratePerKm),
    [dayTotals.totalKm, header.ratePerKm],
  );

  const getAmount = useCallback(
    (letter) => {
      if (letter === "A") return ownVehicleAmount;
      if (letter === "B") return dayTotals.otherConv;
      if (letter === "C") return dayTotals.vehicleHire;
      if (letter === "D") return dayTotals.lunch;
      return num(extraAmounts[letter]);
    },
    [ownVehicleAmount, dayTotals, extraAmounts],
  );

  const grandTotal = useMemo(
    () => CATEGORIES.reduce((sum, cat) => sum + getAmount(cat.letter), 0),
    [getAmount],
  );
  const totalSupportings = useMemo(
    () =>
      CATEGORIES.reduce(
        (sum, cat) => sum + (parseInt(supportings[cat.letter], 10) || 0),
        0,
      ),
    [supportings],
  );
  const netAmountPayable = grandTotal - num(advanceTaken);
  const isRefundDue = netAmountPayable < 0;
  const amountInWords = useMemo(
    () => numberToWordsIndian(Math.floor(Math.abs(netAmountPayable))),
    [netAmountPayable],
  );

  /* ---- excel export ---- */

  const downloadExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const periodStr = `${header.periodFrom || "-"} to ${header.periodTo || "-"}`;

    const mainAOA = [
      ["ANNEXURE - 1 / 2"],
      [header.company || "Company Name"],
      [
        "MARKETING EXPENSE CLAIM STATEMENT",
        "",
        "",
        "",
        "",
        "Vou No",
        header.vouNo || "",
      ],
      [
        "Name",
        header.name || "",
        "",
        "Emp No",
        header.empNo || "",
        "Grade",
        header.grade || "",
      ],
      [
        "Office",
        header.office || "",
        "",
        "Bus Line / Region",
        header.region || "",
        "Date",
        header.date || "",
      ],
      [
        "Period",
        periodStr,
        "",
        "",
        "",
        "Rate per Km (Rs.)",
        num(header.ratePerKm),
      ],
      [],
      [
        "A/C Code",
        "Code",
        "Account Head",
        "Supportings Required",
        "No. of Supportings",
        "Amount (Rs.)",
      ],
    ];
    CATEGORIES.forEach((cat) => {
      mainAOA.push([
        cat.code,
        cat.letter,
        cat.item,
        cat.supportType,
        parseInt(supportings[cat.letter], 10) || 0,
        Number(getAmount(cat.letter).toFixed(2)),
      ]);
    });
    mainAOA.push([]);
    mainAOA.push([
      "",
      "",
      "TOTAL",
      "",
      totalSupportings,
      Number(grandTotal.toFixed(2)),
    ]);
    mainAOA.push([
      "",
      "",
      "Less: Advance Taken",
      "",
      "",
      Number(num(advanceTaken).toFixed(2)),
    ]);
    mainAOA.push([
      "",
      "",
      isRefundDue ? "REFUND DUE FROM EMPLOYEE" : "NET AMOUNT PAYABLE",
      "",
      "",
      Number(Math.abs(netAmountPayable).toFixed(2)),
    ]);
    mainAOA.push([]);
    mainAOA.push(["Rupees in Words", `${amountInWords} Only`]);
    mainAOA.push([]);
    mainAOA.push([
      "Received the above amount",
      "",
      "Signature",
      "",
      header.name || "",
      "Signature of Authority",
    ]);

    const wsMain = XLSX.utils.aoa_to_sheet(mainAOA);
    wsMain["!cols"] = [
      { wch: 12 },
      { wch: 7 },
      { wch: 32 },
      { wch: 22 },
      { wch: 17 },
      { wch: 14 },
    ];
    wsMain["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsMain, "Main");

    const localAOA = [
      ["ANNEXURE - 2 / 2"],
      [header.company || "Company Name"],
      ["MARKETING EXPENSE CLAIM STATEMENT - Daily Movement Details"],
      [
        "Name",
        header.name || "",
        "",
        "Emp No",
        header.empNo || "",
        "Grade",
        header.grade || "",
      ],
      [
        "Office",
        header.office || "",
        "",
        "Bus Line / Region",
        header.region || "",
      ],
      ["Period", periodStr, "", "Rate per Km (Rs.)", num(header.ratePerKm)],
      [],
      [
        "Date",
        "Opening Km",
        "Closing Km",
        "Km Run",
        "Details of Visit / Movement",
        "Other Conveyance (Rs.)",
        "Vehicle Hire (Rs.)",
        "Lunch (Rs.)",
      ],
    ];
    days.forEach((d) => {
      const km = Math.max(0, num(d.closingKm) - num(d.openingKm));
      localAOA.push([
        d.date || "",
        num(d.openingKm),
        num(d.closingKm),
        km,
        d.details || "",
        Number(num(d.otherConvAmt).toFixed(2)),
        Number(num(d.vehicleHireAmt).toFixed(2)),
        Number(num(d.lunchAmt).toFixed(2)),
      ]);
    });
    localAOA.push([]);
    localAOA.push([
      "Total",
      "",
      "",
      dayTotals.totalKm,
      "",
      Number(dayTotals.otherConv.toFixed(2)),
      Number(dayTotals.vehicleHire.toFixed(2)),
      Number(dayTotals.lunch.toFixed(2)),
    ]);
    localAOA.push(["Rate (Rs. per Km)", num(header.ratePerKm)]);
    localAOA.push([
      "Own Vehicle Amount (Rs.)",
      Number(ownVehicleAmount.toFixed(2)),
    ]);

    const wsLocal = XLSX.utils.aoa_to_sheet(localAOA);
    wsLocal["!cols"] = [
      { wch: 12 },
      { wch: 11 },
      { wch: 11 },
      { wch: 9 },
      { wch: 34 },
      { wch: 17 },
      { wch: 14 },
      { wch: 11 },
    ];
    wsLocal["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsLocal, "Local");

    const safeCompany = (header.company || "Expense_Claim").replace(
      /[^a-z0-9]+/gi,
      "_",
    );
    const fname =
      `${safeCompany}_${header.periodFrom || "from"}_to_${header.periodTo || "to"}.xlsx`.replace(
        /_+/g,
        "_",
      );
    XLSX.writeFile(wb, fname);
  }, [
    header,
    days,
    supportings,
    dayTotals,
    ownVehicleAmount,
    getAmount,
    grandTotal,
    totalSupportings,
    advanceTaken,
    netAmountPayable,
    isRefundDue,
    amountInWords,
  ]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ============================== render ============================== */

  return (
    <div className="ledger-root min-h-screen pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        :root {
          --paper: #F5F4EC;
          --paper-line: rgba(31,61,43,0.06);
          --surface: #FFFFFF;
          --ink: #1F3D2B;
          --ink-soft: #52705E;
          --ink-faint: #8A9C90;
          --rule: #DADFCF;
          --rule-strong: #B7C2A8;
          --stamp: #A23B2A;
          --stamp-tint: #F3E2DD;
          --brass: #A97F2F;
          --brass-tint: #F3ECD8;
          --auto-tint: #E9F1EA;
          --auto-text: #2E6248;
        }
        .ledger-root { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; background-color: var(--paper); color: var(--ink); }
        .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
        .font-mono-ledger { font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace; }
        .ledger-bg-lines { background-image: repeating-linear-gradient(to bottom, transparent, transparent 30px, var(--paper-line) 30px, var(--paper-line) 31px); }
        .ledger-divide > * + * { border-top: 1px solid var(--rule); }
        .ledger-table { border-collapse: collapse; width: 100%; }
        .ledger-table th, .ledger-table td { border: 1px solid var(--rule); padding: 7px 10px; vertical-align: middle; }
        .ledger-table thead th { background-color: var(--auto-tint); color: var(--ink); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10.5px; }
        .ledger-table tbody tr:hover { background-color: rgba(31,61,43,0.035); }
        .ledger-table tfoot td { background-color: var(--brass-tint); font-weight: 700; }
        .ledger-table td.cell-tight { padding: 4px 6px; }
        .field-input { border: 1px solid var(--rule-strong); border-radius: 8px; padding: 8px 12px; font-size: 13.5px; color: var(--ink); background: #fff; width: 100%; outline: none; transition: box-shadow .15s, border-color .15s; }
        .field-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(31,61,43,0.14); }
        .field-input.mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; text-align: right; }
        .field-input-sm { padding: 5px 8px; font-size: 12.5px; border-radius: 6px; }
        .field-input::-webkit-outer-spin-button, .field-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .field-input[type=number] { -moz-appearance: textfield; }
        .icon-btn { color: var(--ink-faint); border-radius: 8px; padding: 6px; transition: color .15s, background-color .15s; }
        .icon-btn:hover { color: var(--stamp); background-color: var(--stamp-tint); }
        .auto-pill { display: inline-block; background-color: var(--auto-tint); color: var(--auto-text); font-weight: 700; border-radius: 6px; padding: 3px 8px; }
        button:focus-visible, input:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }

        /* ---- print-only replica of the original Annexure 1/2 + 2/2 ---- */
        .print-only { display: none; }
        .pt-form { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 10px; line-height: 1.4; }
        .pt-table { width: 100%; border-collapse: collapse; }
        .pt-table th, .pt-table td { border: 1px solid #333; padding: 2px 5px; vertical-align: top; }
        .pt-table th { background: #eee; font-weight: 700; font-size: 9px; text-transform: uppercase; }
        .pt-title { text-align: center; font-weight: 700; font-size: 14px; text-transform: uppercase; margin-top: 2px; }
        .pt-company { font-weight: 700; font-size: 13px; }
        .pt-annex { text-align: right; font-size: 9px; font-weight: 700; }
        .pt-line { border-bottom: 1px solid #111; display: inline-block; min-width: 90px; }
        .pt-small { font-size: 8.5px; color: #333; }
        .pt-label { font-weight: 700; background: #f3f3f3; white-space: nowrap; }

        @media print {
          @page { size: 11in 8.5in; margin: 0; }
          .no-print { display: none !important; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          .ledger-root { background: #fff !important; padding-bottom: 0 !important; }
          .print-page { box-sizing: border-box; page-break-after: always; break-after: page; }
          .print-page:last-child { page-break-after: auto; break-after: auto; }
          .print-page-1 { padding: 16.3mm 19.1mm 26.4mm 8.7mm; }
          .print-page-2 { padding: 19.9mm 19.6mm 34mm 17.6mm; }
          .pt-table { page-break-inside: auto; }
          .pt-table tr { page-break-inside: avoid; }
        }
      `}</style>

      <div className="screen-only">
        <header
          className="ledger-bg-lines"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex items-start justify-between gap-6">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--ink-soft)" }}
              >
                Annexure &middot; Marketing Expense Claim
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
                Expense Claim Ledger
              </h1>
              <p
                className="mt-2 text-sm max-w-xl"
                style={{ color: "var(--ink-soft)" }}
              >
                Employee, daily movement aur expense details bharo &mdash; Km
                run, totals aur amount-in-words apne aap calculate ho jaayenge.
                Neeche se ready-to-file Excel workbook download kar lo.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ToolbarButton icon={Wand2} onClick={loadSample}>
                  Load sample data
                </ToolbarButton>
                <ToolbarButton icon={RotateCcw} onClick={resetAll}>
                  Reset form
                </ToolbarButton>
              </div>
            </div>
            <StampBadge vouNo={header.vouNo} />
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
          <SectionCard
            icon={ClipboardList}
            title="Claim Details"
            subtitle="Employee aur voucher information"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Company">
                <TextInput
                  value={header.company}
                  onChange={(v) => updateHeader("company", v)}
                />
              </Field>
              <Field label="Employee Name">
                <TextInput
                  value={header.name}
                  onChange={(v) => updateHeader("name", v)}
                  placeholder="e.g. Sudhir Kumar"
                />
              </Field>
              <Field label="Employee No.">
                <TextInput
                  value={header.empNo}
                  onChange={(v) => updateHeader("empNo", v)}
                />
              </Field>
              <Field label="Grade">
                <TextInput
                  value={header.grade}
                  onChange={(v) => updateHeader("grade", v)}
                />
              </Field>
              <Field label="Office">
                <TextInput
                  value={header.office}
                  onChange={(v) => updateHeader("office", v)}
                />
              </Field>
              <Field label="Bus. Line / Region">
                <TextInput
                  value={header.region}
                  onChange={(v) => updateHeader("region", v)}
                />
              </Field>
              <Field label="Voucher No.">
                <TextInput
                  value={header.vouNo}
                  onChange={(v) => updateHeader("vouNo", v)}
                />
              </Field>
              <Field label="Claim Date">
                <DateInput
                  value={header.date}
                  onChange={(v) => updateHeader("date", v)}
                />
              </Field>
              <Field label="Period From">
                <DateInput
                  value={header.periodFrom}
                  onChange={(v) => updateHeader("periodFrom", v)}
                />
              </Field>
              <Field label="Period To">
                <DateInput
                  value={header.periodTo}
                  onChange={(v) => updateHeader("periodTo", v)}
                />
              </Field>
              <Field label="Rate / Km (₹)">
                <NumberInput
                  value={header.ratePerKm}
                  onChange={(v) => updateHeader("ratePerKm", v)}
                  step="0.01"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={Car}
            title="Daily Movement Log"
            subtitle="Har din ek row — Km run aur totals khud calculate honge"
            actions={
              <>
                <ToolbarButton icon={CalendarRange} onClick={fillPeriodDays}>
                  Fill period days
                </ToolbarButton>
                <ToolbarButton icon={Plus} onClick={addDay} solid>
                  Add day
                </ToolbarButton>
              </>
            }
          >
            <div className="overflow-x-auto">
              <table
                className="ledger-table text-sm"
                style={{ minWidth: "920px" }}
              >
                <colgroup>
                  <col style={{ width: "132px" }} />
                  <col style={{ width: "92px" }} />
                  <col style={{ width: "92px" }} />
                  <col style={{ width: "78px" }} />
                  <col />
                  <col style={{ width: "116px" }} />
                  <col style={{ width: "116px" }} />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "44px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th rowSpan={2}>Date</th>
                    <th colSpan={2}>Own Vehicle (Km)</th>
                    <th rowSpan={2}>Km Run</th>
                    <th rowSpan={2}>Details of Visit / Movement</th>
                    <th rowSpan={2}>Other Conv. (₹)</th>
                    <th rowSpan={2}>Vehicle Hire (₹)</th>
                    <th rowSpan={2}>Lunch (₹)</th>
                    <th rowSpan={2}></th>
                  </tr>
                  <tr>
                    <th>Opening</th>
                    <th>Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => {
                    const km = Math.max(0, num(d.closingKm) - num(d.openingKm));
                    return (
                      <tr key={d.id}>
                        <td className="cell-tight">
                          <DateInput
                            dense
                            ariaLabel="Date"
                            value={d.date}
                            onChange={(v) => updateDay(d.id, "date", v)}
                          />
                        </td>
                        <td className="cell-tight">
                          <NumberInput
                            dense
                            ariaLabel="Opening Km"
                            value={d.openingKm}
                            onChange={(v) => updateDay(d.id, "openingKm", v)}
                          />
                        </td>
                        <td className="cell-tight">
                          <NumberInput
                            dense
                            ariaLabel="Closing Km"
                            value={d.closingKm}
                            onChange={(v) => updateDay(d.id, "closingKm", v)}
                          />
                        </td>
                        <td
                          className="text-right font-mono-ledger"
                          style={{ color: "var(--auto-text)", fontWeight: 600 }}
                        >
                          {km || ""}
                        </td>
                        <td className="cell-tight">
                          <TextInput
                            dense
                            ariaLabel="Details of visit"
                            value={d.details}
                            onChange={(v) => updateDay(d.id, "details", v)}
                            placeholder="Place to place"
                          />
                        </td>
                        <td className="cell-tight">
                          <NumberInput
                            dense
                            ariaLabel="Other conveyance amount"
                            value={d.otherConvAmt}
                            onChange={(v) => updateDay(d.id, "otherConvAmt", v)}
                            step="0.01"
                          />
                        </td>
                        <td className="cell-tight">
                          <NumberInput
                            dense
                            ariaLabel="Vehicle hire amount"
                            value={d.vehicleHireAmt}
                            onChange={(v) =>
                              updateDay(d.id, "vehicleHireAmt", v)
                            }
                            step="0.01"
                          />
                        </td>
                        <td className="cell-tight">
                          <NumberInput
                            dense
                            ariaLabel="Lunch amount"
                            value={d.lunchAmt}
                            onChange={(v) => updateDay(d.id, "lunchAmt", v)}
                            step="0.01"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="icon-btn no-print"
                            onClick={() => removeDay(d.id)}
                            title="Remove row"
                            aria-label="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {days.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-8"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        Koi din add nahi hua — "Add day" ya "Fill period days"
                        par click karo.
                      </td>
                    </tr>
                  )}
                </tbody>
                {days.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total</td>
                      <td className="text-right font-mono-ledger">
                        {dayTotals.totalKm.toLocaleString("en-IN")}
                      </td>
                      <td></td>
                      <td className="text-right font-mono-ledger">
                        {fmt(dayTotals.otherConv)}
                      </td>
                      <td className="text-right font-mono-ledger">
                        {fmt(dayTotals.vehicleHire)}
                      </td>
                      <td className="text-right font-mono-ledger">
                        {fmt(dayTotals.lunch)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <p className="mt-3 text-xs" style={{ color: "var(--ink-faint)" }}>
              Own vehicle amount = total Km run × rate/km ={" "}
              <span
                className="font-mono-ledger font-semibold"
                style={{ color: "var(--auto-text)" }}
              >
                {dayTotals.totalKm} × ₹{num(header.ratePerKm)} = ₹
                {fmt(ownVehicleAmount)}
              </span>
            </p>
          </SectionCard>

          <SectionCard
            icon={Receipt}
            title="Additional Expenses"
            subtitle="Jo daily log me nahi aate — period ka total amount yahan bharo"
          >
            <div className="ledger-divide">
              {EXTRA_CATEGORIES.map((cat) => (
                <div
                  key={cat.letter}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="auto-pill font-mono-ledger text-xs flex-shrink-0">
                      {cat.letter}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{cat.item}</p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        {cat.supportType}
                        {cat.code ? ` · ${cat.code}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-40">
                    <Field label="Amount (₹)">
                      <NumberInput
                        value={extraAmounts[cat.letter]}
                        onChange={(v) => updateExtraAmt(cat.letter, v)}
                        step="0.01"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={ScrollText}
            title="Summary"
            subtitle="Amounts upar se aate hain · No. of Supportings yahan edit karo"
          >
            <div className="overflow-x-auto">
              <table
                className="ledger-table text-sm"
                style={{ minWidth: "620px" }}
              >
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Item</th>
                    <th>Supportings Required</th>
                    <th className="text-right">No. of Supp.</th>
                    <th className="text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((cat) => (
                    <tr key={cat.letter}>
                      <td>
                        <span className="auto-pill font-mono-ledger text-xs">
                          {cat.letter}
                        </span>
                        {cat.code && (
                          <span
                            className="ml-2 text-xs font-mono-ledger"
                            style={{ color: "var(--ink-faint)" }}
                          >
                            {cat.code}
                          </span>
                        )}
                      </td>
                      <td>{cat.item}</td>
                      <td
                        className="text-xs"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        {cat.supportType}
                      </td>
                      <td className="text-right cell-tight">
                        <NumberInput
                          dense
                          ariaLabel={`${cat.item} supportings count`}
                          value={supportings[cat.letter]}
                          onChange={(v) => updateSupp(cat.letter, v)}
                        />
                      </td>
                      <td className="text-right font-mono-ledger">
                        {cat.auto ? (
                          <span className="auto-pill">
                            {fmt(getAmount(cat.letter))}
                          </span>
                        ) : (
                          fmt(getAmount(cat.letter))
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total</td>
                    <td className="text-right font-mono-ledger">
                      {totalSupportings}
                    </td>
                    <td className="text-right font-mono-ledger">
                      {fmt(grandTotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>Less: Advance Taken</td>
                    <td></td>
                    <td className="text-right cell-tight">
                      <NumberInput
                        dense
                        ariaLabel="Advance taken amount"
                        value={advanceTaken}
                        onChange={setAdvanceTaken}
                        step="0.01"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      style={{ color: "var(--stamp)", fontSize: "15px" }}
                    >
                      {isRefundDue
                        ? "Refund Due from Employee"
                        : "Net Amount Payable"}
                    </td>
                    <td></td>
                    <td
                      className="text-right font-mono-ledger"
                      style={{ color: "var(--stamp)", fontSize: "15px" }}
                    >
                      {fmt(Math.abs(netAmountPayable))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div
              className="mt-4 rounded-lg p-4 text-sm"
              style={{ backgroundColor: "var(--brass-tint)" }}
            >
              <span className="font-semibold">Rupees in Words: </span>
              {amountInWords} Only
            </div>
          </SectionCard>
        </main>
      </div>

      <div className="print-only">
        {/* ===== Page 1 : ANNEXURE - 1/2 (Main / Summary) ===== */}
        <div className="print-page print-page-1 pt-form">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div className="pt-company">{header.company || "Company Name"}</div>
            <div>
              Vou No: <span className="pt-line">{header.vouNo}</span>
            </div>
          </div>
          <div className="pt-title">Marketing Expense Claim Statement</div>
          <div className="pt-annex">ANNEXURE - 1 /2</div>

          <table className="pt-table" style={{ marginTop: "5px" }}>
            <tbody>
              <tr>
                <td className="pt-label" style={{ width: "8%" }}>
                  NAME
                </td>
                <td style={{ width: "27%" }}>{header.name}</td>
                <td className="pt-label" style={{ width: "9%" }}>
                  EMP NO
                </td>
                <td style={{ width: "13%" }}>{header.empNo}</td>
                <td className="pt-label" style={{ width: "8%" }}>
                  GRADE
                </td>
                <td style={{ width: "10%" }}>{header.grade}</td>
                <td className="pt-label" style={{ width: "6%" }}>
                  Date
                </td>
                <td>{header.date}</td>
              </tr>
              <tr>
                <td className="pt-label">Office</td>
                <td>{header.office}</td>
                <td className="pt-label" colSpan={2}>
                  Bus Line / Region
                </td>
                <td colSpan={2}>{header.region}</td>
                <td className="pt-label">Period</td>
                <td>
                  {header.periodFrom} to {header.periodTo}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              gap: "6px",
              marginTop: "5px",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: "1 1 66%" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  marginBottom: "2px",
                }}
              >
                SUMMARY
              </div>
              <table className="pt-table">
                <thead>
                  <tr>
                    <th style={{ width: "12%" }}>A/C No.</th>
                    <th style={{ width: "4%" }}></th>
                    <th>Account Head</th>
                    <th style={{ width: "19%" }}>
                      Standard Supportings Required
                    </th>
                    <th style={{ width: "9%" }}>No. of Supp.</th>
                    <th style={{ width: "13%" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {PRINT_GROUPS.map((grp) =>
                    grp.rows.map((letter, idx) => {
                      const cat = letter ? CATEGORY_MAP[letter] : null;
                      return (
                        <tr key={`${grp.code}-${idx}`}>
                          {idx === 0 && (
                            <td className="pt-label" rowSpan={grp.rows.length}>
                              {grp.code}
                            </td>
                          )}
                          <td style={{ fontWeight: 700, textAlign: "center" }}>
                            {letter || "G"}
                          </td>
                          <td>{cat ? cat.item : ""}</td>
                          <td className="pt-small">
                            {cat ? cat.supportType : ""}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {cat ? supportings[letter] || "" : ""}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {cat && getAmount(letter)
                              ? fmt(getAmount(letter))
                              : ""}
                          </td>
                        </tr>
                      );
                    }),
                  )}
                  <tr>
                    <td
                      colSpan={4}
                      style={{ fontWeight: 700, textAlign: "right" }}
                    >
                      TOTAL
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {totalSupportings}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {fmt(grandTotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right" }}>
                      Less : Advance taken
                    </td>
                    <td></td>
                    <td style={{ textAlign: "right" }}>
                      {num(advanceTaken) ? fmt(advanceTaken) : ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      style={{ fontWeight: 700, textAlign: "right" }}
                    >
                      {isRefundDue
                        ? "REFUND DUE FROM EMPLOYEE"
                        : "NET AMOUNT PAYABLE"}
                    </td>
                    <td></td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {fmt(Math.abs(netAmountPayable))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ flex: "1 1 34%" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  marginBottom: "2px",
                }}
              >
                &nbsp;
              </div>
              <table className="pt-table">
                <thead>
                  <tr>
                    <th>Details</th>
                    <th style={{ width: "26%" }}>Date</th>
                    <th style={{ width: "20%" }}>No. of Supp.</th>
                    <th style={{ width: "24%" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {DETAILS_PANEL_LABELS.map((label) => (
                    <React.Fragment key={label}>
                      <tr>
                        <td
                          colSpan={4}
                          className="pt-small"
                          style={{ fontWeight: 700 }}
                        >
                          {label}
                        </td>
                      </tr>
                      <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #333",
              borderTop: "none",
              padding: "3px 6px",
              fontSize: "10px",
            }}
          >
            <strong>Rupees in Words :</strong> {amountInWords} Only
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "14px",
              fontSize: "9.5px",
            }}
          >
            <div>
              Received the above amount
              <br />
              Signature&nbsp;&nbsp;<span className="pt-line">&nbsp;</span>
            </div>
            <div style={{ alignSelf: "flex-end" }}>{header.name}</div>
            <div>
              Signature of Authority&nbsp;&nbsp;
              <span className="pt-line">&nbsp;</span>
            </div>
          </div>

          <table className="pt-table" style={{ marginTop: "10px" }}>
            <thead>
              <tr>
                <th>A/cs Payment</th>
                <th>A/cs Arithmetic / Monitor</th>
                <th>A/cs Approval</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ height: "24px" }}>
                  Recd. On&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Paid On
                </td>
                <td>
                  Recd. On&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Disp. On
                </td>
                <td>
                  Recd. On&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Disp. On
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pt-small" style={{ marginTop: "6px" }}>
            Route : 1&#8209;Approval for payment Authority by, 2&#8209;A/cs
            Arith / Monitor, 3&#8209;A/cs Approval, 4&#8209;A/cs Payment
            <br />
            For details of items A,B,C,D pl. see annexure 2
          </div>
        </div>

        {/* ===== Page 2 : ANNEXURE - 2/2 (Local / Daily movement log) ===== */}
        <div className="print-page print-page-2 pt-form">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="pt-company">{header.company || "Company Name"}</div>
            <div className="pt-annex">ANNEXURE - 2 /2</div>
          </div>
          <div className="pt-title">Marketing Expense Claim Statement</div>

          <table className="pt-table" style={{ marginTop: "5px" }}>
            <tbody>
              <tr>
                <td className="pt-label" style={{ width: "8%" }}>
                  NAME
                </td>
                <td style={{ width: "27%" }}>{header.name}</td>
                <td className="pt-label" style={{ width: "9%" }}>
                  EMP NO
                </td>
                <td style={{ width: "13%" }}>{header.empNo}</td>
                <td className="pt-label" style={{ width: "8%" }}>
                  GRADE
                </td>
                <td>{header.grade}</td>
              </tr>
              <tr>
                <td className="pt-label">Office</td>
                <td>{header.office}</td>
                <td className="pt-label" colSpan={2}>
                  Bus Line / Region
                </td>
                <td className="pt-label">Period</td>
                <td>
                  {header.periodFrom} to {header.periodTo}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pt-small" style={{ marginTop: "5px" }}>
            A &ndash; Own Vehicle Usage&nbsp;&nbsp;&nbsp;Vehicle No.{" "}
            <span className="pt-line">&nbsp;</span>
          </div>

          <table className="pt-table" style={{ marginTop: "3px" }}>
            <thead>
              <tr>
                <th rowSpan={2}>Date</th>
                <th colSpan={3}>A &ndash; Own Vehicle Usage</th>
                <th rowSpan={2}>Details of Visits / Movement</th>
                <th colSpan={2}>B. Other Conveyance</th>
                <th colSpan={2}>C. Vehicle Hire</th>
                <th colSpan={2}>D. Lunch Reimbursement</th>
              </tr>
              <tr>
                <th>Opening Km</th>
                <th>Closing Km</th>
                <th>Km Run</th>
                <th>Supp nos</th>
                <th>Amount</th>
                <th>Supp nos</th>
                <th>Amount</th>
                <th>Supp nos</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...days]
                .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                .map((d) => {
                  const km = Math.max(0, num(d.closingKm) - num(d.openingKm));
                  return (
                    <tr key={d.id}>
                      <td>{d.date}</td>
                      <td style={{ textAlign: "right" }}>{d.openingKm}</td>
                      <td style={{ textAlign: "right" }}>{d.closingKm}</td>
                      <td style={{ textAlign: "right" }}>{km || ""}</td>
                      <td>{d.details}</td>
                      <td></td>
                      <td style={{ textAlign: "right" }}>
                        {num(d.otherConvAmt) ? fmt(d.otherConvAmt) : ""}
                      </td>
                      <td></td>
                      <td style={{ textAlign: "right" }}>
                        {num(d.vehicleHireAmt) ? fmt(d.vehicleHireAmt) : ""}
                      </td>
                      <td></td>
                      <td style={{ textAlign: "right" }}>
                        {num(d.lunchAmt) ? fmt(d.lunchAmt) : ""}
                      </td>
                    </tr>
                  );
                })}
              {days.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    style={{ textAlign: "center", color: "#666" }}
                  >
                    No days entered
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ fontWeight: 700, textAlign: "right" }}>
                  Tot Km Run
                </td>
                <td style={{ fontWeight: 700, textAlign: "right" }}>
                  {dayTotals.totalKm}
                </td>
                <td className="pt-small" style={{ fontWeight: 700 }}>
                  @ Rs {num(header.ratePerKm)} = {fmt(ownVehicleAmount)}
                </td>
                <td></td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {dayTotals.otherConv ? fmt(dayTotals.otherConv) : ""}
                </td>
                <td></td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {dayTotals.vehicleHire ? fmt(dayTotals.vehicleHire) : ""}
                </td>
                <td></td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {dayTotals.lunch ? fmt(dayTotals.lunch) : ""}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div
        className="no-print sticky bottom-0 z-20 backdrop-blur"
        style={{
          borderTop: "1px solid var(--rule)",
          backgroundColor: "rgba(245,244,236,0.94)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <IndianRupee size={16} style={{ color: "var(--ink-faint)" }} />
            <span style={{ color: "var(--ink-faint)" }}>
              {isRefundDue ? "Refund due" : "Net payable"}
            </span>
            <span
              className="font-mono-ledger font-bold text-xl"
              style={{ color: "var(--stamp)" }}
            >
              ₹{fmt(Math.abs(netAmountPayable))}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
              style={{
                border: "1px solid var(--rule-strong)",
                color: "var(--ink)",
              }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={downloadExcel}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: "var(--stamp)" }}
            >
              <FileSpreadsheet size={16} /> Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
