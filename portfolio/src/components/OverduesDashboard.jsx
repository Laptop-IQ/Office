import { useState, useRef, useCallback } from "react";

// ── Live Due Days Calculator ───────────────────────────────────────────────
const calcDueDays = (dated) => {
  if (!dated) return 0;
  const invoiceDate = new Date(dated);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  invoiceDate.setHours(0, 0, 0, 0);
  return Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));
};

// ── SheetJS XLSX parser ───────────────────────────────────────────────────
const parseXLSX = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, {
          type: "array",
          cellDates: true,
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, {
          raw: false,
          dateNF: "yyyy-mm-dd",
        });
        const cleaned = raw.map((r) => {
          const obj = {};
          for (const k of Object.keys(r))
            obj[k.trim()] = typeof r[k] === "string" ? r[k].trim() : r[k];
          obj["Ref. Amt."] = Number(
            String(obj["Ref. Amt."] ?? 0).replace(/,/g, ""),
          );
          obj["Pending Amt."] = Number(
            String(obj["Pending Amt."] ?? 0).replace(/,/g, ""),
          );
          obj["Due Days"] = calcDueDays(obj["Dated"]);
          return obj;
        });
        resolve(cleaned);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

// ── Embedded data ─────────────────────────────────────────────────────────
const RAW_DATA = [
  {
    Salesman: "SUDHIR <SF>",
    Account: "BANKE BIHARI PROCESS",
    Dated: "2025-12-12",
    Type: "OpBl",
    "Ref. No.": "D/4463/2025-26",
    "Ref. Amt.": 32580,
    "Pending Amt.": 32580,
    Due: "Y",
    "Due Date": "2026-01-11",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "BANKE BIHARI PROCESS",
    Dated: "2025-12-19",
    Type: "OpBl",
    "Ref. No.": "D/4589/2025-26",
    "Ref. Amt.": 11092,
    "Pending Amt.": 11092,
    Due: "Y",
    "Due Date": "2026-01-18",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "COLOUR TOUCH-KOSI",
    Dated: "2026-03-10",
    Type: "OpBl",
    "Ref. No.": "D/6069/2025-26",
    "Ref. Amt.": 30652,
    "Pending Amt.": 30652,
    Due: "Y",
    "Due Date": "2026-04-09",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "COLOUR TOUCH-KOSI",
    Dated: "2026-04-13",
    Type: "SupO",
    "Ref. No.": "D/185/2026-27",
    "Ref. Amt.": 24582,
    "Pending Amt.": 24582,
    Due: "Y",
    "Due Date": "2026-05-13",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "COLOUR TOUCH-KOSI",
    Dated: "2026-04-13",
    Type: "SupO",
    "Ref. No.": "D/192/2026-27",
    "Ref. Amt.": 604,
    "Pending Amt.": 604,
    Due: "Y",
    "Due Date": "2026-05-13",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "COLOUR TOUCH-KOSI",
    Dated: "2026-05-05",
    Type: "SupO",
    "Ref. No.": "D/511/2026-27",
    "Ref. Amt.": 10325,
    "Pending Amt.": 10325,
    Due: "Y",
    "Due Date": "2026-06-04",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "COTTON CARE",
    Dated: "2025-04-16",
    Type: "OpBl",
    "Ref. No.": "D/320/2025-26",
    "Ref. Amt.": 38500,
    "Pending Amt.": 38500,
    Due: "Y",
    "Due Date": "2025-05-01",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "JMD WASHING",
    Dated: "2025-10-04",
    Type: "OpBl",
    "Ref. No.": "D/3312/2025-26",
    "Ref. Amt.": 23300,
    "Pending Amt.": 23300,
    Due: "Y",
    "Due Date": "2025-11-03",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "JMD WASHING",
    Dated: "2025-10-16",
    Type: "OpBl",
    "Ref. No.": "D/3530/2025-26",
    "Ref. Amt.": 62540,
    "Pending Amt.": 62540,
    Due: "Y",
    "Due Date": "2025-11-15",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "JMD WASHING",
    Dated: "2025-10-16",
    Type: "OpBl",
    "Ref. No.": "D/3531/2025-26",
    "Ref. Amt.": 14160,
    "Pending Amt.": 14160,
    Due: "Y",
    "Due Date": "2025-11-15",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "KAPIL WASHING",
    Dated: "2026-02-27",
    Type: "OpBl",
    "Ref. No.": "D/5904/2025-26",
    "Ref. Amt.": 64567,
    "Pending Amt.": 64567,
    Due: "Y",
    "Due Date": "2026-04-28",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "KAPIL WASHING",
    Dated: "2026-03-21",
    Type: "OpBl",
    "Ref. No.": "D/6332/2025-26",
    "Ref. Amt.": 23453,
    "Pending Amt.": 23453,
    Due: "Y",
    "Due Date": "2026-05-20",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "KAPIL WASHING",
    Dated: "2026-03-26",
    Type: "OpBl",
    "Ref. No.": "D/6440/2025-26",
    "Ref. Amt.": 31270,
    "Pending Amt.": 31270,
    Due: "Y",
    "Due Date": "2026-05-25",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "KRISHNA CREATIONS",
    Dated: "2026-01-17",
    Type: "OpBl",
    "Ref. No.": "D/5121/2025-26",
    "Ref. Amt.": 5546,
    "Pending Amt.": 5546,
    Due: "Y",
    "Due Date": "2026-04-17",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "MAA VAISHNO TEXTILE",
    Dated: "2025-05-28",
    Type: "OpBl",
    "Ref. No.": "F/887/2025-26",
    "Ref. Amt.": 20060,
    "Pending Amt.": 20060,
    Due: "Y",
    "Due Date": "2025-06-12",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "NEELKANTH ENTERPRISES",
    Dated: "2026-02-06",
    Type: "OpBl",
    "Ref. No.": "D/5478/2025-26",
    "Ref. Amt.": 7965,
    "Pending Amt.": 7965,
    Due: "Y",
    "Due Date": "2026-02-07",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "NEELKANTH ENTERPRISES",
    Dated: "2026-02-09",
    Type: "OpBl",
    "Ref. No.": "D/5538/2025-26",
    "Ref. Amt.": 15104,
    "Pending Amt.": 15104,
    Due: "Y",
    "Due Date": "2026-02-10",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "NEELKANTH ENTERPRISES",
    Dated: "2026-02-11",
    Type: "OpBl",
    "Ref. No.": "D/5600/2025-26",
    "Ref. Amt.": 9499,
    "Pending Amt.": 9499,
    Due: "Y",
    "Due Date": "2026-02-12",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "NEELKANTH ENTERPRISES",
    Dated: "2026-03-30",
    Type: "OpBl",
    "Ref. No.": "D/6506/2025-26",
    "Ref. Amt.": 11682,
    "Pending Amt.": 11682,
    Due: "Y",
    "Due Date": "2026-03-31",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "OM ENTERPRISES-LONI",
    Dated: "2026-05-27",
    Type: "SupO",
    "Ref. No.": "D/822/2026-27",
    "Ref. Amt.": 113422,
    "Pending Amt.": 113422,
    Due: "Y",
    "Due Date": "2026-05-28",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "PERFECT SPECIALITY CHEMICALS PVT LTD",
    Dated: "2026-03-02",
    Type: "OpBl",
    "Ref. No.": "D/5955/2025-26",
    "Ref. Amt.": 22514,
    "Pending Amt.": 22514,
    Due: "Y",
    "Due Date": "2026-03-12",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "PREETI WASHING -KOTWAN",
    Dated: "2025-12-13",
    Type: "OpBl",
    "Ref. No.": "D/4473/2025-26",
    "Ref. Amt.": 34220,
    "Pending Amt.": 34220,
    Due: "Y",
    "Due Date": "2025-12-28",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "PREETI WASHING -KOTWAN",
    Dated: "2025-12-13",
    Type: "OpBl",
    "Ref. No.": "D/4474/2025-26",
    "Ref. Amt.": 5664,
    "Pending Amt.": 5664,
    Due: "Y",
    "Due Date": "2025-12-28",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "PREETI WASHING",
    Dated: "2025-03-28",
    Type: "OpBl",
    "Ref. No.": "F/5236/2024-25",
    "Ref. Amt.": 171100,
    "Pending Amt.": 167864,
    Due: "Y",
    "Due Date": "2025-03-28",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-03-24",
    Type: "OpBl",
    "Ref. No.": "D/6380/2025-26",
    "Ref. Amt.": 51920,
    "Pending Amt.": 41920,
    Due: "Y",
    "Due Date": "2026-05-23",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-04-03",
    Type: "SupO",
    "Ref. No.": "D/40/2026-27",
    "Ref. Amt.": 83804,
    "Pending Amt.": 83804,
    Due: "Y",
    "Due Date": "2026-06-02",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-04-18",
    Type: "SupO",
    "Ref. No.": "D/293/2026-27",
    "Ref. Amt.": 46008,
    "Pending Amt.": 46008,
    Due: "N",
    "Due Date": "2026-06-17",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-05-07",
    Type: "SupO",
    "Ref. No.": "D/549/2026-27",
    "Ref. Amt.": 78482,
    "Pending Amt.": 78482,
    Due: "N",
    "Due Date": "2026-07-06",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-05-22",
    Type: "SupO",
    "Ref. No.": "D/764/2026-27",
    "Ref. Amt.": 48675,
    "Pending Amt.": 48675,
    Due: "N",
    "Due Date": "2026-07-21",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-05-30",
    Type: "SupO",
    "Ref. No.": "D/882/2026-27",
    "Ref. Amt.": 47601,
    "Pending Amt.": 47601,
    Due: "N",
    "Due Date": "2026-07-29",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-05-30",
    Type: "SupO",
    "Ref. No.": "D/910/2026-27",
    "Ref. Amt.": 3115,
    "Pending Amt.": 3115,
    Due: "N",
    "Due Date": "2026-07-29",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-06-03",
    Type: "SupO",
    "Ref. No.": "D/973/2026-27",
    "Ref. Amt.": 18821,
    "Pending Amt.": 18821,
    Due: "N",
    "Due Date": "2026-08-02",
  },
  {
    Salesman: "SUDHIR SF DYES",
    Account: "RIGHT WASH GARMENT PROCESSING COMPANY PR",
    Dated: "2026-06-11",
    Type: "SupO",
    "Ref. No.": "D/1096/2026-27",
    "Ref. Amt.": 32143,
    "Pending Amt.": 32143,
    Due: "N",
    "Due Date": "2026-08-10",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SAINATH INDUSTRIES",
    Dated: "2026-04-14",
    Type: "SupO",
    "Ref. No.": "D/205/2026-27",
    "Ref. Amt.": 103681,
    "Pending Amt.": 103681,
    Due: "Y",
    "Due Date": "2026-05-14",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SATYA DYING",
    Dated: "2025-12-31",
    Type: "OpBl",
    "Ref. No.": "F/4099/2025-26",
    "Ref. Amt.": 21275,
    "Pending Amt.": 21275,
    Due: "Y",
    "Due Date": "2026-03-01",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SATYA DYING",
    Dated: "2026-01-10",
    Type: "OpBl",
    "Ref. No.": "F/4296/2025-26",
    "Ref. Amt.": 74340,
    "Pending Amt.": 74340,
    Due: "Y",
    "Due Date": "2026-03-11",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SATYA DYING",
    Dated: "2026-01-10",
    Type: "OpBl",
    "Ref. No.": "F/4297/2025-26",
    "Ref. Amt.": 79060,
    "Pending Amt.": 79060,
    Due: "Y",
    "Due Date": "2026-03-11",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SATYA DYING",
    Dated: "2026-01-12",
    Type: "OpBl",
    "Ref. No.": "D/5034/2025-26",
    "Ref. Amt.": 12194,
    "Pending Amt.": 12194,
    Due: "Y",
    "Due Date": "2026-03-13",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SATYA DYING",
    Dated: "2026-02-14",
    Type: "OpBl",
    "Ref. No.": "D/5659/2025-26",
    "Ref. Amt.": 71536,
    "Pending Amt.": 71536,
    Due: "Y",
    "Due Date": "2026-04-15",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SATYA DYING",
    Dated: "2026-02-14",
    Type: "OpBl",
    "Ref. No.": "F/4932/2025-26",
    "Ref. Amt.": 61950,
    "Pending Amt.": 61950,
    Due: "Y",
    "Due Date": "2026-04-15",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SATYA DYING",
    Dated: "2026-02-14",
    Type: "OpBl",
    "Ref. No.": "F/4933/2025-26",
    "Ref. Amt.": 41831,
    "Pending Amt.": 41831,
    Due: "Y",
    "Due Date": "2026-04-15",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SATYA DYING",
    Dated: "2026-02-18",
    Type: "OpBl",
    "Ref. No.": "D/5723/2025-26",
    "Ref. Amt.": 4012,
    "Pending Amt.": 4012,
    Due: "Y",
    "Due Date": "2026-04-19",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHREEJEE TRADERS",
    Dated: "2026-06-09",
    Type: "SupO",
    "Ref. No.": "D/1079/2026-27",
    "Ref. Amt.": 16992,
    "Pending Amt.": 16992,
    Due: "N",
    "Due Date": "2026-07-09",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHREEJEE TRADERS",
    Dated: "2026-06-11",
    Type: "SupO",
    "Ref. No.": "D/1107/2026-27",
    "Ref. Amt.": 16992,
    "Pending Amt.": 16992,
    Due: "N",
    "Due Date": "2026-07-11",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHRI RAM UNIT",
    Dated: "2025-12-12",
    Type: "OpBl",
    "Ref. No.": "D/4464/2025-26",
    "Ref. Amt.": 104985,
    "Pending Amt.": 93144,
    Due: "Y",
    "Due Date": "2026-01-11",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHRI RAM UNIT",
    Dated: "2025-12-16",
    Type: "OpBl",
    "Ref. No.": "F/3838/2025-26",
    "Ref. Amt.": 10679,
    "Pending Amt.": 10679,
    Due: "Y",
    "Due Date": "2026-01-15",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHRI RAM UNIT",
    Dated: "2025-12-23",
    Type: "OpBl",
    "Ref. No.": "F/3948/2025-26",
    "Ref. Amt.": 19293,
    "Pending Amt.": 19293,
    Due: "Y",
    "Due Date": "2026-01-22",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHRI RAM UNIT",
    Dated: "2026-01-27",
    Type: "OpBl",
    "Ref. No.": "D/5279/2025-26",
    "Ref. Amt.": 33099,
    "Pending Amt.": 33099,
    Due: "Y",
    "Due Date": "2026-02-26",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHRI RAM UNIT",
    Dated: "2026-02-16",
    Type: "OpBl",
    "Ref. No.": "D/5680/2025-26",
    "Ref. Amt.": 53100,
    "Pending Amt.": 53100,
    Due: "Y",
    "Due Date": "2026-03-18",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHRI RAM UNIT",
    Dated: "2026-04-10",
    Type: "SupO",
    "Ref. No.": "D/156/2026-27",
    "Ref. Amt.": 31860,
    "Pending Amt.": 31860,
    Due: "Y",
    "Due Date": "2026-05-10",
  },
  {
    Salesman: "SUDHIR <SF>",
    Account: "SHRI RAM UNIT",
    Dated: "2026-06-04",
    Type: "SupO",
    "Ref. No.": "D/985/2026-27",
    "Ref. Amt.": 34182,
    "Pending Amt.": 34182,
    Due: "N",
    "Due Date": "2026-07-04",
  },
];

const INITIAL_DATA = RAW_DATA.map((r) => ({
  ...r,
  "Due Days": calcDueDays(r["Dated"]),
}));

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");
const fmtK = (n) =>
  n >= 100000
    ? "₹" + (n / 100000).toFixed(1) + "L"
    : n >= 1000
      ? "₹" + (n / 1000).toFixed(0) + "K"
      : "₹" + n;

const getDueBadge = (days) => {
  if (days > 180)
    return {
      label: `${days}d`,
      bg: "bg-red-100 text-red-800 border border-red-300",
    };
  if (days > 90)
    return {
      label: `${days}d`,
      bg: "bg-orange-100 text-orange-800 border border-orange-300",
    };
  if (days > 30)
    return {
      label: `${days}d`,
      bg: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    };
  if (days > 0)
    return {
      label: `${days}d`,
      bg: "bg-blue-100 text-blue-800 border border-blue-300",
    };
  return {
    label: `${Math.abs(days)}d ahead`,
    bg: "bg-green-100 text-green-800 border border-green-300",
  };
};

const getPdfTitle = (search, filteredData) => {
  const q = search.trim();
  if (!q) return "Supple Rubber Overdues Report - All";
  const accounts = [
    ...new Set(filteredData.map((r) => r["Account"]).filter(Boolean)),
  ];
  if (accounts.length === 1) return `Supple Rubber Overdues Payments - ${accounts[0]}`;
  if (accounts.length <= 3)
    return `Supple Rubber Overdues Report - ${accounts.join(", ")}`;
  return `Supple Rubber Overdues Report - ${q.toUpperCase()}`;
};

// ── Account Summary Builder ───────────────────────────────────────────────
const buildAccountSummary = (data) => {
  const map = {};
  data.forEach((r) => {
    const acct = r["Account"] || "Unknown";
    if (!map[acct])
      map[acct] = {
        account: acct,
        total: 0,
        entries: 0,
        maxDays: 0,
        overdueAmt: 0,
        overdueCount: 0,
      };
    map[acct].total += r["Pending Amt."] || 0;
    map[acct].entries += 1;
    map[acct].maxDays = Math.max(map[acct].maxDays, r["Due Days"] ?? 0);
    if ((r["Due Days"] ?? 0) > 0) {
      map[acct].overdueAmt += r["Pending Amt."] || 0;
      map[acct].overdueCount += 1;
    }
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
};

// ── PDF Generator ─────────────────────────────────────────────────────────
const generatePDF = (data, title) => {
  const total = data.reduce((s, r) => s + (r["Pending Amt."] || 0), 0);
  const overdue = data.filter((r) => r["Due Days"] > 0);
  const overdueTotal = overdue.reduce(
    (s, r) => s + (r["Pending Amt."] || 0),
    0,
  );
  const maxDays = data.length
    ? Math.max(...data.map((r) => r["Due Days"] ?? 0))
    : 0;
  const maxAcct = (
    data.find((r) => r["Due Days"] === maxDays)?.["Account"] ?? ""
  ).slice(0, 22);

  const getBadgeClass = (days) => {
    if (days > 180) return "badge badge-red";
    if (days > 90) return "badge badge-orange";
    if (days > 30) return "badge badge-yellow";
    if (days > 0) return "badge badge-blue";
    return "badge badge-green";
  };

  const rows = data
    .map((r, i) => {
      const d = getDueBadge(r["Due Days"]);
      const bc = getBadgeClass(r["Due Days"]);
      return `<tr>
      <td>${r["Account"]}</td>
      <td style="white-space:nowrap">${r["Dated"]}</td>
      <td style="font-family:monospace;font-size:10px">${r["Ref. No."]}</td>
      <td style="text-align:right;font-weight:600">₹${Number(r["Pending Amt."]).toLocaleString("en-IN")}</td>
      <td style="text-align:center"><span class="${bc}">${d.label}</span></td>
    </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
/* ── CRITICAL: force browsers to print backgrounds & borders ── */
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{font-family:Arial,sans-serif;color:#1e293b;background:#fff;padding:20px}
.hdr{background:#1e3a5f!important;color:#fff!important;padding:16px 20px;border-radius:8px;margin-bottom:16px;border:2px solid #1e3a5f}
.hdr h1{font-size:18px;font-weight:700;color:#fff!important}
.hdr .sub{font-size:11px;color:#cbd5e1!important;margin-top:3px}
.stats{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.stat{flex:1;min-width:120px;background:#f8fafc!important;border-radius:6px;padding:10px 12px;border:1.5px solid #94a3b8!important;border-left:4px solid #2563eb!important}
.stat.red{border-left:4px solid #dc2626!important}
.stat.orange{border-left:4px solid #ea580c!important}
.stat.purple{border-left:4px solid #7c3aed!important}
.stat .val{font-size:16px;font-weight:700;color:#1e3a5f}
.stat .lbl{font-size:9px;color:#64748b;margin-top:3px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.stat .sub{font-size:9px;color:#64748b;margin-top:2px}
/* ── TABLE: full borders everywhere ── */
table{width:100%;border-collapse:collapse;border:2px solid #334155!important}
thead tr{background:#1e3a5f!important}
thead th{padding:7px 8px;font-size:10px;font-weight:700;color:#fff!important;text-align:left;
  border-right:1px solid #475569!important;border-bottom:2px solid #475569!important}
thead th:last-child{border-right:none!important}
tbody tr{border-bottom:1px solid #94a3b8!important}
tbody tr:nth-child(even){background:#f1f5f9!important}
tbody td{border:1px solid #94a3b8!important;padding:5px 8px;font-size:10.5px;color:#1e293b}
.total-row td{font-weight:700;background:#dbeafe!important;font-size:11px;padding:7px 8px;
  border:1.5px solid #2563eb!important;color:#1e3a5f!important}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;border:1px solid transparent}
.badge-red{background:#fee2e2!important;color:#991b1b!important;border-color:#fca5a5!important}
.badge-orange{background:#ffedd5!important;color:#9a3412!important;border-color:#fdba74!important}
.badge-yellow{background:#fef9c3!important;color:#854d0e!important;border-color:#fde047!important}
.badge-blue{background:#dbeafe!important;color:#1e40af!important;border-color:#93c5fd!important}
.badge-green{background:#dcfce7!important;color:#166534!important;border-color:#86efac!important}
.footer{margin-top:14px;font-size:9px;color:#64748b;text-align:center;border-top:1px solid #cbd5e1;padding-top:8px}
@media print{
  body{padding:10px}
  table{page-break-inside:auto}
  tr{page-break-inside:avoid;page-break-after:auto}
  thead{display:table-header-group}
}
</style></head><body>
<div class="hdr">
  <h1>${title}</h1>
  <div class="sub">Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} &nbsp;</div>
</div>
<div class="stats">
  <div class="stat"><div class="val">${fmt(total)}</div><div class="lbl">Total Pending</div><div class="sub">${data.length} entries</div></div>
  <div class="stat red"><div class="val">${overdue.length}</div><div class="lbl">Overdue Entries</div><div class="sub">${fmt(overdueTotal)}</div></div>
  <div class="stat orange"><div class="val">${fmt(overdueTotal)}</div><div class="lbl">Overdue Amount</div><div class="sub">${overdue.length} entries</div></div>
  <div class="stat purple"><div class="val">${maxDays}d</div><div class="lbl">Max Due Days</div><div class="sub">${maxAcct}</div></div>
</div>
<table>
  <thead><tr>
    <th>Account</th>
    <th>Date</th>
    <th>Ref. No.</th>
    <th style="text-align:right">Pending Amt.</th>
    <th style="text-align:center">Due Days</th>
  </tr></thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td colspan="3" style="text-align:right;padding-right:12px">TOTAL (${data.length} records)</td>
      <td style="text-align:right;font-size:12px">₹${total.toLocaleString("en-IN")}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<div class="footer">Supple Rubber &nbsp;•&nbsp; Confidential &nbsp;•&nbsp; ${new Date().toLocaleString("en-IN")}</div>
</body></html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [search, setSearch] = useState("");
  const [filterDue, setFilterDue] = useState("all");
  const [sortCol, setSortCol] = useState("Due Days");
  const [sortDir, setSortDir] = useState("desc");
  const [fileName, setFileName] = useState(
    "S_F_OVERDUES__VERY_DELAYED_15_06_26.xlsx",
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parseErr, setParseErr] = useState("");
  const [activeTab, setActiveTab] = useState("detail"); // "detail" | "summary"
  const [summarySort, setSummarySort] = useState("total"); // "total" | "entries" | "maxDays"
  const [expandedAccount, setExpandedAccount] = useState(null);
  const fileRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setParseErr("");
    try {
      const parsed = await parseXLSX(file);
      if (!parsed.length) throw new Error("No data rows found.");
      setData(parsed);
      setFileName(file.name);
    } catch (e) {
      setParseErr("Parse failed: " + (e.message || "Unknown error"));
    }
    setUploading(false);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // Filtered + sorted detail rows
  const filtered = data
    .filter((r) => {
      const q = search.toLowerCase();
      if (
        q &&
        !(
          (r["Account"] || "").toLowerCase().includes(q) ||
          (r["Ref. No."] || "").toLowerCase().includes(q) ||
          (r["Salesman"] || "").toLowerCase().includes(q)
        )
      )
        return false;
      if (filterDue === "overdue" && r["Due Days"] <= 0) return false;
      if (filterDue === "notdue" && r["Due Days"] > 0) return false;
      if (filterDue === "critical" && r["Due Days"] <= 90) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortCol],
        bv = b[sortCol];
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });

  const total = filtered.reduce((s, r) => s + (r["Pending Amt."] || 0), 0);
  const overdueRows = filtered.filter((r) => r["Due Days"] > 0);
  const overdueTotal = overdueRows.reduce(
    (s, r) => s + (r["Pending Amt."] || 0),
    0,
  );
  const criticalRows = filtered.filter((r) => r["Due Days"] > 90);
  const maxDueDays = filtered.length
    ? Math.max(...filtered.map((r) => r["Due Days"] ?? 0))
    : 0;
  const maxDueAcct =
    filtered.find((r) => r["Due Days"] === maxDueDays)?.["Account"] ?? "";
  const pdfTitle = getPdfTitle(search, filtered);

  // Account summary (always from full data)
  const accountSummary = buildAccountSummary(data).sort((a, b) => {
    if (summarySort === "entries") return b.entries - a.entries;
    if (summarySort === "maxDays") return b.maxDays - a.maxDays;
    return b.total - a.total;
  });
  const grandTotal = accountSummary.reduce((s, r) => s + r.total, 0);
  const maxBar = accountSummary[0]?.total || 1;

  const thSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  };
  const ThIcon = ({ col }) =>
    sortCol !== col ? (
      <span className="text-slate-400 ml-1 text-xs">↕</span>
    ) : (
      <span className="text-blue-300 ml-1 text-xs">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );

  return (
    <div
      className="min-h-screen bg-slate-50 text-black"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-800 px-4 py-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
              📊 SF Overdues Dashboard
            </h1>
            <p className="text-blue-200 text-xs mt-1">
              {fileName} &nbsp;•&nbsp; {data.length} records &nbsp;•&nbsp;{" "}
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => generatePDF(filtered, pdfTitle)}
              className="flex items-center gap-2 bg-white text-blue-800 font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-50 transition text-sm"
            >
              ⬇ Download PDF
            </button>
            <p className="text-blue-300 text-xs italic">📄 {pdfTitle}.pdf</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* ── Upload ── */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current.click()}
          className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all
            ${dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50"}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <span className="text-2xl">{uploading ? "⏳" : "📂"}</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {uploading ? "Processing…" : "Upload new Excel file"}
            </p>
            <p className="text-xs text-slate-400">
              Click or drag & drop .xlsx — Due Days auto-calculated from invoice
              date
            </p>
          </div>
        </div>
        {parseErr && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
            {parseErr}
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              lbl: "Total Pending",
              val: fmt(total),
              sub: `${filtered.length} entries shown`,
              border: "border-blue-600",
              txt: "text-slate-800",
            },
            {
              lbl: "Overdue Amt.",
              val: fmt(overdueTotal),
              sub: `${overdueRows.length} entries`,
              border: "border-red-500",
              txt: "text-red-700",
            },
            {
              lbl: "Critical (90d+)",
              val: criticalRows.length,
              sub: fmt(
                criticalRows.reduce((s, r) => s + (r["Pending Amt."] || 0), 0),
              ),
              border: "border-orange-500",
              txt: "text-orange-700",
            },
            {
              lbl: "Max Due Days",
              val: `${maxDueDays}d`,
              sub:
                maxDueAcct.length > 20
                  ? maxDueAcct.slice(0, 20) + "…"
                  : maxDueAcct || "—",
              border: "border-purple-500",
              txt: "text-purple-700",
            },
          ].map(({ lbl, val, sub, border, txt }) => (
            <div
              key={lbl}
              className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${border}`}
            >
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                {lbl}
              </p>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${txt}`}>
                {val}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-slate-200 p-1 rounded-xl w-fit">
          {[
            ["detail", "📋 Detail View"],
            ["summary", "📊 Account Summary"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === tab ? "bg-white text-blue-800 shadow" : "text-slate-600 hover:text-slate-800"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            TAB 1 — DETAIL VIEW
        ══════════════════════════════════════════ */}
        {activeTab === "detail" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍  Search account, ref no., salesman…"
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
              />
              <select
                value={filterDue}
                onChange={(e) => setFilterDue(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">All Entries</option>
                <option value="overdue">Overdue Only</option>
                <option value="critical">Critical (90d+)</option>
                <option value="notdue">Not Yet Due</option>
              </select>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
                      {[
                        ["Account", "Account"],
                        ["Dated", "Dated"],
                        ["Ref. No.", "Ref. No."],
                        ["Pending Amt.", "Pending Amt."],
                        ["Due Days", "Due Days"],
                      ].map(([label, col]) => (
                        <th
                          key={col}
                          onClick={() => thSort(col)}
                          className={`px-4 py-3 text-left cursor-pointer select-none hover:bg-slate-700 transition
                          ${col === "Pending Amt." ? "text-right" : ""}${col === "Due Days" ? " text-center" : ""}`}
                        >
                          {label}
                          <ThIcon col={col} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const badge = getDueBadge(r["Due Days"]);
                      return (
                        <tr
                          key={i}
                          className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                        >
                          <td
                            className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate"
                            title={r["Account"]}
                          >
                            {r["Account"]}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {r["Dated"]}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                            {r["Ref. No."]}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">
                            ₹{Number(r["Pending Amt."]).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50 border-t-2 border-blue-300">
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-right font-bold text-slate-700 text-sm"
                      >
                        TOTAL ({filtered.length} records)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-800 text-base">
                        {fmt(total)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {filtered.map((r, i) => {
                const badge = getDueBadge(r["Due Days"]);
                return (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-slate-800 text-sm leading-tight">
                        {r["Account"]}
                      </p>
                      <span
                        className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        <span className="font-medium text-slate-600">
                          Date:
                        </span>{" "}
                        {r["Dated"]}
                      </span>
                      <span>
                        <span className="font-medium text-slate-600">
                          Type:
                        </span>{" "}
                        {r["Type"]}
                      </span>
                      <span className="col-span-2">
                        <span className="font-medium text-slate-600">Ref:</span>{" "}
                        <span className="font-mono">{r["Ref. No."]}</span>
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                        Pending Amount
                      </span>
                      <span className="text-base font-bold text-slate-800">
                        ₹{Number(r["Pending Amt."]).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filtered.length > 0 && (
                <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center">
                  <span className="font-semibold text-sm">
                    Total ({filtered.length} records)
                  </span>
                  <span className="font-bold text-lg">{fmt(total)}</span>
                </div>
              )}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium">No records match your filters.</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            TAB 2 — ACCOUNT SUMMARY (Pivot view)
        ══════════════════════════════════════════ */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            {/* Sort controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                Sort by:
              </span>
              {[
                ["total", "Pending Amount"],
                ["entries", "No. of Bills"],
                ["maxDays", "Max Due Days"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSummarySort(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${summarySort === key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop Summary Table */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left w-6 font-semibold">#</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Account Name
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Bills
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Total Pending
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Overdue Amt.
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Max Days
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold"
                      style={{ minWidth: "140px" }}
                    >
                      Amount Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountSummary.map((row, i) => {
                    const pct = ((row.total / grandTotal) * 100).toFixed(1);
                    const barW = Math.round((row.total / maxBar) * 100);
                    const isExpanded = expandedAccount === row.account;
                    const subRows = data
                      .filter((r) => r["Account"] === row.account)
                      .sort((a, b) => b["Due Days"] - a["Due Days"]);
                    const badge = getDueBadge(row.maxDays);
                    return (
                      <>
                        <tr
                          key={row.account}
                          onClick={() =>
                            setExpandedAccount(isExpanded ? null : row.account)
                          }
                          className={`border-b border-slate-100 cursor-pointer transition-colors
                            ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                            ${isExpanded ? "bg-blue-50 hover:bg-blue-50" : "hover:bg-blue-50/60"}`}
                        >
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                            {i + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`transition-transform text-slate-400 text-xs ${isExpanded ? "rotate-90" : ""}`}
                              >
                                ▶
                              </span>
                              <span className="truncate" title={row.account}>
                                {row.account}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                              {row.entries}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {fmt(row.total)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-red-700">
                            {row.overdueAmt > 0 ? (
                              fmt(row.overdueAmt)
                            ) : (
                              <span className="text-green-600 text-xs font-medium">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex-1 bg-slate-100 rounded-full h-2"
                                style={{ minWidth: "80px" }}
                              >
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${barW}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-500 font-medium w-10 text-right">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded sub-rows */}
                        {isExpanded &&
                          subRows.map((r, j) => {
                            const sb = getDueBadge(r["Due Days"]);
                            return (
                              <tr
                                key={`${row.account}-${j}`}
                                className="bg-blue-50/80 border-b border-blue-100"
                              >
                                <td className="px-4 py-2 text-slate-300">└</td>
                                <td className="px-4 py-2 text-slate-500 text-xs pl-8 font-mono">
                                  {r["Ref. No."]}
                                </td>
                                <td className="px-4 py-2 text-center text-xs text-slate-400">
                                  {r["Dated"]}
                                </td>
                                <td className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
                                  ₹
                                  {Number(r["Pending Amt."]).toLocaleString(
                                    "en-IN",
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right text-xs text-slate-400">
                                  {r["Type"]}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${sb.bg}`}
                                  >
                                    {sb.label}
                                  </span>
                                </td>
                                <td></td>
                              </tr>
                            );
                          })}
                      </>
                    );
                  })}
                  {/* Grand Total row */}
                  <tr className="bg-blue-50 border-t-2 border-blue-300">
                    <td
                      colSpan={2}
                      className="px-4 py-3 font-bold text-slate-700 text-sm"
                    >
                      GRAND TOTAL ({accountSummary.length} accounts)
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {data.length}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-800 text-base">
                      {fmt(grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">
                      {fmt(
                        data
                          .filter((r) => r["Due Days"] > 0)
                          .reduce((s, r) => s + (r["Pending Amt."] || 0), 0),
                      )}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Summary Cards */}
            <div className="sm:hidden space-y-3">
              {accountSummary.map((row, i) => {
                const pct = ((row.total / grandTotal) * 100).toFixed(1);
                const barW = Math.round((row.total / maxBar) * 100);
                const badge = getDueBadge(row.maxDays);
                const isExpanded = expandedAccount === row.account;
                const subRows = data
                  .filter((r) => r["Account"] === row.account)
                  .sort((a, b) => b["Due Days"] - a["Due Days"]);
                return (
                  <div
                    key={row.account}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() =>
                        setExpandedAccount(isExpanded ? null : row.account)
                      }
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-xs text-slate-400 font-mono">
                            #{i + 1}
                          </span>
                          <p className="font-semibold text-slate-800 text-sm leading-tight mt-0.5">
                            {row.account}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-800 text-base">
                            {fmt(row.total)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {pct}% of total
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5 mb-3">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${barW}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex gap-3">
                          <span className="text-slate-500">
                            <span className="font-medium">{row.entries}</span>{" "}
                            bills
                          </span>
                          {row.overdueAmt > 0 && (
                            <span className="text-red-600 font-medium">
                              Overdue: {fmt(row.overdueAmt)}
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-blue-100 bg-blue-50/50 px-4 py-3 space-y-2">
                        {subRows.map((r, j) => {
                          const sb = getDueBadge(r["Due Days"]);
                          return (
                            <div
                              key={j}
                              className="flex items-center justify-between text-xs py-1 border-b border-blue-100 last:border-0"
                            >
                              <div>
                                <p className="font-mono text-slate-600">
                                  {r["Ref. No."]}
                                </p>
                                <p className="text-slate-400">
                                  {r["Dated"]} &nbsp;·&nbsp; {r["Type"]}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-700">
                                  ₹
                                  {Number(r["Pending Amt."]).toLocaleString(
                                    "en-IN",
                                  )}
                                </p>
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold ${sb.bg}`}
                                >
                                  {sb.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="bg-blue-600 text-white rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">
                    Grand Total ({accountSummary.length} accounts)
                  </span>
                  <span className="font-bold text-lg">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
