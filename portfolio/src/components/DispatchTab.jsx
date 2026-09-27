// DispatchTab.jsx — Invoice-style dispatch UI (dark/gold premium theme)
// Props: stocks, dispatches, setStocksRaw, setDispatches,
//        setChangeLog, setLastUpdated, toast, companyName, theme
// Ref:   exposes exportPDF() for the parent bottom-bar

import { useState, forwardRef, useImperativeHandle } from "react";
import * as XLSX from "xlsx";
import {
  DISPATCH_API_BASE,
  apiHeaders,
  TABS,
  STOCK_TABS,
  genId,
  nowStr,
  todayStr,
  newItem,
  normD,
} from "./shared";

// ── Design tokens (falls back to the same palette if no theme prop passed) ──
const DEFAULT_T = {
  pageBg: "#06090F",
  card: "#0B1120",
  elevated: "#101828",
  border: "#1A2640",
  borderHi: "#2A3C60",
  gold: "#D4A017",
  goldGlow: "rgba(212,160,23,0.18)",
  text1: "#E8EDF8",
  text2: "#8895AE",
  text3: "#475569",
  critical: "#F43F5E",
  urgent: "#F97316",
  warning: "#EAB308",
  info: "#3B82F6",
  safe: "#10B981",
  dangerBg: "rgba(244,63,94,0.08)",
  urgentBg: "rgba(249,115,22,0.08)",
  warnBg: "rgba(234,179,8,0.08)",
  infoBg: "rgba(59,130,246,0.08)",
  safeBg: "rgba(16,185,129,0.08)",
};

// ── Invoice number helpers ────────────────────────────────────────────────
const generateInvNo = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return `DIS-${ymd}-${rnd}`;
};
const getInvNo = (d) =>
  d.invoiceNo || `DIS-${String(d.id).slice(-8).toUpperCase()}`;

const DispatchTab = forwardRef(function DispatchTab(
  {
    stocks,
    dispatches,
    setStocksRaw,
    setDispatches,
    setChangeLog,
    setLastUpdated,
    toast,
    companyName = "My Chemical Store",
    theme,
  },
  ref,
) {
  const T = theme || DEFAULT_T;

  // ── Local style helpers (built against T) ────────────────────────────────
  const card = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 12,
  };
  const input = (focusColor) => ({
    background: T.elevated,
    border: `1px solid ${T.border}`,
    color: T.text1,
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
    outline: "none",
    width: "100%",
  });
  const smBtn = (bg, color, border) => ({
    padding: "8px 14px",
    borderRadius: 8,
    border: border || "none",
    background: bg,
    color,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });
  const TH = (extra = {}) => ({
    padding: "9px 12px",
    fontSize: 9,
    color: T.text3,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    background: T.elevated,
    borderBottom: `2px solid ${T.border}`,
    whiteSpace: "nowrap",
    ...extra,
  });
  const TD = (extra = {}) => ({
    padding: "10px 12px",
    fontSize: 12,
    borderBottom: `1px solid ${T.border}`,
    verticalAlign: "middle",
    color: T.text1,
    ...extra,
  });
  const labelStyle = {
    fontSize: 9,
    color: T.text3,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".1em",
    marginBottom: 6,
  };
  const statusTone = (overLimit, willBeZero, willBeLow) => {
    if (overLimit)
      return { color: T.critical, bg: T.dangerBg, label: "✕ OVER" };
    if (willBeZero)
      return { color: T.critical, bg: T.dangerBg, label: "🚫 OUT" };
    if (willBeLow) return { color: T.warning, bg: T.warnBg, label: "⚠ LOW" };
    return { color: T.safe, bg: T.safeBg, label: "✓ OK" };
  };

  // ── State ─────────────────────────────────────────────────────────────────
  const [invoiceNo, setInvoiceNo] = useState(generateInvNo);
  const [dispatchForm, setDispatchForm] = useState({
    customerName: "",
    location: "delhi",
    date: todayStr(),
    note: "",
    items: [newItem()],
  });
  const [dispatchSearch, setDispatchSearch] = useState("");
  const [dispatchLocFilter, setDispatchLocFilter] = useState("ALL");
  const [confirmUndoDispatch, setConfirmUndoDispatch] = useState(null);
  const [expandedDispatchId, setExpandedDispatchId] = useState(null);
  const [viewInvoiceId, setViewInvoiceId] = useState(null);
  const [editDispatchId, setEditDispatchId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // ── Log helper ────────────────────────────────────────────────────────────
  const logAction = (action, tab, details) => {
    const entry = { id: genId(), action, tab, details, time: nowStr() };
    setChangeLog((p) => [entry, ...p].slice(0, 200));
    setLastUpdated((p) => ({ ...p, [tab]: nowStr() }));
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const selectedPIds = new Set(
    dispatchForm.items.map((i) => String(i.productId)).filter(Boolean),
  );

  const dispatchItemsEnriched = dispatchForm.items.map((item) => {
    const product = item.productId
      ? (stocks[dispatchForm.location] || []).find(
          (p) => String(p.id) === String(item.productId),
        )
      : null;
    const qty = parseInt(item.qty) || 0;
    const overLimit = product && qty > 0 ? qty > product.qty : false;
    const remaining =
      product && qty > 0 ? product.qty - qty : product ? product.qty : null;
    const willBeLow =
      product && remaining !== null && remaining >= 0
        ? remaining <= product.minQty && remaining > 0
        : false;
    const willBeZero = remaining === 0;
    return {
      ...item,
      product,
      qty,
      overLimit,
      remaining,
      willBeLow,
      willBeZero,
    };
  });

  const hasAnyOverLimit = dispatchItemsEnriched.some((i) => i.overLimit);
  const validItemCount = dispatchItemsEnriched.filter(
    (i) => i.product && i.qty > 0 && !i.overLimit,
  ).length;
  const totalDispatchQty = dispatchItemsEnriched
    .filter((i) => i.product && i.qty > 0 && !i.overLimit)
    .reduce((s, i) => s + i.qty, 0);
  const canDispatch =
    validItemCount > 0 && !hasAnyOverLimit && dispatchForm.customerName.trim();

  const filteredDispatches = dispatches.filter((d) => {
    const nd = normD(d);
    const msIt = nd.items.some(
      (i) =>
        i.productName.toLowerCase().includes(dispatchSearch.toLowerCase()) ||
        (i.shade || "").toLowerCase().includes(dispatchSearch.toLowerCase()),
    );
    const ms =
      d.customerName.toLowerCase().includes(dispatchSearch.toLowerCase()) ||
      msIt ||
      getInvNo(d).toLowerCase().includes(dispatchSearch.toLowerCase());
    const ml =
      dispatchLocFilter === "ALL" ? true : d.location === dispatchLocFilter;
    return ms && ml;
  });

  // ── Edit-invoice computed values ─────────────────────────────────────────
  const editOriginalDispatch = editDispatchId
    ? dispatches.find((d) => d.id === editDispatchId)
    : null;
  const editOriginalItems = editOriginalDispatch
    ? normD(editOriginalDispatch).items
    : [];

  const virtualStock = editForm
    ? (() => {
        const base = stocks[editForm.location] || [];
        const addBack = {};
        editOriginalItems.forEach((i) => {
          addBack[String(i.productId)] =
            (addBack[String(i.productId)] || 0) + i.qtyDispatched;
        });
        return base.map((p) => ({
          ...p,
          qty: p.qty + (addBack[String(p.id)] || 0),
        }));
      })()
    : [];

  const editSelectedPIds = new Set(
    (editForm?.items || []).map((i) => String(i.productId)).filter(Boolean),
  );

  const editItemsEnriched = (editForm?.items || []).map((item) => {
    const product = item.productId
      ? virtualStock.find((p) => String(p.id) === String(item.productId))
      : null;
    const qty = parseInt(item.qty) || 0;
    const overLimit = product && qty > 0 ? qty > product.qty : false;
    const remaining =
      product && qty > 0 ? product.qty - qty : product ? product.qty : null;
    const willBeLow =
      product && remaining !== null && remaining >= 0
        ? remaining <= product.minQty && remaining > 0
        : false;
    const willBeZero = remaining === 0;
    return {
      ...item,
      product,
      qty,
      overLimit,
      remaining,
      willBeLow,
      willBeZero,
    };
  });

  const editHasAnyOverLimit = editItemsEnriched.some((i) => i.overLimit);
  const editValidItemCount = editItemsEnriched.filter(
    (i) => i.product && i.qty > 0 && !i.overLimit,
  ).length;
  const editTotalQty = editItemsEnriched
    .filter((i) => i.product && i.qty > 0 && !i.overLimit)
    .reduce((s, i) => s + i.qty, 0);
  const canSaveEdit =
    editValidItemCount > 0 &&
    !editHasAnyOverLimit &&
    (editForm?.customerName || "").trim();

  // ── Item management ───────────────────────────────────────────────────────
  const addDispatchItem = () =>
    setDispatchForm((p) => ({ ...p, items: [...p.items, newItem()] }));
  const removeDispatchItem = (_id) =>
    setDispatchForm((p) => ({
      ...p,
      items:
        p.items.length > 1 ? p.items.filter((i) => i._id !== _id) : [newItem()],
    }));
  const updateDispatchItem = (_id, field, value) =>
    setDispatchForm((p) => ({
      ...p,
      items: p.items.map((i) => (i._id === _id ? { ...i, [field]: value } : i)),
    }));

  // ── Edit invoice: open / item management ───────────────────────────────────
  const openEditDispatch = (d) => {
    const nd = normD(d);
    setViewInvoiceId(null);
    setEditDispatchId(d.id);
    setEditForm({
      customerName: d.customerName,
      date: d.date,
      note: d.note || "",
      location: d.location,
      items: nd.items.map((i) => ({
        _id: genId(),
        productId: String(i.productId),
        shade: i.shade || "",
        qty: String(i.qtyDispatched),
      })),
    });
  };
  const closeEditDispatch = () => {
    setEditDispatchId(null);
    setEditForm(null);
  };
  const addEditItem = () =>
    setEditForm((p) => ({ ...p, items: [...p.items, newItem()] }));
  const removeEditItem = (_id) =>
    setEditForm((p) => ({
      ...p,
      items:
        p.items.length > 1 ? p.items.filter((i) => i._id !== _id) : [newItem()],
    }));
  const updateEditItem = (_id, field, value) =>
    setEditForm((p) => ({
      ...p,
      items: p.items.map((i) => (i._id === _id ? { ...i, [field]: value } : i)),
    }));

  // ── Handle Dispatch ───────────────────────────────────────────────────────
  const handleDispatch = async () => {
    if (!dispatchForm.customerName.trim())
      return toast("Customer name required", "error");
    const toProcess = dispatchItemsEnriched.filter((i) => i.productId || i.qty);
    if (!toProcess.length) return toast("Koi product select nahi hua", "error");
    for (const item of toProcess) {
      if (!item.product) return toast("Ek product select nahi hua", "error");
      if (item.qty <= 0)
        return toast(
          `${item.product?.name || "Product"}: quantity enter karein`,
          "error",
        );
      if (item.overLimit)
        return toast(
          `${item.product.name}: sirf ${item.product.qty} ${item.product.unit} available`,
          "error",
        );
    }
    const pIds = toProcess.map((i) => String(i.productId));
    if (new Set(pIds).size !== pIds.length)
      return toast("Ek product dobara select hua hai", "error");

    let res;
    try {
      res = await fetch(DISPATCH_API_BASE, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          invoiceNo,
          customerName: dispatchForm.customerName.trim(),
          location: dispatchForm.location,
          date: dispatchForm.date,
          note: dispatchForm.note.trim(),
          items: toProcess.map((i) => ({
            productId: i.productId,
            shade: (i.shade || "").trim(),
            qty: i.qty,
          })),
        }),
      });
    } catch {
      res = null;
    }

    if (res) {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast(data.message || "Dispatch failed", "error");
      setStocksRaw(data.stocks);
      setDispatches(data.dispatches);
      setChangeLog(data.changeLog);
      setLastUpdated(data.lastUpdated);
      setDispatchForm((p) => ({
        ...p,
        customerName: "",
        items: [newItem()],
        note: "",
      }));
      setInvoiceNo(generateInvNo());
      toast(
        `✓ Invoice ${invoiceNo} issued — ${toProcess.length} chemical${toProcess.length > 1 ? "s" : ""} dispatched`,
      );
      return;
    }

    {
      const deductMap = {};
      toProcess.forEach((i) => {
        deductMap[String(i.productId)] = i.qty;
      });
      setStocksRaw((s) => ({
        ...s,
        [dispatchForm.location]: s[dispatchForm.location].map((p) => {
          const dd = deductMap[String(p.id)];
          return dd ? { ...p, qty: p.qty - dd } : p;
        }),
      }));
      const dispatchItems = toProcess.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        shade: (i.shade || "").trim(),
        qtyDispatched: i.qty,
        unit: i.product.unit,
        prevQty: i.product.qty,
        newQty: i.product.qty - i.qty,
      }));
      const entry = {
        id: genId(),
        invoiceNo,
        customerName: dispatchForm.customerName.trim(),
        location: dispatchForm.location,
        items: dispatchItems,
        note: dispatchForm.note.trim(),
        date: dispatchForm.date,
        time: nowStr(),
        totalQty: dispatchItems.reduce((s, i) => s + i.qtyDispatched, 0),
      };
      setDispatches((prev) => [entry, ...prev]);
      logAction(
        "DISPATCH",
        dispatchForm.location,
        `${invoiceNo} — ${dispatchItems.length} chemicals → ${entry.customerName}`,
      );
      setDispatchForm((p) => ({
        ...p,
        customerName: "",
        items: [newItem()],
        note: "",
      }));
      setInvoiceNo(generateInvNo());
      toast("⚠ Offline mode — invoice locally saved");
    }
  };

  // ── Undo Dispatch ─────────────────────────────────────────────────────────
  const handleUndoDispatch = async () => {
    const d = confirmUndoDispatch;
    let res;
    try {
      res = await fetch(`${DISPATCH_API_BASE}/${d.id}/undo`, {
        method: "POST",
        headers: apiHeaders(),
      });
    } catch {
      res = null;
    }

    if (res) {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast(data.message || "Undo failed", "error");
      setStocksRaw(data.stocks);
      setDispatches(data.dispatches);
      setChangeLog(data.changeLog);
      setLastUpdated(data.lastUpdated);
      toast(`🚫 Invoice ${getInvNo(d)} voided — stock restored`);
    } else {
      const items = normD(d).items;
      const addMap = {};
      items.forEach((i) => {
        addMap[String(i.productId)] =
          (addMap[String(i.productId)] || 0) + i.qtyDispatched;
      });
      setStocksRaw((s) => {
        const tab = s[d.location];
        if (!tab) return s;
        return {
          ...s,
          [d.location]: tab.map((p) => {
            const a = addMap[String(p.id)];
            return a ? { ...p, qty: p.qty + a } : p;
          }),
        };
      });
      setDispatches((prev) => prev.filter((x) => x.id !== d.id));
      logAction(
        "UNDO_DISPATCH",
        d.location,
        `Voided ${getInvNo(d)}: ${d.customerName} — ${items.length} item(s) restored`,
      );
      toast(`🚫 Invoice ${getInvNo(d)} voided (offline)`);
    }
    setConfirmUndoDispatch(null);
    if (expandedDispatchId === d.id) setExpandedDispatchId(null);
    if (viewInvoiceId === d.id) setViewInvoiceId(null);
  };

  // ── Save Edited Invoice ───────────────────────────────────────────────────
  const handleSaveEditDispatch = async () => {
    const d = editOriginalDispatch;
    if (!d || !editForm) return;
    if (!editForm.customerName.trim())
      return toast("Customer name required", "error");
    const toProcess = editItemsEnriched.filter((i) => i.productId || i.qty);
    if (!toProcess.length) return toast("Koi product select nahi hua", "error");
    for (const item of toProcess) {
      if (!item.product) return toast("Ek product select nahi hua", "error");
      if (item.qty <= 0)
        return toast(
          `${item.product?.name || "Product"}: quantity enter karein`,
          "error",
        );
      if (item.overLimit)
        return toast(
          `${item.product.name}: sirf ${item.product.qty} ${item.product.unit} available`,
          "error",
        );
    }
    const pIds = toProcess.map((i) => String(i.productId));
    if (new Set(pIds).size !== pIds.length)
      return toast("Ek product dobara select hua hai", "error");

    let res;
    try {
      res = await fetch(`${DISPATCH_API_BASE}/${d.id}`, {
        method: "PUT",
        headers: apiHeaders(),
        body: JSON.stringify({
          customerName: editForm.customerName.trim(),
          date: editForm.date,
          note: editForm.note.trim(),
          items: toProcess.map((i) => ({
            productId: i.productId,
            shade: (i.shade || "").trim(),
            qty: i.qty,
          })),
        }),
      });
    } catch {
      res = null;
    }

    if (res) {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast(data.message || "Update failed", "error");
      setStocksRaw(data.stocks);
      setDispatches(data.dispatches);
      setChangeLog(data.changeLog);
      setLastUpdated(data.lastUpdated);
      toast(`✓ Invoice ${getInvNo(d)} updated`);
    } else {
      setStocksRaw((s) => {
        const tab = s[editForm.location] || [];
        const restored = tab.map((p) => {
          const orig = editOriginalItems.find(
            (i) => String(i.productId) === String(p.id),
          );
          return orig ? { ...p, qty: p.qty + orig.qtyDispatched } : p;
        });
        const final = restored.map((p) => {
          const item = toProcess.find(
            (i) => String(i.productId) === String(p.id),
          );
          return item ? { ...p, qty: p.qty - item.qty } : p;
        });
        return { ...s, [editForm.location]: final };
      });

      const newItems = toProcess.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        shade: (i.shade || "").trim(),
        qtyDispatched: i.qty,
        unit: i.product.unit,
        prevQty: i.product.qty,
        newQty: i.product.qty - i.qty,
      }));

      setDispatches((prev) =>
        prev.map((x) =>
          x.id === d.id
            ? {
                ...x,
                customerName: editForm.customerName.trim(),
                date: editForm.date,
                note: editForm.note.trim(),
                items: newItems,
                totalQty: newItems.reduce((s, i) => s + i.qtyDispatched, 0),
                edited: true,
                editedAt: nowStr(),
              }
            : x,
        ),
      );

      logAction(
        "EDIT_DISPATCH",
        editForm.location,
        `${getInvNo(d)} updated${d.customerName !== editForm.customerName.trim() ? ` — ${d.customerName} → ${editForm.customerName.trim()}` : ""}`,
      );
      toast(`✓ Invoice ${getInvNo(d)} updated (offline)`);
    }
    closeEditDispatch();
  };

  // ── Export Invoice PDF (kept print-white for readability) ────────────────
  const buildInvoicesPDF = (list) => {
    const invoicePages = list
      .map((d, di) => {
        const nd = normD(d);
        const tabInfo = TABS.find((t) => t.id === d.location);
        const totalQ = nd.items.reduce((s, i) => s + i.qtyDispatched, 0);
        const rows = nd.items
          .map(
            (item, ii) => `
        <tr style="background:${ii % 2 ? "#F9FAFB" : "#fff"}">
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280;text-align:center">${ii + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;font-weight:600">${item.productName}${item.shade ? ` <span style="color:#7C3AED;font-size:10px">(${item.shade})</span>` : ""}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-size:13px;font-weight:800;text-align:center;color:#DC2626;white-space:nowrap">${item.qtyDispatched} ${item.unit}</td>
        </tr>`,
          )
          .join("");
        return `
        <div style="page-break-after:${di < list.length - 1 ? "always" : "avoid"};margin-bottom:40px">
          <div style="background:#0F172A;padding:20px 28px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="color:#F8FAFC;font-size:18px;font-weight:900;letter-spacing:-.3px">⚗ DISPATCH INVOICE</div>
              <div style="color:#64748B;font-size:11px;margin-top:3px">Chemical Stock Outward Record</div>
            </div>
            <div style="text-align:right">
              <div style="color:#64748B;font-size:9px;text-transform:uppercase;letter-spacing:.1em">Invoice No.</div>
              <div style="color:#F1F5F9;font-size:16px;font-weight:800;font-family:monospace;margin-top:3px">${getInvNo(d)}</div>
              ${d.edited ? `<div style="color:#FCD34D;font-size:9px;margin-top:4px">✏ Edited${d.editedAt ? ` · ${d.editedAt}` : ""}</div>` : ""}
            </div>
          </div>
          <div style="border:1px solid #E2E8F0;border-top:none;border-radius:0 0 10px 10px;overflow:hidden">
            <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #E2E8F0">
              <div style="padding:16px 20px;border-right:1px solid #E2E8F0">
                <div style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">From</div>
                <div style="font-size:13px;font-weight:800;color:#0F172A">${companyName}</div>
                <div style="font-size:11px;color:#64748B;margin-top:4px">Location: ${tabInfo?.label || d.location}</div>
              </div>
              <div style="padding:16px 20px">
                <div style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Dispatch To</div>
                <div style="font-size:13px;font-weight:800;color:#0F172A">${d.customerName}</div>
                ${d.note ? `<div style="font-size:11px;color:#64748B;margin-top:4px">Ref: ${d.note}</div>` : ""}
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #E2E8F0">
              <div style="padding:10px 20px;border-right:1px solid #E2E8F0;font-size:11px;color:#374151"><strong style="color:#94A3B8;font-size:9px;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:2px">Date</strong>${d.date}</div>
              <div style="padding:10px 20px;font-size:11px;color:#374151"><strong style="color:#94A3B8;font-size:9px;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:2px">Time</strong>${d.time}</div>
            </div>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#F8FAFC">
                  <th style="padding:9px 12px;font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.08em;text-align:center;width:36px">#</th>
                  <th style="padding:9px 12px;font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.08em;text-align:left">Product / Chemical</th>
                  <th style="padding:9px 12px;font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.08em;text-align:center;width:110px;white-space:nowrap">Dispatched</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr style="background:#0F172A">
                  <td colspan="2" style="padding:12px 20px;color:#64748B;font-size:11px">${nd.items.length} line item${nd.items.length > 1 ? "s" : ""}</td>
                  <td style="padding:12px 12px;text-align:center;white-space:nowrap">
                    <span style="color:#FCA5A5;font-size:14px;font-weight:900">${totalQ}</span>
                    <span style="color:#6EE7B7;font-size:11px;font-weight:700;margin-left:4px">units</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>`;
      })
      .join("");

    const totalDispatched = list.reduce(
      (s, d) => s + normD(d).items.reduce((ss, i) => ss + i.qtyDispatched, 0),
      0,
    );
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dispatch Invoices</title>
      <style>@media print{.no-print{display:none}@page{margin:16mm}}body{font-family:Arial,sans-serif;padding:20px;margin:0;font-size:12px}</style>
      </head><body>
      <div class="no-print" style="background:#0F172A;color:#fff;padding:14px 20px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:700">⚗ ${companyName} · ${list.length} Invoice${list.length > 1 ? "s" : ""} · Total ${totalDispatched} units dispatched</span>
        <button onclick="window.print()" style="background:#fff;color:#0F172A;border:none;padding:8px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px">🖨 Print / Save PDF</button>
      </div>
      ${invoicePages}
      </body></html>`;
    const w = window.open("", "_blank", "width=900,height=800");
    w.document.write(html);
    w.document.close();
  };

  const exportDispatchPDF = () => {
    if (!filteredDispatches.length)
      return toast("Koi dispatch record nahi", "error");
    buildInvoicesPDF(filteredDispatches);
  };
  const exportSingleInvoicePDF = (d) => {
    if (!d) return;
    buildInvoicesPDF([d]);
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportDispatchExcel = () => {
    if (!filteredDispatches.length)
      return toast("Koi dispatch record nahi", "error");
    const wsData = [];
    filteredDispatches.forEach((d, di) => {
      const nd = normD(d);
      const locLabel =
        TABS.find((t) => t.id === d.location)?.label || d.location;
      nd.items.forEach((item, ii) => {
        wsData.push({
          "Invoice No": ii === 0 ? getInvNo(d) : "",
          "S.N": ii === 0 ? di + 1 : "",
          Date: ii === 0 ? d.date : "",
          Customer: ii === 0 ? d.customerName : "",
          Product: item.productName,
          Shade: item.shade || "",
          "Dispatched QT": item.qtyDispatched,
          Unit: item.unit,
          "Stock Before": item.prevQty,
          "Stock After": item.newQty,
          Location: ii === 0 ? locLabel : "",
          Note: ii === 0 ? d.note || "" : "",
          Edited:
            ii === 0
              ? d.edited
                ? `Yes${d.editedAt ? ` (${d.editedAt})` : ""}`
                : "No"
              : "",
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatches");
    XLSX.writeFile(wb, `dispatch_invoices_${Date.now()}.xlsx`);
    toast("Excel exported ✓");
  };

  useImperativeHandle(ref, () => ({ exportPDF: exportDispatchPDF }));

  const viewInvoice = viewInvoiceId
    ? dispatches.find((d) => d.id === viewInvoiceId)
    : null;

  // ═══════════════════════════════ JSX ════════════════════════════════════
  return (
    <div>
      <style>{`
        .dtx-line-table { display:table; }
        .dtx-line-cards { display:none; }
        .dtx-ledger-table { display:block; }
        .dtx-ledger-cards { display:none; }
        .dtx-stats-grid { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .dtx-ledger-toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        @media (max-width: 820px) {
          .dtx-line-table { display:none !important; }
          .dtx-line-cards { display:flex !important; flex-direction:column; gap:10px; padding:12px; }
          .dtx-ledger-table { display:none !important; }
          .dtx-ledger-cards { display:flex !important; flex-direction:column; gap:10px; padding:12px; }
          .dtx-stats-grid { display:none !important; }
          .dtx-ledger-toolbar { flex-direction:column; align-items:stretch; }
          .dtx-ledger-toolbar > * { width:100% !important; }
          .dtx-pdf-btn, .dtx-excel-btn { display:none !important; }
          .dtx-modal-card { max-width:100% !important; margin:0 8px; }
          .dtx-footer-actions { flex-direction:column; }
          .dtx-footer-actions button { width:100%; }
        }
      `}</style>

      {/* ── Void Invoice Confirmation ──────────────────────────────────── */}
      {confirmUndoDispatch &&
        (() => {
          const nd = normD(confirmUndoDispatch);
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 202,
                background: "rgba(0,0,0,.75)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <div
                className="dtx-modal-card"
                style={{
                  ...card,
                  width: "100%",
                  maxWidth: 420,
                  boxShadow: `0 24px 64px rgba(0,0,0,.6), 0 0 0 1px ${T.borderHi}`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: T.dangerBg,
                    borderBottom: `1px solid rgba(244,63,94,0.3)`,
                    padding: "18px 24px",
                  }}
                >
                  <div
                    style={{
                      color: T.critical,
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: "-.2px",
                    }}
                  >
                    🚫 VOID INVOICE
                  </div>
                  <div
                    style={{
                      color: T.text2,
                      fontSize: 11,
                      marginTop: 3,
                      fontFamily: "monospace",
                    }}
                  >
                    {getInvNo(confirmUndoDispatch)}
                  </div>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ color: T.text1, fontSize: 13, marginBottom: 4 }}>
                    <strong>{confirmUndoDispatch.customerName}</strong> ke
                    dispatch ko void karna chahte hain?
                  </p>
                  <p style={{ color: T.text2, fontSize: 12, marginBottom: 16 }}>
                    {nd.items.length} item{nd.items.length > 1 ? "s" : ""} ka
                    stock wapas restore ho jayega.
                  </p>
                  <div
                    style={{
                      background: T.elevated,
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      overflow: "hidden",
                      marginBottom: 18,
                    }}
                  >
                    {nd.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 14px",
                          borderBottom:
                            i < nd.items.length - 1
                              ? `1px solid ${T.border}`
                              : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: T.text1,
                            fontWeight: 600,
                          }}
                        >
                          {item.productName}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: T.safe,
                            fontWeight: 800,
                            background: T.safeBg,
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          +{item.qtyDispatched} {item.unit}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 14px",
                        background: T.pageBg,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: T.text3,
                          fontWeight: 700,
                        }}
                      >
                        Total Restored
                      </span>
                      <span
                        style={{ fontSize: 12, color: T.safe, fontWeight: 800 }}
                      >
                        +{nd.items.reduce((s, i) => s + i.qtyDispatched, 0)}{" "}
                        units
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setConfirmUndoDispatch(null)}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 9,
                        border: `1.5px solid ${T.border}`,
                        background: "transparent",
                        color: T.text2,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUndoDispatch}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 9,
                        border: "none",
                        background: "rgba(244,63,94,0.15)",
                        color: T.critical,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "inset 0 0 0 1px rgba(244,63,94,0.4)",
                      }}
                    >
                      🚫 Void Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── View Invoice Modal ─────────────────────────────────────────── */}
      {viewInvoice &&
        (() => {
          const nd = normD(viewInvoice);
          const tabInfo = TABS.find((t) => t.id === viewInvoice.location);
          const totalQ = nd.items.reduce((s, i) => s + i.qtyDispatched, 0);
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 202,
                background: "rgba(0,0,0,.75)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setViewInvoiceId(null);
              }}
            >
              <div
                className="dtx-modal-card"
                style={{
                  ...card,
                  width: "100%",
                  maxWidth: 560,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  boxShadow: `0 24px 64px rgba(0,0,0,.6), 0 0 0 1px ${T.borderHi}`,
                }}
              >
                <div
                  style={{
                    background: T.pageBg,
                    padding: "18px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <div>
                    <div
                      style={{ color: T.text1, fontSize: 15, fontWeight: 900 }}
                    >
                      ⚗ DISPATCH INVOICE
                    </div>
                    <div style={{ color: T.text3, fontSize: 10, marginTop: 2 }}>
                      Chemical Stock Outward Record
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: T.text3,
                          fontSize: 9,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Invoice No.
                      </div>
                      <div
                        style={{
                          color: T.gold,
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: "monospace",
                          marginTop: 2,
                        }}
                      >
                        {getInvNo(viewInvoice)}
                      </div>
                      {viewInvoice.edited && (
                        <div
                          style={{
                            color: "#C4B5FD",
                            fontSize: 9,
                            marginTop: 3,
                            fontWeight: 700,
                          }}
                        >
                          ✏ Edited
                          {viewInvoice.editedAt
                            ? ` · ${viewInvoice.editedAt}`
                            : ""}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setViewInvoiceId(null)}
                      style={{
                        background: T.elevated,
                        border: `1px solid ${T.border}`,
                        borderRadius: 7,
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                        color: T.text2,
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      padding: "14px 20px",
                      borderRight: `1px solid ${T.border}`,
                    }}
                  >
                    <div style={labelStyle}>From</div>
                    <div
                      style={{ fontSize: 13, fontWeight: 800, color: T.text1 }}
                    >
                      {companyName}
                    </div>
                    <div style={{ fontSize: 11, color: T.text2, marginTop: 3 }}>
                      {tabInfo?.icon} {tabInfo?.label || viewInvoice.location}
                    </div>
                  </div>
                  <div style={{ padding: "14px 20px" }}>
                    <div style={labelStyle}>Dispatch To</div>
                    <div
                      style={{ fontSize: 13, fontWeight: 800, color: T.text1 }}
                    >
                      {viewInvoice.customerName}
                    </div>
                    {viewInvoice.note && (
                      <div
                        style={{ fontSize: 11, color: T.text2, marginTop: 3 }}
                      >
                        Ref: {viewInvoice.note}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 20px",
                      borderRight: `1px solid ${T.border}`,
                    }}
                  >
                    <div style={labelStyle}>Date</div>
                    <div style={{ fontSize: 12, color: T.text2 }}>
                      {viewInvoice.date}
                    </div>
                  </div>
                  <div style={{ padding: "10px 20px" }}>
                    <div style={labelStyle}>Time</div>
                    <div style={{ fontSize: 12, color: T.text2 }}>
                      {viewInvoice.time}
                    </div>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={TH({ textAlign: "center", width: 32 })}>#</th>
                      <th style={TH({ textAlign: "left" })}>Product</th>
                      <th style={TH({ textAlign: "center" })}>Dispatched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nd.items.map((item, i) => (
                      <tr
                        key={i}
                        style={{
                          background:
                            i % 2 ? "rgba(255,255,255,0.015)" : "transparent",
                        }}
                      >
                        <td
                          style={TD({
                            textAlign: "center",
                            color: T.text3,
                            fontSize: 11,
                          })}
                        >
                          {i + 1}
                        </td>
                        <td style={TD()}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: T.text1,
                              fontSize: 12,
                            }}
                          >
                            {item.productName}
                          </div>
                          {item.shade && (
                            <span
                              style={{
                                background: "rgba(124,58,237,0.15)",
                                color: "#C4B5FD",
                                padding: "1px 6px",
                                borderRadius: 5,
                                fontSize: 9,
                                fontWeight: 700,
                                marginTop: 3,
                                display: "inline-block",
                              }}
                            >
                              {item.shade}
                            </span>
                          )}
                        </td>
                        <td style={TD({ textAlign: "center" })}>
                          <span
                            style={{
                              fontWeight: 800,
                              color: T.critical,
                              fontSize: 13,
                            }}
                          >
                            {item.qtyDispatched}
                          </span>
                          <span
                            style={{
                              color: T.text3,
                              fontSize: 10,
                              marginLeft: 3,
                            }}
                          >
                            {item.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: T.pageBg }}>
                      <td
                        colSpan={2}
                        style={{
                          padding: "12px 20px",
                          color: T.text3,
                          fontSize: 11,
                        }}
                      >
                        {nd.items.length} line item
                        {nd.items.length > 1 ? "s" : ""}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            color: T.critical,
                            fontWeight: 900,
                            fontSize: 15,
                          }}
                        >
                          {totalQ}
                        </span>
                        <span
                          style={{
                            color: T.safe,
                            fontSize: 11,
                            fontWeight: 700,
                            marginLeft: 4,
                          }}
                        >
                          units
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <div
                  className="dtx-footer-actions"
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => openEditDispatch(viewInvoice)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 9,
                      border: `1.5px solid rgba(124,58,237,0.35)`,
                      background: "rgba(124,58,237,0.12)",
                      color: "#C4B5FD",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✏ Edit
                  </button>
                  <button
                    onClick={() => exportSingleInvoicePDF(viewInvoice)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 9,
                      border: "none",
                      background: T.gold,
                      color: "#000",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => {
                      setViewInvoiceId(null);
                      setConfirmUndoDispatch(viewInvoice);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 9,
                      border: `1.5px solid rgba(244,63,94,0.35)`,
                      background: T.dangerBg,
                      color: T.critical,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🚫 Void
                  </button>
                  <button
                    onClick={() => setViewInvoiceId(null)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 9,
                      border: `1.5px solid ${T.border}`,
                      background: "transparent",
                      color: T.text2,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── Edit Invoice Modal ────────────────────────────────────────── */}
      {editForm &&
        (() => {
          const d = editOriginalDispatch;
          if (!d) return null;
          const tabInfo = TABS.find((t) => t.id === editForm.location);
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 203,
                background: "rgba(0,0,0,.75)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) closeEditDispatch();
              }}
            >
              <div
                className="dtx-modal-card"
                style={{
                  ...card,
                  width: "100%",
                  maxWidth: 640,
                  maxHeight: "92vh",
                  overflowY: "auto",
                  boxShadow: `0 24px 64px rgba(0,0,0,.6), 0 0 0 1px ${T.borderHi}`,
                }}
              >
                <div
                  style={{
                    background: T.pageBg,
                    padding: "18px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <div>
                    <div
                      style={{ color: T.text1, fontSize: 15, fontWeight: 900 }}
                    >
                      ✏ EDIT INVOICE
                    </div>
                    <div style={{ color: T.text3, fontSize: 10, marginTop: 2 }}>
                      Chemical Stock Outward Record
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: T.text3,
                          fontSize: 9,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Invoice No.
                      </div>
                      <div
                        style={{
                          color: T.gold,
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: "monospace",
                          marginTop: 2,
                        }}
                      >
                        {getInvNo(d)}
                      </div>
                    </div>
                    <button
                      onClick={closeEditDispatch}
                      style={{
                        background: T.elevated,
                        border: `1px solid ${T.border}`,
                        borderRadius: 7,
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                        color: T.text2,
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      padding: "14px 20px",
                      borderRight: `1px solid ${T.border}`,
                    }}
                  >
                    <div style={labelStyle}>From</div>
                    <div
                      style={{ fontSize: 13, fontWeight: 800, color: T.text1 }}
                    >
                      {companyName}
                    </div>
                    <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>
                      {tabInfo?.icon} {tabInfo?.label || editForm.location}{" "}
                      <span style={{ color: T.text3 }}>(fixed)</span>
                    </div>
                  </div>
                  <div style={{ padding: "14px 20px" }}>
                    <div style={labelStyle}>Dispatch To *</div>
                    <input
                      value={editForm.customerName}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          customerName: e.target.value,
                        }))
                      }
                      style={{
                        ...input(),
                        fontSize: 13,
                        fontWeight: 600,
                        borderColor: editForm.customerName
                          ? T.border
                          : T.critical,
                      }}
                      placeholder="Customer / Party Name"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: `2px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 20px",
                      borderRight: `1px solid ${T.border}`,
                    }}
                  >
                    <div style={labelStyle}>Invoice Date</div>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, date: e.target.value }))
                      }
                      style={{ ...input(), fontSize: 12, padding: "7px 10px" }}
                    />
                  </div>
                  <div style={{ padding: "12px 20px" }}>
                    <div style={labelStyle}>Reference / Note</div>
                    <input
                      value={editForm.note}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, note: e.target.value }))
                      }
                      style={{ ...input(), fontSize: 12, padding: "7px 10px" }}
                      placeholder="Order no., PO ref., batch…"
                    />
                  </div>
                </div>

                {/* Desktop line-item table */}
                <table
                  className="dtx-line-table"
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th style={TH({ textAlign: "center", width: 32 })}>#</th>
                      <th style={TH({ textAlign: "left" })}>
                        Product / Chemical
                      </th>
                      <th style={TH({ textAlign: "center", width: 80 })}>
                        Available
                      </th>
                      <th style={TH({ textAlign: "center", width: 100 })}>
                        Qty
                      </th>
                      <th style={TH({ textAlign: "center", width: 100 })}>
                        After
                      </th>
                      <th
                        style={{
                          width: 32,
                          background: T.elevated,
                          borderBottom: `2px solid ${T.border}`,
                        }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editItemsEnriched.map((item, idx) => {
                      const avail = item.product?.qty ?? null;
                      const isDup =
                        item.productId &&
                        editForm.items.filter(
                          (i) => i.productId === item.productId,
                        ).length > 1;
                      const rowErr = item.overLimit || isDup;
                      const tone = statusTone(
                        item.overLimit,
                        item.willBeZero,
                        item.willBeLow,
                      );
                      return (
                        <tr
                          key={item._id}
                          style={{
                            background: rowErr
                              ? T.dangerBg
                              : idx % 2
                                ? "rgba(255,255,255,0.015)"
                                : "transparent",
                            borderBottom: `1px solid ${T.border}`,
                          }}
                        >
                          <td
                            style={TD({
                              textAlign: "center",
                              color: T.text3,
                              fontSize: 11,
                            })}
                          >
                            {idx + 1}
                          </td>
                          <td style={TD()}>
                            <select
                              value={item.productId}
                              onChange={(e) => {
                                updateEditItem(
                                  item._id,
                                  "productId",
                                  e.target.value,
                                );
                                updateEditItem(item._id, "qty", "");
                              }}
                              style={{
                                ...input(),
                                fontSize: 12,
                                padding: "7px 9px",
                                appearance: "auto",
                                cursor: "pointer",
                                borderColor: rowErr
                                  ? T.critical
                                  : item.productId
                                    ? T.info
                                    : T.border,
                              }}
                            >
                              <option value="">— Select Product —</option>
                              {virtualStock.map((p) => {
                                const isDisabledDup =
                                  editSelectedPIds.has(String(p.id)) &&
                                  String(p.id) !== String(item.productId);
                                return (
                                  <option
                                    key={p.id}
                                    value={p.id}
                                    disabled={isDisabledDup || p.qty === 0}
                                  >
                                    {p.name}
                                    {p.qty === 0
                                      ? " (OUT)"
                                      : isDisabledDup
                                        ? " ✓ added"
                                        : ""}
                                  </option>
                                );
                              })}
                            </select>
                            {isDup && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: T.critical,
                                  fontWeight: 700,
                                  marginTop: 3,
                                }}
                              >
                                ⚠ Already added above
                              </div>
                            )}
                          </td>
                          <td style={TD({ textAlign: "center" })}>
                            {item.product ? (
                              <span
                                style={{
                                  fontWeight: 700,
                                  color:
                                    avail === 0
                                      ? T.critical
                                      : avail <= item.product.minQty
                                        ? T.warning
                                        : T.text1,
                                  fontSize: 13,
                                }}
                              >
                                {avail}
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: T.text3,
                                    marginLeft: 3,
                                  }}
                                >
                                  {item.product.unit}
                                </span>
                              </span>
                            ) : (
                              <span style={{ color: T.text3 }}>—</span>
                            )}
                          </td>
                          <td style={TD({ textAlign: "center" })}>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.qty}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "" || /^\d+$/.test(v))
                                  updateEditItem(item._id, "qty", v);
                              }}
                              style={{
                                ...input(),
                                fontSize: 13,
                                fontWeight: 700,
                                textAlign: "center",
                                padding: "7px 10px",
                                borderColor: item.overLimit
                                  ? T.critical
                                  : item.qty && item.product && !item.overLimit
                                    ? T.safe
                                    : T.border,
                              }}
                              placeholder="0"
                              disabled={!item.productId}
                            />
                            {item.overLimit && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: T.critical,
                                  fontWeight: 700,
                                  marginTop: 2,
                                }}
                              >
                                Max {avail}
                              </div>
                            )}
                          </td>
                          <td style={TD({ textAlign: "center" })}>
                            {item.product && item.qty > 0 ? (
                              <div>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 13,
                                    color: tone.color,
                                  }}
                                >
                                  {item.overLimit ? "—" : item.remaining}
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: T.text3,
                                      marginLeft: 2,
                                    }}
                                  >
                                    {item.product.unit}
                                  </span>
                                </span>
                                <div style={{ marginTop: 3 }}>
                                  <span
                                    style={{
                                      background: tone.bg,
                                      color: tone.color,
                                      padding: "1px 6px",
                                      borderRadius: 5,
                                      fontSize: 9,
                                      fontWeight: 800,
                                    }}
                                  >
                                    {tone.label}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: T.text3, fontSize: 12 }}>
                                —
                              </span>
                            )}
                          </td>
                          <td style={TD({ textAlign: "center", width: 32 })}>
                            <button
                              onClick={() => removeEditItem(item._id)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                border: `1px solid ${T.border}`,
                                background: T.elevated,
                                color: T.text3,
                                cursor: "pointer",
                                fontSize: 15,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `1px dashed ${T.border}` }}>
                      <td colSpan={6} style={{ padding: "8px 16px" }}>
                        <button
                          onClick={addEditItem}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "none",
                            border: `1.5px dashed ${T.borderHi}`,
                            borderRadius: 7,
                            padding: "6px 14px",
                            cursor: "pointer",
                            color: T.text2,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          ＋ Add Line Item
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Mobile line-item cards */}
                <div className="dtx-line-cards">
                  {editItemsEnriched.map((item, idx) => {
                    const avail = item.product?.qty ?? null;
                    const isDup =
                      item.productId &&
                      editForm.items.filter(
                        (i) => i.productId === item.productId,
                      ).length > 1;
                    const rowErr = item.overLimit || isDup;
                    const tone = statusTone(
                      item.overLimit,
                      item.willBeZero,
                      item.willBeLow,
                    );
                    return (
                      <div
                        key={item._id}
                        style={{
                          ...card,
                          padding: 13,
                          background: rowErr ? T.dangerBg : T.card,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: T.text3,
                              fontWeight: 700,
                            }}
                          >
                            ITEM #{idx + 1}
                          </span>
                          <button
                            onClick={() => removeEditItem(item._id)}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              border: `1px solid ${T.border}`,
                              background: T.elevated,
                              color: T.text3,
                              cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            updateEditItem(
                              item._id,
                              "productId",
                              e.target.value,
                            );
                            updateEditItem(item._id, "qty", "");
                          }}
                          style={{
                            ...input(),
                            fontSize: 12,
                            padding: "9px",
                            appearance: "auto",
                            marginBottom: 8,
                            borderColor: rowErr ? T.critical : T.border,
                          }}
                        >
                          <option value="">— Select Product —</option>
                          {virtualStock.map((p) => {
                            const isDisabledDup =
                              editSelectedPIds.has(String(p.id)) &&
                              String(p.id) !== String(item.productId);
                            return (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={isDisabledDup || p.qty === 0}
                              >
                                {p.name}
                                {p.qty === 0
                                  ? " (OUT)"
                                  : isDisabledDup
                                    ? " ✓ added"
                                    : ""}
                              </option>
                            );
                          })}
                        </select>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                          }}
                        >
                          <div>
                            <div style={labelStyle}>Available</div>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: T.text1,
                              }}
                            >
                              {item.product
                                ? `${avail} ${item.product.unit}`
                                : "—"}
                            </div>
                          </div>
                          <div>
                            <div style={labelStyle}>Qty *</div>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.qty}
                              disabled={!item.productId}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "" || /^\d+$/.test(v))
                                  updateEditItem(item._id, "qty", v);
                              }}
                              style={{
                                ...input(),
                                fontWeight: 700,
                                textAlign: "center",
                                borderColor: item.overLimit
                                  ? T.critical
                                  : T.border,
                              }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {item.product && item.qty > 0 && (
                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontSize: 11, color: T.text2 }}>
                              After:{" "}
                              <strong style={{ color: tone.color }}>
                                {item.overLimit ? "—" : item.remaining}{" "}
                                {item.product.unit}
                              </strong>
                            </span>
                            <span
                              style={{
                                background: tone.bg,
                                color: tone.color,
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 800,
                              }}
                            >
                              {tone.label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={addEditItem}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      background: "none",
                      border: `1.5px dashed ${T.borderHi}`,
                      borderRadius: 9,
                      padding: "12px",
                      cursor: "pointer",
                      color: T.text2,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ＋ Add Line Item
                  </button>
                </div>

                <div
                  className="dtx-footer-actions"
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderTop: `1px solid ${T.border}`,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: 11, color: T.text2, flex: 1 }}>
                    {editValidItemCount > 0 ? (
                      `${editValidItemCount} line item${editValidItemCount > 1 ? "s" : ""} · ${editTotalQty} units`
                    ) : (
                      <span style={{ color: T.critical }}>No valid items</span>
                    )}
                  </div>
                  <button
                    onClick={closeEditDispatch}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 9,
                      border: `1.5px solid ${T.border}`,
                      background: "transparent",
                      color: T.text2,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditDispatch}
                    disabled={!canSaveEdit}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 9,
                      border: "none",
                      background: canSaveEdit ? T.gold : T.elevated,
                      color: canSaveEdit ? "#000" : T.text3,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: canSaveEdit ? "pointer" : "not-allowed",
                      boxShadow: canSaveEdit
                        ? `0 0 14px ${T.goldGlow}`
                        : "none",
                    }}
                  >
                    💾 Save Changes
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="dtx-stats-grid">
        {[
          {
            l: "Total Invoices",
            v: dispatches.length,
            color: T.info,
            icon: "🧾",
          },
          {
            l: "Customers Served",
            v: new Set(dispatches.map((d) => d.customerName)).size,
            color: T.safe,
            icon: "👥",
          },
          {
            l: "Items Dispatched",
            v: dispatches.reduce((s, d) => s + normD(d).items.length, 0),
            color: "#A78BFA",
            icon: "📦",
          },
          {
            l: "Today",
            v: dispatches.filter((d) => d.date === todayStr()).length,
            color: T.warning,
            icon: "📅",
          },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              ...card,
              padding: "12px 16px",
              flex: "1 1 80px",
              position: "relative",
              overflow: "hidden",
              borderTop: `2px solid ${s.color}`,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>
              {s.v}
            </div>
            <div
              style={{
                fontSize: 10,
                color: T.text3,
                fontWeight: 700,
                marginTop: 2,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              {s.l}
            </div>
            <div
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 26,
                opacity: 0.13,
              }}
            >
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ════════════ INVOICE CREATION FORM ════════════ */}
      <div
        style={{
          ...card,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,.35)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: T.pageBg,
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${T.border}`,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                color: T.text1,
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: "-.3px",
              }}
            >
              ⚗ DISPATCH INVOICE
            </div>
            <div style={{ color: T.text3, fontSize: 11, marginTop: 3 }}>
              Chemical Stock Outward Entry
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color: T.text3,
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: ".1em",
                marginBottom: 5,
              }}
            >
              Invoice No.
            </div>
            <div
              style={{
                color: T.gold,
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: ".05em",
                background: "rgba(212,160,23,0.1)",
                padding: "5px 12px",
                borderRadius: 7,
                border: `1px solid ${T.gold}40`,
                display: "inline-block",
              }}
            >
              {invoiceNo}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderRight: `1px solid ${T.border}`,
            }}
          >
            <div style={labelStyle}>From</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: T.text1,
                marginBottom: 8,
              }}
            >
              {companyName}
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginBottom: 5 }}>
              Stock Location
            </div>
            <select
              value={dispatchForm.location}
              onChange={(e) =>
                setDispatchForm((p) => ({
                  ...p,
                  location: e.target.value,
                  items: [newItem()],
                }))
              }
              style={{
                ...input(),
                fontSize: 12,
                padding: "7px 10px",
                appearance: "auto",
                cursor: "pointer",
              }}
            >
              {STOCK_TABS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.label} ({(stocks[t.id] || []).length} items)
                </option>
              ))}
            </select>
          </div>
          <div style={{ padding: "16px 24px" }}>
            <div style={labelStyle}>Dispatch To *</div>
            <input
              value={dispatchForm.customerName}
              onChange={(e) =>
                setDispatchForm((p) => ({ ...p, customerName: e.target.value }))
              }
              style={{
                ...input(),
                fontSize: 13,
                fontWeight: 600,
                borderColor: dispatchForm.customerName ? T.info : T.border,
              }}
              placeholder="Customer / Party Name"
            />
            {!dispatchForm.customerName && (
              <div
                style={{
                  fontSize: 10,
                  color: T.critical,
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                * Required to issue invoice
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: `2px solid ${T.border}`,
          }}
        >
          <div
            style={{
              padding: "12px 24px",
              borderRight: `1px solid ${T.border}`,
            }}
          >
            <div style={labelStyle}>Invoice Date</div>
            <input
              type="date"
              value={dispatchForm.date}
              onChange={(e) =>
                setDispatchForm((p) => ({ ...p, date: e.target.value }))
              }
              style={{ ...input(), fontSize: 12, padding: "7px 10px" }}
            />
          </div>
          <div style={{ padding: "12px 24px" }}>
            <div style={labelStyle}>Reference / Note</div>
            <input
              value={dispatchForm.note}
              onChange={(e) =>
                setDispatchForm((p) => ({ ...p, note: e.target.value }))
              }
              style={{ ...input(), fontSize: 12, padding: "7px 10px" }}
              placeholder="Order no., PO ref., batch…"
            />
          </div>
        </div>

        {/* Desktop line-item table */}
        <table
          className="dtx-line-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th style={TH({ textAlign: "center", width: 36 })}>#</th>
              <th style={TH({ textAlign: "left" })}>Product / Chemical</th>
              <th style={TH({ textAlign: "center", width: 90 })}>Available</th>
              <th style={TH({ textAlign: "center", width: 130 })}>
                Dispatch Qty
              </th>
              <th style={TH({ textAlign: "center", width: 130 })}>
                After Dispatch
              </th>
              <th
                style={{
                  width: 36,
                  background: T.elevated,
                  borderBottom: `2px solid ${T.border}`,
                }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {dispatchItemsEnriched.map((item, idx) => {
              const avail = item.product?.qty ?? null;
              const isDup =
                item.productId &&
                dispatchForm.items.filter((i) => i.productId === item.productId)
                  .length > 1;
              const rowErr = item.overLimit || isDup;
              const tone = statusTone(
                item.overLimit,
                item.willBeZero,
                item.willBeLow,
              );
              return (
                <tr
                  key={item._id}
                  style={{
                    background: rowErr
                      ? T.dangerBg
                      : idx % 2
                        ? "rgba(255,255,255,0.015)"
                        : "transparent",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <td
                    style={TD({
                      textAlign: "center",
                      color: T.text3,
                      fontSize: 11,
                      width: 36,
                    })}
                  >
                    {idx + 1}
                  </td>
                  <td style={TD()}>
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        updateDispatchItem(
                          item._id,
                          "productId",
                          e.target.value,
                        );
                        updateDispatchItem(item._id, "qty", "");
                      }}
                      style={{
                        ...input(),
                        fontSize: 12,
                        padding: "7px 9px",
                        appearance: "auto",
                        cursor: "pointer",
                        borderColor: rowErr
                          ? T.critical
                          : item.productId
                            ? T.info
                            : T.border,
                      }}
                    >
                      <option value="">— Select Product —</option>
                      {(stocks[dispatchForm.location] || []).map((p) => {
                        const isDisabledDup =
                          selectedPIds.has(String(p.id)) &&
                          String(p.id) !== String(item.productId);
                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={isDisabledDup || p.qty === 0}
                          >
                            {p.name}
                            {p.qty === 0
                              ? " (OUT)"
                              : isDisabledDup
                                ? " ✓ added"
                                : ""}
                          </option>
                        );
                      })}
                    </select>
                    {isDup && (
                      <div
                        style={{
                          fontSize: 9,
                          color: T.critical,
                          fontWeight: 700,
                          marginTop: 3,
                        }}
                      >
                        ⚠ Already added above
                      </div>
                    )}
                  </td>
                  <td style={TD({ textAlign: "center" })}>
                    {item.product ? (
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            avail === 0
                              ? T.critical
                              : avail <= item.product.minQty
                                ? T.warning
                                : T.text1,
                          fontSize: 13,
                        }}
                      >
                        {avail}
                        <span
                          style={{
                            fontSize: 10,
                            color: T.text3,
                            marginLeft: 3,
                          }}
                        >
                          {item.product.unit}
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: T.text3 }}>—</span>
                    )}
                  </td>
                  <td style={TD({ textAlign: "center" })}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.qty}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d+$/.test(v))
                          updateDispatchItem(item._id, "qty", v);
                      }}
                      style={{
                        ...input(),
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: "center",
                        padding: "7px 10px",
                        borderColor: item.overLimit
                          ? T.critical
                          : item.qty && item.product && !item.overLimit
                            ? T.safe
                            : T.border,
                      }}
                      placeholder="0"
                      disabled={!item.productId}
                    />
                    {item.overLimit && (
                      <div
                        style={{
                          fontSize: 9,
                          color: T.critical,
                          fontWeight: 700,
                          marginTop: 2,
                        }}
                      >
                        Max {avail}
                      </div>
                    )}
                  </td>
                  <td style={TD({ textAlign: "center" })}>
                    {item.product && item.qty > 0 ? (
                      <div>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: tone.color,
                          }}
                        >
                          {item.overLimit ? "—" : item.remaining}
                          <span
                            style={{
                              fontSize: 10,
                              color: T.text3,
                              marginLeft: 2,
                            }}
                          >
                            {item.product.unit}
                          </span>
                        </span>
                        <div style={{ marginTop: 3 }}>
                          <span
                            style={{
                              background: tone.bg,
                              color: tone.color,
                              padding: "1px 6px",
                              borderRadius: 5,
                              fontSize: 9,
                              fontWeight: 800,
                            }}
                          >
                            {tone.label}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: T.text3, fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={TD({ textAlign: "center", width: 36 })}>
                    <button
                      onClick={() => removeDispatchItem(item._id)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: `1px solid ${T.border}`,
                        background: T.elevated,
                        color: T.text3,
                        cursor: "pointer",
                        fontSize: 15,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px dashed ${T.border}` }}>
              <td colSpan={6} style={{ padding: "8px 16px" }}>
                <button
                  onClick={addDispatchItem}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: `1.5px dashed ${T.borderHi}`,
                    borderRadius: 7,
                    padding: "6px 14px",
                    cursor: "pointer",
                    color: T.text2,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  ＋ Add Line Item
                </button>
              </td>
            </tr>
            <tr
              style={{
                background: T.pageBg,
                borderTop: `2px solid ${T.border}`,
              }}
            >
              <td colSpan={2} style={{ padding: "14px 20px" }}>
                <span style={{ color: T.text3, fontSize: 11 }}>
                  {validItemCount > 0 ? (
                    `${validItemCount} line item${validItemCount > 1 ? "s" : ""} · ready to issue`
                  ) : (
                    <span style={{ color: T.text3 }}>No valid items</span>
                  )}
                </span>
              </td>
              <td style={{ padding: "14px 12px", textAlign: "center" }}>
                <span
                  style={{
                    color: T.text3,
                    fontSize: 10,
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  Total
                </span>
                <span style={{ color: T.text1, fontSize: 15, fontWeight: 900 }}>
                  {totalDispatchQty}
                </span>
                <span style={{ color: T.text3, fontSize: 10, marginLeft: 3 }}>
                  units
                </span>
              </td>
              <td
                colSpan={3}
                style={{ padding: "14px 20px", textAlign: "right" }}
              >
                <button
                  onClick={handleDispatch}
                  disabled={!canDispatch}
                  style={{
                    padding: "11px 22px",
                    borderRadius: 10,
                    border: "none",
                    background: canDispatch ? T.gold : T.elevated,
                    color: canDispatch ? "#000" : T.text3,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: canDispatch ? "pointer" : "not-allowed",
                    transition: "all .2s",
                    letterSpacing: "-.2px",
                    boxShadow: canDispatch ? `0 0 14px ${T.goldGlow}` : "none",
                  }}
                >
                  📤 Issue & Dispatch
                </button>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Mobile line-item cards */}
        <div className="dtx-line-cards">
          {dispatchItemsEnriched.map((item, idx) => {
            const avail = item.product?.qty ?? null;
            const isDup =
              item.productId &&
              dispatchForm.items.filter((i) => i.productId === item.productId)
                .length > 1;
            const rowErr = item.overLimit || isDup;
            const tone = statusTone(
              item.overLimit,
              item.willBeZero,
              item.willBeLow,
            );
            return (
              <div
                key={item._id}
                style={{
                  ...card,
                  padding: 13,
                  background: rowErr ? T.dangerBg : T.elevated,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 10, color: T.text3, fontWeight: 700 }}
                  >
                    ITEM #{idx + 1}
                  </span>
                  <button
                    onClick={() => removeDispatchItem(item._id)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: `1px solid ${T.border}`,
                      background: T.card,
                      color: T.text3,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
                <select
                  value={item.productId}
                  onChange={(e) => {
                    updateDispatchItem(item._id, "productId", e.target.value);
                    updateDispatchItem(item._id, "qty", "");
                  }}
                  style={{
                    ...input(),
                    fontSize: 12,
                    padding: "9px",
                    appearance: "auto",
                    marginBottom: 8,
                    borderColor: rowErr ? T.critical : T.border,
                  }}
                >
                  <option value="">— Select Product —</option>
                  {(stocks[dispatchForm.location] || []).map((p) => {
                    const isDisabledDup =
                      selectedPIds.has(String(p.id)) &&
                      String(p.id) !== String(item.productId);
                    return (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={isDisabledDup || p.qty === 0}
                      >
                        {p.name}
                        {p.qty === 0
                          ? " (OUT)"
                          : isDisabledDup
                            ? " ✓ added"
                            : ""}
                      </option>
                    );
                  })}
                </select>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={labelStyle}>Available</div>
                    <div
                      style={{ fontWeight: 700, fontSize: 13, color: T.text1 }}
                    >
                      {item.product ? `${avail} ${item.product.unit}` : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>Qty *</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.qty}
                      disabled={!item.productId}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d+$/.test(v))
                          updateDispatchItem(item._id, "qty", v);
                      }}
                      style={{
                        ...input(),
                        fontWeight: 700,
                        textAlign: "center",
                        borderColor: item.overLimit ? T.critical : T.border,
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
                {item.product && item.qty > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: T.text2 }}>
                      After:{" "}
                      <strong style={{ color: tone.color }}>
                        {item.overLimit ? "—" : item.remaining}{" "}
                        {item.product.unit}
                      </strong>
                    </span>
                    <span
                      style={{
                        background: tone.bg,
                        color: tone.color,
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {tone.label}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={addDispatchItem}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "none",
              border: `1.5px dashed ${T.borderHi}`,
              borderRadius: 9,
              padding: "12px",
              cursor: "pointer",
              color: T.text2,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ＋ Add Line Item
          </button>
          <div
            style={{
              ...card,
              padding: "13px 16px",
              background: T.pageBg,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: T.text3,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                }}
              >
                Total
              </div>
              <div style={{ color: T.text1, fontSize: 16, fontWeight: 900 }}>
                {totalDispatchQty}{" "}
                <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>
                  units
                </span>
              </div>
            </div>
            <button
              onClick={handleDispatch}
              disabled={!canDispatch}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                background: canDispatch ? T.gold : T.elevated,
                color: canDispatch ? "#000" : T.text3,
                fontSize: 13,
                fontWeight: 800,
                cursor: canDispatch ? "pointer" : "not-allowed",
                boxShadow: canDispatch ? `0 0 14px ${T.goldGlow}` : "none",
              }}
            >
              📤 Issue & Dispatch
            </button>
          </div>
        </div>
      </div>

      {/* ════════════ INVOICE LEDGER (History) ════════════ */}
      <div style={{ ...card, overflow: "hidden" }}>
        <div
          className="dtx-ledger-toolbar"
          style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: T.text1 }}>
              🧾 Invoice Ledger
            </div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>
              {filteredDispatches.length} of {dispatches.length} invoices
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 9,
                top: "50%",
                transform: "translateY(-50%)",
                color: T.text3,
                fontSize: 12,
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Invoice #, customer, product…"
              value={dispatchSearch}
              onChange={(e) => setDispatchSearch(e.target.value)}
              style={{ ...input(), paddingLeft: 30, fontSize: 11, width: 210 }}
            />
          </div>
          <select
            value={dispatchLocFilter}
            onChange={(e) => setDispatchLocFilter(e.target.value)}
            style={{
              ...input(),
              width: "auto",
              fontSize: 11,
              padding: "8px 10px",
              appearance: "auto",
              minWidth: 130,
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Locations</option>
            {STOCK_TABS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
          <button
            className="dtx-pdf-btn"
            onClick={exportDispatchPDF}
            style={smBtn(T.gold, "#000", "none")}
          >
            📄 PDF
          </button>
          <button
            className="dtx-excel-btn"
            onClick={exportDispatchExcel}
            style={smBtn(T.safeBg, T.safe, `1.5px solid rgba(16,185,129,0.3)`)}
          >
            ↓ Excel
          </button>
        </div>

        {/* Desktop ledger table */}
        <div className="dtx-ledger-table" style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              minWidth: 700,
            }}
          >
            <thead>
              <tr style={{ background: T.pageBg }}>
                {[
                  "Invoice No.",
                  "Date",
                  "Customer",
                  "Items",
                  "Qty",
                  "Location",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "10px 14px",
                      color: T.text3,
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".07em",
                      textAlign: i === 3 || i === 4 ? "center" : "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDispatches.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "52px 20px",
                      textAlign: "center",
                      color: T.text3,
                      fontSize: 13,
                    }}
                  >
                    🧾 Koi invoice nahi mili
                    {dispatchSearch && ` · "${dispatchSearch}"`}
                  </td>
                </tr>
              )}
              {filteredDispatches.map((d, idx) => {
                const nd = normD(d);
                const tabInfo = TABS.find((t) => t.id === d.location);
                const isExpanded = expandedDispatchId === d.id;
                const totalQty = nd.items.reduce(
                  (s, i) => s + i.qtyDispatched,
                  0,
                );
                return (
                  <>
                    <tr
                      key={d.id}
                      style={{
                        borderTop: `1px solid ${T.border}`,
                        cursor: "pointer",
                        background: isExpanded
                          ? T.infoBg
                          : idx % 2
                            ? "rgba(255,255,255,0.012)"
                            : "transparent",
                      }}
                      onClick={() =>
                        setExpandedDispatchId(isExpanded ? null : d.id)
                      }
                    >
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <span
                          style={{
                            background: T.elevated,
                            border: `1px solid ${T.border}`,
                            color: T.gold,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            fontFamily: "monospace",
                            letterSpacing: ".04em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getInvNo(d)}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: T.text2,
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div>{d.date}</div>
                        <div
                          style={{ fontSize: 10, color: T.text3, marginTop: 1 }}
                        >
                          {d.time}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: T.text1 }}>
                          {d.customerName}
                        </div>
                        {d.note && (
                          <div
                            style={{
                              fontSize: 10,
                              color: T.text3,
                              marginTop: 1,
                            }}
                          >
                            Ref: {d.note}
                          </div>
                        )}
                        {d.edited && (
                          <div
                            style={{
                              fontSize: 9,
                              color: "#C4B5FD",
                              marginTop: 1,
                              fontWeight: 700,
                            }}
                          >
                            ✏ Edited{d.editedAt ? ` · ${d.editedAt}` : ""}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <span
                          style={{
                            background: T.infoBg,
                            color: T.info,
                            padding: "3px 9px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {nd.items.length} item{nd.items.length > 1 ? "s" : ""}
                        </span>
                        <div
                          style={{ fontSize: 9, color: T.text3, marginTop: 3 }}
                        >
                          {isExpanded ? "▲ collapse" : "▼ expand"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 900,
                            fontSize: 14,
                            color: T.critical,
                          }}
                        >
                          −{totalQty}
                        </span>
                        <div style={{ fontSize: 9, color: T.text3 }}>units</div>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <span
                          style={{
                            background: T.elevated,
                            border: `1px solid ${T.border}`,
                            color: T.text2,
                            padding: "3px 9px",
                            borderRadius: 7,
                            fontSize: 10,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tabInfo?.icon} {tabInfo?.label || d.location}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => setViewInvoiceId(d.id)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 7,
                              border: `1.5px solid rgba(59,130,246,0.35)`,
                              background: T.infoBg,
                              color: T.info,
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditDispatch(d)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 7,
                              border: `1.5px solid rgba(124,58,237,0.35)`,
                              background: "rgba(124,58,237,0.12)",
                              color: "#C4B5FD",
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmUndoDispatch(d)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 7,
                              border: `1.5px solid rgba(244,63,94,0.35)`,
                              background: T.dangerBg,
                              color: T.critical,
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            Void
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${d.id}-exp`}>
                        <td
                          colSpan={7}
                          style={{
                            padding: "0 14px 10px 14px",
                            background: T.infoBg,
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: `1px solid rgba(59,130,246,0.25)`,
                            }}
                          >
                            <thead>
                              <tr style={{ background: T.pageBg }}>
                                <th
                                  style={{
                                    padding: "7px 12px",
                                    fontSize: 9,
                                    color: T.text3,
                                    fontWeight: 700,
                                    textAlign: "center",
                                    width: 32,
                                    textTransform: "uppercase",
                                    letterSpacing: ".06em",
                                  }}
                                >
                                  #
                                </th>
                                <th
                                  style={{
                                    padding: "7px 12px",
                                    fontSize: 9,
                                    color: T.text3,
                                    fontWeight: 700,
                                    textAlign: "left",
                                    textTransform: "uppercase",
                                    letterSpacing: ".06em",
                                  }}
                                >
                                  Product
                                </th>
                                <th
                                  style={{
                                    padding: "7px 12px",
                                    fontSize: 9,
                                    color: T.text3,
                                    fontWeight: 700,
                                    textAlign: "center",
                                    textTransform: "uppercase",
                                    letterSpacing: ".06em",
                                  }}
                                >
                                  Dispatched
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {nd.items.map((item, ii) => (
                                <tr
                                  key={ii}
                                  style={{
                                    background:
                                      ii % 2
                                        ? "rgba(59,130,246,0.05)"
                                        : "transparent",
                                    borderBottom: `1px solid rgba(59,130,246,0.15)`,
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "8px 12px",
                                      textAlign: "center",
                                      color: T.text3,
                                      fontSize: 11,
                                    }}
                                  >
                                    {ii + 1}
                                  </td>
                                  <td style={{ padding: "8px 12px" }}>
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        color: T.text1,
                                        fontSize: 12,
                                      }}
                                    >
                                      {item.productName}
                                    </span>
                                    {item.shade && (
                                      <span
                                        style={{
                                          background: "rgba(124,58,237,0.15)",
                                          color: "#C4B5FD",
                                          padding: "1px 6px",
                                          borderRadius: 5,
                                          fontSize: 9,
                                          fontWeight: 700,
                                          marginLeft: 6,
                                        }}
                                      >
                                        {item.shade}
                                      </span>
                                    )}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 12px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: 800,
                                        color: T.critical,
                                      }}
                                    >
                                      {item.qtyDispatched}
                                    </span>
                                    <span
                                      style={{
                                        color: T.text3,
                                        fontSize: 10,
                                        marginLeft: 3,
                                      }}
                                    >
                                      {item.unit}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile ledger cards */}
        <div className="dtx-ledger-cards">
          {filteredDispatches.length === 0 && (
            <div
              style={{ textAlign: "center", padding: "40px 0", color: T.text3 }}
            >
              <p style={{ fontSize: 30, marginBottom: 8 }}>🧾</p>
              <p style={{ fontWeight: 600, fontSize: 13, color: T.text2 }}>
                Koi invoice nahi mili
                {dispatchSearch && ` · "${dispatchSearch}"`}
              </p>
            </div>
          )}
          {filteredDispatches.map((d) => {
            const nd = normD(d);
            const tabInfo = TABS.find((t) => t.id === d.location);
            const isExpanded = expandedDispatchId === d.id;
            const totalQty = nd.items.reduce((s, i) => s + i.qtyDispatched, 0);
            return (
              <div key={d.id} style={card}>
                <div
                  style={{ padding: 13, cursor: "pointer" }}
                  onClick={() =>
                    setExpandedDispatchId(isExpanded ? null : d.id)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <span
                        style={{
                          background: T.elevated,
                          border: `1px solid ${T.border}`,
                          color: T.gold,
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          fontFamily: "monospace",
                        }}
                      >
                        {getInvNo(d)}
                      </span>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: T.text1,
                          marginTop: 6,
                        }}
                      >
                        {d.customerName}
                      </div>
                      {d.note && (
                        <div
                          style={{ fontSize: 10, color: T.text3, marginTop: 1 }}
                        >
                          Ref: {d.note}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: 15,
                          color: T.critical,
                        }}
                      >
                        −{totalQty}
                      </span>
                      <div style={{ fontSize: 9, color: T.text3 }}>units</div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                      marginTop: 11,
                    }}
                  >
                    <div>
                      <div style={labelStyle}>Date</div>
                      <div style={{ fontSize: 12, color: T.text2 }}>
                        {d.date} · {d.time}
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Location</div>
                      <span
                        style={{
                          background: T.elevated,
                          border: `1px solid ${T.border}`,
                          color: T.text2,
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {tabInfo?.icon} {tabInfo?.label || d.location}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 9, fontSize: 11, color: T.text3 }}>
                    <span
                      style={{
                        background: T.infoBg,
                        color: T.info,
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {nd.items.length} item{nd.items.length > 1 ? "s" : ""}
                    </span>
                    {d.edited && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: "#C4B5FD",
                          fontWeight: 700,
                        }}
                      >
                        ✏ Edited
                      </span>
                    )}
                    <span style={{ float: "right" }}>
                      {isExpanded ? "▲ collapse" : "▼ expand"}
                    </span>
                  </div>
                </div>
                {isExpanded && (
                  <div
                    style={{
                      borderTop: `1px solid ${T.border}`,
                      padding: "10px 13px 13px",
                      background: T.infoBg,
                    }}
                  >
                    {nd.items.map((item, ii) => (
                      <div
                        key={ii}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom:
                            ii < nd.items.length - 1
                              ? `1px solid rgba(59,130,246,0.15)`
                              : "none",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: T.text1,
                              fontSize: 12,
                            }}
                          >
                            {item.productName}
                          </span>
                          {item.shade && (
                            <span
                              style={{
                                background: "rgba(124,58,237,0.15)",
                                color: "#C4B5FD",
                                padding: "1px 6px",
                                borderRadius: 5,
                                fontSize: 9,
                                fontWeight: 700,
                                marginLeft: 6,
                              }}
                            >
                              {item.shade}
                            </span>
                          )}
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, color: T.critical }}>
                            {item.qtyDispatched}
                          </span>
                          <span
                            style={{
                              color: T.text3,
                              fontSize: 10,
                              marginLeft: 3,
                            }}
                          >
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                    padding: "0 13px 13px",
                  }}
                >
                  <button
                    onClick={() => setViewInvoiceId(d.id)}
                    style={{
                      padding: "9px 6px",
                      borderRadius: 8,
                      border: `1.5px solid rgba(59,130,246,0.35)`,
                      background: T.infoBg,
                      color: T.info,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEditDispatch(d)}
                    style={{
                      padding: "9px 6px",
                      borderRadius: 8,
                      border: `1.5px solid rgba(124,58,237,0.35)`,
                      background: "rgba(124,58,237,0.12)",
                      color: "#C4B5FD",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmUndoDispatch(d)}
                    style={{
                      padding: "9px 6px",
                      borderRadius: 8,
                      border: `1.5px solid rgba(244,63,94,0.35)`,
                      background: T.dangerBg,
                      color: T.critical,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Void
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDispatches.length > 0 && (
          <div
            style={{
              padding: "10px 18px",
              background: `rgba(212,160,23,0.05)`,
              borderTop: `1px solid ${T.gold}40`,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11, color: T.text2 }}>
              {filteredDispatches.length} invoice
              {filteredDispatches.length > 1 ? "s" : ""} ·{" "}
              {filteredDispatches.reduce(
                (s, d) => s + normD(d).items.length,
                0,
              )}{" "}
              line items
            </span>
            <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
              <span style={{ color: T.critical, fontWeight: 700 }}>
                Total Dispatched:{" "}
                <strong>
                  {filteredDispatches.reduce(
                    (s, d) =>
                      s +
                      normD(d).items.reduce((ss, i) => ss + i.qtyDispatched, 0),
                    0,
                  )}{" "}
                  units
                </strong>
              </span>
              <span style={{ color: T.text2 }}>
                Customers:{" "}
                <strong style={{ color: T.gold }}>
                  {new Set(filteredDispatches.map((d) => d.customerName)).size}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default DispatchTab;
