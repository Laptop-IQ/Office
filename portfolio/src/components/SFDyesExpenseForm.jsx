import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Number to Words ───────────────────────────────────────────────────────────
const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function toWords(n) {
  if (n === 0) return "zero";
  if (n < 20) return ONES[n];
  if (n < 100)
    return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  if (n < 1000)
    return (
      ONES[Math.floor(n / 100)] +
      " hundred" +
      (n % 100 ? " " + toWords(n % 100) : "")
    );
  if (n < 100000)
    return (
      toWords(Math.floor(n / 1000)) +
      " thousand" +
      (n % 1000 ? " " + toWords(n % 1000) : "")
    );
  return (
    toWords(Math.floor(n / 100000)) +
    " lakh" +
    (n % 100000 ? " " + toWords(n % 100000) : "")
  );
}

function inWords(v) {
  const n = parseInt(v) || 0;
  if (!n) return "";
  const w = toWords(n);
  return "Only " + w[0].toUpperCase() + w.slice(1);
}

const ni = (v) => parseInt(v) || 0;

// ─── Row Definitions ──────────────────────────────────────────────────────────
const ROWS = [
  {
    label: "Air Fare",
    std: "Tickets",
    psk: "airFarePSup",
    pak: "airFareP",
    sk: "airFareSup",
    ak: "airFare",
    dash: false,
  },
  {
    label: "Rail Fare",
    std: "Tickets",
    psk: "railFarePSup",
    pak: "railFareP",
    sk: "railFareSup",
    ak: "railFare",
    dash: false,
  },
  {
    label: "Lodging",
    std: "Bill / Receipt",
    psk: "lodgingPSup",
    pak: "lodgingP",
    sk: "lodgingSup",
    ak: "lodging",
    dash: false,
  },
  {
    label: "Boarding (Hotel)",
    std: "Bill / Receipt",
    psk: null,
    pak: null,
    sk: "boardingHSup",
    ak: "boardingH",
    dash: true,
  },
  {
    label: "Boarding (Others)",
    std: "Bill / Receipt",
    psk: "boardingOPSup",
    pak: "boardingOP",
    sk: "boardingOSup",
    ak: "boardingO",
    dash: false,
  },
  {
    label: "Daily Allowance",
    std: "Breakfast, Lunch,\nDinner",
    psk: "dailyPSup",
    pak: "dailyP",
    sk: "dailySup",
    ak: "dailyAmt",
    dash: false,
  },
  {
    label: "Incidentals",
    std: "",
    psk: "incPSup",
    pak: "incP",
    sk: "incSup",
    ak: "incidentals",
    dash: false,
  },
  {
    label: "Conveyance (Local)",
    std: "Movement Details",
    psk: "convPSup",
    pak: "convP",
    sk: "convSup",
    ak: "conveyance",
    dash: false,
  },
  {
    label: "Car Hire",
    std: "Bill / Receipt",
    psk: "carPSup",
    pak: "carP",
    sk: "carSup",
    ak: "carHire",
    dash: false,
  },
  {
    label: "Telephone",
    std: "Bill / Receipt",
    psk: "telPSup",
    pak: "telP",
    sk: "telSup",
    ak: "telephone",
    dash: false,
  },
  {
    label: "Bus Entertainment",
    std: "Cash Memos",
    psk: "busPSup",
    pak: "busP",
    sk: "busSup",
    ak: "busEnt",
    dash: false,
  },
  {
    label: "Others (Annexure)",
    std: "Cash Memos",
    psk: "othPSup",
    pak: "othP",
    sk: "othSup",
    ak: "others",
    dash: false,
  },
];

// ─── Initial State ────────────────────────────────────────────────────────────
function buildInitialState() {
  const base = {
    name: "SUDHIR KUMAR",
    emplGrade: "DP0286",
    busLine: "NORTH - 1",
    voucherNo: "",
    date: "04/06/2026",
    places: "KOSI KALAN",
    departure: "BAHALGARH",
    arrival: "KOSI KALAN",
    noOfDays: "01",
    timeDep: "8:00 AM",
    timeArr: "1:30 PM",
    accompanied: "",
    customerVisited: "COLOUR TOUCH, SHREE RAM DYEING & PREETI WASHING",
    boardingHSup: "",
    boardingH: "",
    dailySup: "",
    dailyAmt: "",
    lessAdvance: "",
  };
  ROWS.forEach((r) => {
    if (r.psk && base[r.psk] === undefined) base[r.psk] = "";
    if (r.pak && base[r.pak] === undefined) base[r.pak] = "";
    if (r.sk && base[r.sk] === undefined) base[r.sk] = "";
    if (r.ak && base[r.ak] === undefined) base[r.ak] = "";
  });
  return base;
}

// ─── Shared Cell Styles ───────────────────────────────────────────────────────
const TD = "border border-gray-400 text-[11px] px-[5px] py-[2px] align-middle";
const LBL = `${TD} bg-[#e2e2e2] font-bold whitespace-nowrap`;
const HDR = `${TD} bg-[#c8c8c8] font-bold text-center`;
const BLUE_BOLD = "text-[#1a56db] font-bold";

// ─── Editable Cell ────────────────────────────────────────────────────────────
function Cell({
  value,
  onChange,
  editing,
  align = "left",
  className = "",
  numeric = false,
}) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";
  if (!editing) {
    return (
      <span
        className={`block text-[11px] ${BLUE_BOLD} ${alignClass} ${className}`}
      >
        {value}
      </span>
    );
  }
  return (
    <input
      inputMode={numeric ? "numeric" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full text-[11px] ${BLUE_BOLD} bg-yellow-50 border-b border-blue-500 outline-none px-0 ${alignClass} ${className}`}
    />
  );
}

function NormalCell({ value, onChange, editing, align = "left" }) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";
  if (!editing) {
    return (
      <span
        className={`block text-[11px] ${value ? BLUE_BOLD : ""} ${alignClass}`}
      >
        {value}
      </span>
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full text-[11px] ${BLUE_BOLD} bg-yellow-50 border-b border-blue-500 outline-none px-0 ${alignClass}`}
    />
  );
}

// ─── Print HTML Generator ─────────────────────────────────────────────────────
function generatePrintHTML(d, total, net, suppVchr) {
  const rows = ROWS.map((r) => {
    const c3 = r.dash ? "-" : d[r.psk] || "";
    const c4 = r.dash ? "-" : d[r.pak] || "";
    const c5 = d[r.sk] || "";
    const c6 = d[r.ak] || "";
    const dashStyle = r.dash ? "color:#999;text-align:center;" : "";
    return `<tr>
      <td style="padding:3px 5px;">${r.label}</td>
      <td style="padding:3px 5px;font-style:italic;font-size:10px;white-space:pre-line;text-align:center;">${r.std}</td>
      <td style="text-align:center;padding:3px 5px;${dashStyle}">${c3}</td>
      <td style="text-align:center;padding:3px 5px;${r.dash ? dashStyle : "color:#1a56db;font-weight:700;"}">${c4}</td>
      <td style="text-align:center;padding:3px 5px;color:#1a56db;font-weight:700;">${c5}</td>
      <td style="text-align:center;padding:3px 5px;color:#1a56db;font-weight:700;">${c6}</td>
      <td style="text-align:center;padding:3px 5px;font-weight:700;color:#1a56db;">${c6}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SF DYES - Travel Expenses Claim</title>
<style>
@page { size: A4; margin: 10mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, Helvetica, sans-serif; background:#fff; color:#000; }
@media print { body { display:flex; justify-content:center; } }
.wrapper { width: 190mm; margin: 10px auto; border:1px solid #444; }
.company-title { text-align:center; font-size:18px; font-weight:700; padding:6px 0; border-bottom:1px solid #444; }
table { width:100%; border-collapse:collapse; }
td,th { border:1px solid #444; padding:4px 5px; font-size:11px; vertical-align:middle; }
.label { background:#efefef; font-weight:700; white-space:nowrap; }
.heading { background:#dcdcdc; font-weight:700; text-align:center; }
.blue { color:#004fc4; font-weight:700; }
.center { text-align:center; }
.bold { font-weight:700; }
.small { font-size:10px; }
.expense-table td { height:28px; }
.total-row { background:#dcdcdc; font-weight:700; }
.net-row { background:#e8e8ff; font-weight:700; }
.words-box { border:1px solid #444; border-top:0; padding:6px; font-size:11px; }
.signature-table td { height:40px; }
.footer-note { border:1px solid #444; border-top:0; padding:4px; text-align:center; font-size:9px; color:#444; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="company-title">SF DYES PVT LTD</div>
  <table>
    <colgroup><col width="16%"><col width="34%"><col width="16%"><col width="34%"></colgroup>
    <tr>
      <td class="label">Name</td>
      <td class="blue">${d.name || ""}</td>
      <td class="heading" colspan="2">TRAVEL EXPENSES CLAIM STATEMENT</td>
    </tr>
    <tr>
      <td class="label">Empl No. / Grade</td><td class="blue">${d.emplGrade || ""}</td>
      <td class="label">Voucher No. :</td><td class="center blue">${d.voucherNo || ""}</td>
    </tr>
    <tr>
      <td class="label">Bus Line / Region</td><td class="blue">NORTH - 1</td>
      <td class="label">Date :</td><td class="center blue">${d.date || ""}</td>
    </tr>
  </table>
  <table>
    <colgroup><col width="16%"><col width="16%"><col width="38%"><col width="12%"><col width="18%"></colgroup>
    <tr>
      <td class="label" rowspan="5" style="vertical-align:top">Tour Particulars</td>
      <td class="label">Places</td><td class="blue">${d.places || ""}</td>
      <td class="label">No. of days</td><td class="center blue">${d.noOfDays || ""}</td>
    </tr>
    <tr>
      <td class="label">Departure</td><td class="blue">${d.departure || ""}</td>
      <td class="label">Time</td><td class="center blue">${d.timeDep || ""}</td>
    </tr>
    <tr>
      <td class="label">Arrival</td><td class="blue">${d.arrival || ""}</td>
      <td class="label">Time</td><td class="center blue">${d.timeArr || ""}</td>
    </tr>
    <tr>
      <td class="label">Accompanied by</td><td colspan="3">${d.accompanied || ""}</td>
    </tr>
    <tr>
      <td class="label">Customer visited</td><td colspan="3" class="blue">${d.customerVisited || ""}</td>
    </tr>
  </table>
  <table class="expense-table">
    <colgroup>
      <col width="18%"><col width="18%"><col width="10%"><col width="10%">
      <col width="10%"><col width="10%"><col width="14%">
    </colgroup>
    <thead>
      <tr>
        <th class="heading" rowspan="2">Expense Particulars</th>
        <th class="heading" rowspan="2">Standard Supporting Required</th>
        <th class="heading" colspan="2">Expenses Paid Separately</th>
        <th class="heading" colspan="2">Expenses - This Voucher</th>
        <th class="heading" rowspan="2">TOTAL</th>
      </tr>
      <tr>
        <th class="heading small">No. of Supp</th>
        <th class="heading">Rs</th>
        <th class="heading small">No.of Supp</th>
        <th class="heading">Rs.</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr><td style="height:25px"></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td style="height:25px"></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr class="total-row">
        <td colspan="2" class="center">TOTAL</td>
        <td></td><td></td><td></td><td></td>
        <td class="center blue">${total || ""}</td>
      </tr>
      <tr>
        <td colspan="2" class="center">Less : Advance</td>
        <td></td><td></td><td></td><td></td>
        <td class="center blue">${d.lessAdvance || ""}</td>
      </tr>
      <tr class="net-row">
        <td colspan="2" class="center">NET AMOUNT PAYABLE</td>
        <td class="center"></td><td></td>
        <td class="center blue">${suppVchr || ""}</td>
        <td class="center">-</td>
        <td class="center blue">${net}</td>
      </tr>
    </tbody>
  </table>
  <div class="words-box">
    <b>Rupees in Words :</b>
    <span class="blue">${inWords(net)}</span>
  </div>
  <table class="signature-table">
    <colgroup>
      <col width="22%"><col width="10%"><col width="10%"><col width="10%">
      <col width="28%"><col width="20%">
    </colgroup>
    <tr>
      <th style="text-align:left">Accounts</th>
      <th>Recd</th><th>Disp</th><th>Sign</th>
      <th rowspan="4" style="vertical-align:top;padding-top:6px;">Visit Reports Received<br>Authorised for Payment</th>
      <th rowspan="4" style="vertical-align:bottom;padding:6px;">Received the above Amount</th>
    </tr>
    <tr><td class="bold">Auth / Monitor</td><td></td><td></td><td></td></tr>
    <tr><td class="bold">Approved for Pymt</td><td></td><td></td><td></td></tr>
    <tr><td class="bold">Paid</td><td></td><td></td><td></td></tr>
  </table>
  <div class="footer-note">
    Rout : 1 - Approval for Payment by Authority &nbsp;&nbsp;
    2 - A/cs Anith / Monitor &nbsp;&nbsp;
    3 - A/cs Approval &nbsp;&nbsp;
    4 - A/cs Payment
  </div>
</div>
</body>
</html>`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SFDyesExpenseForm() {
  const navigate = useNavigate();

  // ── Saved Records — loaded from localStorage on mount ──
  const [savedRecords, setSavedRecords] = useState(() => {
    try {
      const raw = localStorage.getItem("sf-expense-records");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedId, setSelectedId] = useState(null);
  const [d, setD] = useState(buildInitialState);
  const [editing, setEditing] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false); // visual feedback on save

  const dataRef = useRef(d);
  useEffect(() => {
    dataRef.current = d;
  }, [d]);

  // Persist to localStorage whenever savedRecords changes
  useEffect(() => {
    try {
      localStorage.setItem("sf-expense-records", JSON.stringify(savedRecords));
    } catch {
      // storage full or unavailable
    }
  }, [savedRecords]);

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));

  const total = ROWS.reduce((s, r) => s + ni(d[r.ak]), 0);
  const net = total - ni(d.lessAdvance);
  const suppVchr = ROWS.reduce((s, r) => (r.sk ? s + ni(d[r.sk]) : s), 0);

  // ── Save record (upsert) ──
  const saveRecord = (data = null) => {
    const snapshot = data || dataRef.current;
    const t = ROWS.reduce((s, r) => s + ni(snapshot[r.ak]), 0);
    const n = t - ni(snapshot.lessAdvance);
    const sv = ROWS.reduce((s, r) => (r.sk ? s + ni(snapshot[r.sk]) : s), 0);

    const record = {
      ...snapshot,
      id: selectedId || Date.now(),
      total: t,
      net: n,
      suppVchr: sv,
      savedAt: new Date().toLocaleString("en-IN"),
    };

    setSavedRecords((prev) => {
      const exists = prev.find((x) => x.id === record.id);
      return exists
        ? prev.map((x) => (x.id === record.id ? record : x))
        : [record, ...prev];
    });
    setSelectedId(record.id);

    // Flash feedback
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);

    return record;
  };

  // ── Print / PDF ──
  const handlePrint = () => {
    saveRecord();
    const latest = structuredClone(dataRef.current);
    const t = ROWS.reduce((s, r) => s + ni(latest[r.ak]), 0);
    const n = t - ni(latest.lessAdvance);
    const sv = ROWS.reduce((s, r) => (r.sk ? s + ni(latest[r.sk]) : s), 0);

    const html = generatePrintHTML(latest, t, n, sv);
    const w = window.open("", "_blank");
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 300);
  };

  // ── Load a saved record into the form ──
  const loadRecord = (r) => {
    setD(r);
    setSelectedId(r.id);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Delete a saved record ──
  const deleteRecord = (id) => {
    if (!window.confirm("Is record ko delete karna chahte hain?")) return;
    setSavedRecords((prev) => prev.filter((x) => x.id !== id));
    if (selectedId === id) {
      setD(buildInitialState());
      setSelectedId(null);
      setEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-500 text-black flex flex-col items-center py-6 px-2 print:bg-white print:py-0">
      {/* ── Toolbar ── */}
      <div className="w-full max-w-[920px] flex justify-between items-center mb-3 print:hidden gap-2 flex-wrap">
        {/* Left: Back + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow transition-all"
          >
            ← Back
          </button>
          <p className="text-sm font-black tracking-widest text-white drop-shadow">
            SF DYES — EXPENSE FORM
          </p>
        </div>

        {/* Right: action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setEditing((e) => !e)}
            className={`px-4 py-1.5 text-[11px] font-bold rounded border transition-all duration-150 ${
              editing
                ? "bg-emerald-600 text-white border-emerald-700 shadow-inner"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow"
            }`}
          >
            {editing ? "✓ Done Editing" : "✏️ Edit Form"}
          </button>

          <button
            onClick={() => saveRecord()}
            className={`px-4 py-1.5 text-[11px] font-bold rounded border transition-all duration-150 ${
              saveFlash
                ? "bg-green-500 text-white border-green-600"
                : "bg-amber-500 text-white border-amber-600 hover:bg-amber-400 shadow"
            }`}
          >
            {saveFlash ? "✓ Saved!" : "💾 Save"}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-[11px] font-bold rounded bg-blue-700 text-white border border-blue-900 hover:bg-blue-800 shadow transition-all"
          >
            🖨️ Print / PDF
          </button>

          <button
            onClick={() => {
              setD(buildInitialState());
              setSelectedId(null);
              setEditing(true);
            }}
            className="px-4 py-1.5 text-[11px] font-bold rounded bg-purple-700 text-white border border-purple-900 hover:bg-purple-800 shadow"
          >
            ➕ New
          </button>
        </div>
      </div>

      {/* ── Paper ── */}
      <div className="w-full max-w-[920px] bg-white border-2 border-gray-600 shadow-2xl print:shadow-none print:border-0 print:max-w-full">
        {/* Company Heading */}
        <div className="text-center font-black text-[14px] tracking-[3px] py-[6px] border-b-2 border-gray-600 bg-gray-100">
          SF DYES PVT LTD
        </div>

        {/* ── Top Info Table ── */}
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "36%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "36%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className={LBL}>Name</td>
              <td className={TD}>
                <Cell
                  value={d.name}
                  onChange={(v) => set("name", v)}
                  editing={editing}
                />
              </td>
              <td className={HDR} colSpan={2}>
                TRAVEL EXPENSES CLAIM STATEMENT
              </td>
            </tr>
            <tr>
              <td className={LBL}>Empl No. / Grade</td>
              <td className={TD}>
                <NormalCell
                  value={d.emplGrade}
                  onChange={(v) => set("emplGrade", v)}
                  editing={editing}
                />
              </td>
              <td className={LBL}>Voucher No. :</td>
              <td className={TD}>
                <NormalCell
                  value={d.voucherNo}
                  onChange={(v) => set("voucherNo", v)}
                  editing={editing}
                />
              </td>
            </tr>
            <tr>
              <td className={LBL}>Bus Line / Region</td>
              <td className={TD}>
                <Cell
                  value={d.busLine}
                  onChange={(v) => set("busLine", v)}
                  editing={editing}
                />
              </td>
              <td className={LBL}>Date :</td>
              <td className={TD}>
                <Cell
                  value={d.date}
                  onChange={(v) => set("date", v)}
                  editing={editing}
                  align="center"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Tour Particulars ── */}
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "37%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "21%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td
                className={LBL}
                rowSpan={5}
                style={{ verticalAlign: "top", paddingTop: 5 }}
              >
                Tour
                <br />
                Particulars
              </td>
              <td className={LBL}>Places</td>
              <td className={TD}>
                <Cell
                  value={d.places}
                  onChange={(v) => set("places", v)}
                  editing={editing}
                />
              </td>
              <td className={LBL}>No. of days</td>
              <td className={TD}>
                <Cell
                  value={d.noOfDays}
                  onChange={(v) => set("noOfDays", v)}
                  editing={editing}
                  align="center"
                />
              </td>
            </tr>
            <tr>
              <td className={LBL}>Departure</td>
              <td className={TD}>
                <Cell
                  value={d.departure}
                  onChange={(v) => set("departure", v)}
                  editing={editing}
                />
              </td>
              <td className={LBL}>Time</td>
              <td className={TD}>
                <Cell
                  value={d.timeDep}
                  onChange={(v) => set("timeDep", v)}
                  editing={editing}
                  align="center"
                />
              </td>
            </tr>
            <tr>
              <td className={LBL}>Arrival</td>
              <td className={TD}>
                <Cell
                  value={d.arrival}
                  onChange={(v) => set("arrival", v)}
                  editing={editing}
                />
              </td>
              <td className={LBL}>Time</td>
              <td className={TD}>
                <Cell
                  value={d.timeArr}
                  onChange={(v) => set("timeArr", v)}
                  editing={editing}
                  align="center"
                />
              </td>
            </tr>
            <tr>
              <td className={LBL}>Accompanied by</td>
              <td className={TD} colSpan={3}>
                <NormalCell
                  value={d.accompanied}
                  onChange={(v) => set("accompanied", v)}
                  editing={editing}
                />
              </td>
            </tr>
            <tr>
              <td className={LBL}>Customer visited</td>
              <td className={TD} colSpan={3}>
                <Cell
                  value={d.customerVisited}
                  onChange={(v) => set("customerVisited", v)}
                  editing={editing}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Expense Table ── */}
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "17%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr>
              <th
                className={HDR}
                rowSpan={3}
                style={{ textAlign: "left", verticalAlign: "middle" }}
              >
                Expense
                <br />
                Particulars
              </th>
              <th
                className={HDR}
                rowSpan={3}
                style={{ textAlign: "left", verticalAlign: "middle" }}
              >
                Standard
                <br />
                Supporting
                <br />
                Required
              </th>
              <th className={HDR} colSpan={2}>
                Expenses Paid Separately
              </th>
              <th className={HDR} colSpan={2}>
                Expenses - This Voucher
              </th>
              <th
                className={HDR}
                rowSpan={3}
                style={{ verticalAlign: "middle" }}
              >
                TOTAL
              </th>
            </tr>
            <tr>
              <th className={`${HDR} text-[9px] text-gray-500`} colSpan={2}>
                —
              </th>
              <th className={`${HDR} text-[9px] text-gray-500`} colSpan={2}>
                —
              </th>
            </tr>
            <tr>
              <th className={`${HDR} text-[10px]`}>No. of Supp</th>
              <th className={HDR}>Rs</th>
              <th className={`${HDR} text-[10px]`}>No.of Supp</th>
              <th className={HDR}>Rs.</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.ak}>
                <td className={`${TD} h-[26px]`}>{r.label}</td>
                <td
                  className={`${TD} italic text-gray-500 text-[10px] whitespace-pre-line`}
                >
                  {r.std}
                </td>
                {r.dash ? (
                  <>
                    <td className={`${TD} text-center text-gray-400`}>-</td>
                    <td className={`${TD} text-center text-gray-400`}>-</td>
                  </>
                ) : (
                  <>
                    <td className={TD}>
                      {r.psk && (
                        <Cell
                          value={d[r.psk]}
                          onChange={(v) => set(r.psk, v)}
                          editing={editing}
                          align="center"
                          numeric
                        />
                      )}
                    </td>
                    <td className={TD}>
                      {r.pak && (
                        <Cell
                          value={d[r.pak]}
                          onChange={(v) => set(r.pak, v)}
                          editing={editing}
                          align="right"
                          numeric
                        />
                      )}
                    </td>
                  </>
                )}
                <td className={TD}>
                  {r.sk && (
                    <Cell
                      value={d[r.sk]}
                      onChange={(v) => set(r.sk, v)}
                      editing={editing}
                      align="center"
                      numeric
                    />
                  )}
                </td>
                <td className={TD}>
                  <Cell
                    value={d[r.ak]}
                    onChange={(v) => set(r.ak, v)}
                    editing={editing}
                    align="right"
                    numeric
                  />
                </td>
                <td className={`${TD} text-right text-[#1a56db] font-bold`}>
                  {ni(d[r.ak]) || ""}
                </td>
              </tr>
            ))}

            {/* Spacer rows */}
            {[0, 1].map((i) => (
              <tr key={`sp${i}`}>
                {[...Array(7)].map((_, j) => (
                  <td key={j} className={`${TD} h-[13px]`}></td>
                ))}
              </tr>
            ))}

            {/* TOTAL ROW */}
            <tr className="bg-[#d4d4d4]">
              <td className={`${TD} font-bold text-center`} colSpan={2}>
                TOTAL
              </td>
              <td className={TD}></td>
              <td className={TD}></td>
              <td className={TD}></td>
              <td className={TD}></td>
              <td className={`${TD} text-right text-[#1a56db] font-bold`}>
                {total || ""}
              </td>
            </tr>

            {/* Less Advance */}
            <tr>
              <td className={`${TD} text-center`} colSpan={6}>
                Less : Advance
              </td>
              <td className={TD}>
                <Cell
                  value={d.lessAdvance}
                  onChange={(v) => set("lessAdvance", v)}
                  editing={editing}
                  align="right"
                  numeric
                />
              </td>
            </tr>

            {/* Net Amount */}
            <tr className="bg-[#dde7ff]">
              <td className={`${TD} font-bold text-center`} colSpan={2}>
                NET AMOUNT PAYABLE
              </td>
              <td className={`${TD} text-center text-[#1a56db] font-bold`}>
                0
              </td>
              <td className={TD}></td>
              <td className={`${TD} text-center text-[#1a56db] font-bold`}>
                {suppVchr || ""}
              </td>
              <td className={`${TD} text-center text-gray-400`}>-</td>
              <td className={`${TD} text-right text-[#1a56db] font-bold`}>
                {net || ""}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Rupees in Words */}
        <div className="border border-gray-400 border-t-0 px-[6px] py-[4px] flex gap-2 items-center">
          <span className="text-[11px] font-bold whitespace-nowrap">
            Rupees in Words :
          </span>
          <span className={`text-[11px] ${BLUE_BOLD}`}>{inWords(net)}</span>
        </div>

        {/* Signature Table */}
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "29%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>
          <tbody>
            <tr>
              <th className={`${HDR} text-left`}>Accounts</th>
              <th className={HDR}>Recd</th>
              <th className={HDR}>Disp</th>
              <th className={HDR}>Sign</th>
              <th className={`${HDR} text-left`}>
                Visit Reports Received
                <br />
                Authorised for Payment
              </th>
              <th className={HDR}></th>
            </tr>
            <tr>
              <td className={`${LBL} h-[32px]`}>Auth / Monitor</td>
              <td className={TD}></td>
              <td className={TD}></td>
              <td className={TD}></td>
              <td
                className={TD}
                colSpan={2}
                rowSpan={3}
                style={{
                  position: "relative",
                  verticalAlign: "bottom",
                  padding: "4px 6px",
                }}
              >
                <span className="absolute bottom-1 right-2 text-[9px]">
                  Received the above Amount
                </span>
              </td>
            </tr>
            <tr>
              <td className={`${LBL} h-[32px]`}>Approved for Pymt</td>
              <td className={TD}></td>
              <td className={TD}></td>
              <td className={TD}></td>
            </tr>
            <tr>
              <td className={`${LBL} h-[32px]`}>Paid</td>
              <td className={TD}></td>
              <td className={TD}></td>
              <td className={TD}></td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="border border-gray-400 border-t-0 px-[6px] py-[3px]">
          <p className="text-[9px] text-gray-500 text-center">
            Rout : 1 - Approval for Payment by Authority &nbsp;&nbsp; 2 - A/cs
            Anith / Monitor &nbsp;&nbsp; 3 - A/cs Approval &nbsp;&nbsp; 4 - A/cs
            Payment
          </p>
        </div>
      </div>

      {/* ── Saved Records Panel ── */}
      <div className="w-full max-w-[920px] mt-5 bg-white rounded-lg shadow-lg p-4 print:hidden">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-sm text-gray-800">
            💾 Saved Records
            {savedRecords.length > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                {savedRecords.length}
              </span>
            )}
          </h2>
          {savedRecords.length > 0 && (
            <p className="text-[10px] text-gray-400">
              Browser mein permanently saved hai
            </p>
          )}
        </div>

        {savedRecords.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Koi saved record nahi hai. Form fill karke 💾 Save ya 🖨️ Print
            karein.
          </p>
        ) : (
          <div className="space-y-2">
            {savedRecords.map((r) => (
              <div
                key={r.id}
                className={`border rounded-lg p-3 flex justify-between items-center transition-all ${
                  selectedId === r.id
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-blue-700 truncate">
                    {r.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Voucher:{" "}
                    <span className="font-semibold">{r.voucherNo || "—"}</span>
                    &nbsp;|&nbsp; Date:{" "}
                    <span className="font-semibold">{r.date || "—"}</span>
                    &nbsp;|&nbsp; Net:{" "}
                    <span className="font-semibold text-green-700">
                      ₹{r.net}
                    </span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Saved: {r.savedAt}
                  </p>
                </div>

                <div className="flex gap-2 ml-3 shrink-0">
                  {/* Edit / Load */}
                  <button
                    onClick={() => loadRecord(r)}
                    className="px-3 py-1.5 text-[11px] font-bold bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
                  >
                    ✏️ Edit
                  </button>

                  {/* Print */}
                  <button
                    onClick={() => {
                      const t = ROWS.reduce((s, row) => s + ni(r[row.ak]), 0);
                      const n = t - ni(r.lessAdvance);
                      const sv = ROWS.reduce(
                        (s, row) => (row.sk ? s + ni(r[row.sk]) : s),
                        0,
                      );
                      const html = generatePrintHTML(r, t, n, sv);
                      const w = window.open("", "_blank");
                      w.document.open();
                      w.document.write(html);
                      w.document.close();
                      setTimeout(() => {
                        w.focus();
                        w.print();
                      }, 300);
                    }}
                    className="px-3 py-1.5 text-[11px] font-bold bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                  >
                    🖨️
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteRecord(r.id)}
                    className="px-3 py-1.5 text-[11px] font-bold bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit hint */}
      {!editing && (
        <p className="mt-3 text-[11px] text-white/70 print:hidden">
          Click <strong>✏️ Edit Form</strong> to modify any field
        </p>
      )}
    </div>
  );
}
