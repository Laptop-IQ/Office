// DispatchTab.jsx — Invoice-style dispatch UI
// Props: stocks, dispatches, setStocksRaw, setDispatches,
//        setChangeLog, setLastUpdated, toast, companyName
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
  S,
} from "./shared";

// ── Invoice number helpers ────────────────────────────────────────────────────
const generateInvNo = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return `DIS-${ymd}-${rnd}`;
};
const getInvNo = (d) =>
  d.invoiceNo || `DIS-${String(d.id).slice(-8).toUpperCase()}`;

// ── Shared cell style ─────────────────────────────────────────────────────────
const TH = (extra = {}) => ({
  padding: "9px 12px",
  fontSize: 9,
  color: "#94A3B8",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  background: "#F8FAFC",
  borderBottom: "2px solid #E2E8F0",
  whiteSpace: "nowrap",
  ...extra,
});
const TD = (extra = {}) => ({
  padding: "10px 12px",
  fontSize: 12,
  borderBottom: "1px solid #F1F5F9",
  verticalAlign: "middle",
  ...extra,
});
const labelStyle = {
  fontSize: 9,
  color: "#94A3B8",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".1em",
  marginBottom: 6,
};

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
  },
  ref,
) {
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

  // Stock "as if this dispatch never happened" — original qtyDispatched added
  // back to whatever is currently in stock, so availability shown while
  // editing is correct instead of already looking short by this invoice.
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

    try {
      const res = await fetch(DISPATCH_API_BASE, {
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
      const data = await res.json();
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
    } catch {
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
    try {
      const res = await fetch(`${DISPATCH_API_BASE}/${d.id}/undo`, {
        method: "POST",
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return toast(data.message || "Undo failed", "error");
      setStocksRaw(data.stocks);
      setDispatches(data.dispatches);
      setChangeLog(data.changeLog);
      setLastUpdated(data.lastUpdated);
      toast(`🚫 Invoice ${getInvNo(d)} voided — stock restored`);
    } catch {
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

    try {
      const res = await fetch(`${DISPATCH_API_BASE}/${d.id}`, {
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
      const data = await res.json();
      if (!res.ok) return toast(data.message || "Update failed", "error");
      setStocksRaw(data.stocks);
      setDispatches(data.dispatches);
      setChangeLog(data.changeLog);
      setLastUpdated(data.lastUpdated);
      toast(`✓ Invoice ${getInvNo(d)} updated`);
    } catch {
      // Offline: restore what this invoice originally took, then deduct the
      // edited quantities — so stock stays correct however items changed.
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
        `${getInvNo(d)} updated${
          d.customerName !== editForm.customerName.trim()
            ? ` — ${d.customerName} → ${editForm.customerName.trim()}`
            : ""
        }`,
      );
      toast(`✓ Invoice ${getInvNo(d)} updated (offline)`);
    }
    closeEditDispatch();
  };

  // ── Export Invoice PDF ────────────────────────────────────────────────────
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

  // Single-invoice PDF — used by the View Invoice modal's PDF button so a
  // customer copy can be printed straight from that invoice's own view.
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

  // ── View Invoice Modal ────────────────────────────────────────────────────
  const viewInvoice = viewInvoiceId
    ? dispatches.find((d) => d.id === viewInvoiceId)
    : null;

  // ═══════════════════════════════ JSX ════════════════════════════════════
  return (
    <div>
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
                background: "rgba(0,0,0,.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  width: "100%",
                  maxWidth: 420,
                  boxShadow: "0 24px 64px rgba(0,0,0,.25)",
                  overflow: "hidden",
                }}
              >
                <div style={{ background: "#7F1D1D", padding: "18px 24px" }}>
                  <div
                    style={{
                      color: "#FEE2E2",
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: "-.2px",
                    }}
                  >
                    🚫 VOID INVOICE
                  </div>
                  <div
                    style={{
                      color: "#FCA5A5",
                      fontSize: 11,
                      marginTop: 3,
                      fontFamily: "monospace",
                    }}
                  >
                    {getInvNo(confirmUndoDispatch)}
                  </div>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <p
                    style={{ color: "#374151", fontSize: 13, marginBottom: 4 }}
                  >
                    <strong>{confirmUndoDispatch.customerName}</strong> ke
                    dispatch ko void karna chahte hain?
                  </p>
                  <p
                    style={{ color: "#64748B", fontSize: 12, marginBottom: 16 }}
                  >
                    {nd.items.length} item{nd.items.length > 1 ? "s" : ""} ka
                    stock wapas restore ho jayega.
                  </p>
                  <div
                    style={{
                      background: "#F8FAFC",
                      borderRadius: 10,
                      border: "1px solid #E2E8F0",
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
                              ? "1px solid #E5E7EB"
                              : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#0F172A",
                            fontWeight: 600,
                          }}
                        >
                          {item.productName}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#059669",
                            fontWeight: 800,
                            background: "#D1FAE5",
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
                        background: "#0F172A",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#64748B",
                          fontWeight: 700,
                        }}
                      >
                        Total Restored
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6EE7B7",
                          fontWeight: 800,
                        }}
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
                        border: "1.5px solid #E2E8F0",
                        background: "#fff",
                        color: "#374151",
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
                        background: "#DC2626",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
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
                background: "rgba(0,0,0,.6)",
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
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  width: "100%",
                  maxWidth: 560,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  boxShadow: "0 24px 64px rgba(0,0,0,.25)",
                  overflow: "hidden",
                }}
              >
                {/* Invoice header */}
                <div
                  style={{
                    background: "#0F172A",
                    padding: "18px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#F8FAFC",
                        fontSize: 15,
                        fontWeight: 900,
                      }}
                    >
                      ⚗ DISPATCH INVOICE
                    </div>
                    <div
                      style={{ color: "#64748B", fontSize: 10, marginTop: 2 }}
                    >
                      Chemical Stock Outward Record
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: "#64748B",
                          fontSize: 9,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Invoice No.
                      </div>
                      <div
                        style={{
                          color: "#F1F5F9",
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
                        background: "rgba(255,255,255,.1)",
                        border: "none",
                        borderRadius: 7,
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                        color: "#94A3B8",
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
                {/* From / To */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 20px",
                      borderRight: "1px solid #E5E7EB",
                    }}
                  >
                    <div style={labelStyle}>From</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#0F172A",
                      }}
                    >
                      {companyName}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}
                    >
                      {tabInfo?.icon} {tabInfo?.label || viewInvoice.location}
                    </div>
                  </div>
                  <div style={{ padding: "14px 20px" }}>
                    <div style={labelStyle}>Dispatch To</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#0F172A",
                      }}
                    >
                      {viewInvoice.customerName}
                    </div>
                    {viewInvoice.note && (
                      <div
                        style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}
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
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 20px",
                      borderRight: "1px solid #E5E7EB",
                    }}
                  >
                    <div style={labelStyle}>Date</div>
                    <div style={{ fontSize: 12, color: "#374151" }}>
                      {viewInvoice.date}
                    </div>
                  </div>
                  <div style={{ padding: "10px 20px" }}>
                    <div style={labelStyle}>Time</div>
                    <div style={{ fontSize: 12, color: "#374151" }}>
                      {viewInvoice.time}
                    </div>
                  </div>
                </div>
                {/* Line items */}
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
                        style={{ background: i % 2 ? "#F9FAFB" : "#fff" }}
                      >
                        <td
                          style={TD({
                            textAlign: "center",
                            color: "#94A3B8",
                            fontSize: 11,
                          })}
                        >
                          {i + 1}
                        </td>
                        <td style={TD()}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#0F172A",
                              fontSize: 12,
                            }}
                          >
                            {item.productName}
                          </div>
                          {item.shade && (
                            <span
                              style={{
                                background: "#F3E8FF",
                                color: "#6D28D9",
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
                              color: "#DC2626",
                              fontSize: 13,
                            }}
                          >
                            {item.qtyDispatched}
                          </span>
                          <span
                            style={{
                              color: "#94A3B8",
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
                    <tr style={{ background: "#0F172A" }}>
                      <td
                        colSpan={2}
                        style={{
                          padding: "12px 20px",
                          color: "#64748B",
                          fontSize: 11,
                        }}
                      >
                        {nd.items.length} line item
                        {nd.items.length > 1 ? "s" : ""}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            color: "#FCA5A5",
                            fontWeight: 900,
                            fontSize: 15,
                          }}
                        >
                          {totalQ}
                        </span>
                        <span
                          style={{
                            color: "#6EE7B7",
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
                {/* Actions */}
                <div style={{ padding: "14px 20px", display: "flex", gap: 10 }}>
                  <button
                    onClick={() => openEditDispatch(viewInvoice)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 9,
                      border: "1.5px solid #DDD6FE",
                      background: "#F5F3FF",
                      color: "#6D28D9",
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
                      border: "1.5px solid #0F172A",
                      background: "#0F172A",
                      color: "#fff",
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
                      border: "1.5px solid #FECACA",
                      background: "#FEF2F2",
                      color: "#DC2626",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🚫 Void Invoice
                  </button>
                  <button
                    onClick={() => setViewInvoiceId(null)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 9,
                      border: "1.5px solid #E2E8F0",
                      background: "#fff",
                      color: "#374151",
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
                background: "rgba(0,0,0,.6)",
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
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  width: "100%",
                  maxWidth: 640,
                  maxHeight: "92vh",
                  overflowY: "auto",
                  boxShadow: "0 24px 64px rgba(0,0,0,.25)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    background: "#0F172A",
                    padding: "18px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#F8FAFC",
                        fontSize: 15,
                        fontWeight: 900,
                      }}
                    >
                      ✏ EDIT INVOICE
                    </div>
                    <div
                      style={{ color: "#64748B", fontSize: 10, marginTop: 2 }}
                    >
                      Chemical Stock Outward Record
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: "#64748B",
                          fontSize: 9,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Invoice No.
                      </div>
                      <div
                        style={{
                          color: "#F1F5F9",
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
                        background: "rgba(255,255,255,.1)",
                        border: "none",
                        borderRadius: 7,
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                        color: "#94A3B8",
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

                {/* From / To */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 20px",
                      borderRight: "1px solid #E5E7EB",
                    }}
                  >
                    <div style={labelStyle}>From</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#0F172A",
                      }}
                    >
                      {companyName}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}
                    >
                      {tabInfo?.icon} {tabInfo?.label || editForm.location}{" "}
                      <span style={{ color: "#CBD5E1" }}>(fixed)</span>
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
                        ...S.input(
                          editForm.customerName ? "#2563EB" : "#EF4444",
                        ),
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                      placeholder="Customer / Party Name"
                    />
                  </div>
                </div>

                {/* Date / Note */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: "2px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 20px",
                      borderRight: "1px solid #E5E7EB",
                    }}
                  >
                    <div style={labelStyle}>Invoice Date</div>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, date: e.target.value }))
                      }
                      style={{
                        ...S.input(),
                        fontSize: 12,
                        padding: "7px 10px",
                      }}
                    />
                  </div>
                  <div style={{ padding: "12px 20px" }}>
                    <div style={labelStyle}>Reference / Note</div>
                    <input
                      value={editForm.note}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, note: e.target.value }))
                      }
                      style={{
                        ...S.input(),
                        fontSize: 12,
                        padding: "7px 10px",
                      }}
                      placeholder="Order no., PO ref., batch…"
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                          background: "#F8FAFC",
                          borderBottom: "2px solid #E2E8F0",
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
                      const sc = item.overLimit
                        ? "#DC2626"
                        : item.willBeZero
                          ? "#DC2626"
                          : item.willBeLow
                            ? "#D97706"
                            : "#059669";
                      const stIcon = item.overLimit
                        ? "✕ OVER"
                        : item.willBeZero
                          ? "🚫 OUT"
                          : item.willBeLow
                            ? "⚠ LOW"
                            : "✓ OK";
                      return (
                        <tr
                          key={item._id}
                          style={{
                            background: rowErr
                              ? "#FFF5F5"
                              : idx % 2
                                ? "#FAFAFA"
                                : "#fff",
                            borderBottom: "1px solid #F1F5F9",
                          }}
                        >
                          <td
                            style={TD({
                              textAlign: "center",
                              color: "#94A3B8",
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
                                ...S.input(
                                  rowErr
                                    ? "#EF4444"
                                    : item.productId
                                      ? "#2563EB"
                                      : undefined,
                                ),
                                fontSize: 12,
                                padding: "7px 9px",
                                appearance: "auto",
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
                                    style={{
                                      color:
                                        p.qty === 0
                                          ? "#DC2626"
                                          : isDisabledDup
                                            ? "#94A3B8"
                                            : "inherit",
                                    }}
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
                                  color: "#DC2626",
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
                                      ? "#DC2626"
                                      : avail <= item.product.minQty
                                        ? "#D97706"
                                        : "#0F172A",
                                  fontSize: 13,
                                }}
                              >
                                {avail}
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "#94A3B8",
                                    marginLeft: 3,
                                  }}
                                >
                                  {item.product.unit}
                                </span>
                              </span>
                            ) : (
                              <span style={{ color: "#CBD5E1" }}>—</span>
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
                                ...S.input(
                                  item.overLimit
                                    ? "#EF4444"
                                    : item.qty &&
                                        item.product &&
                                        !item.overLimit
                                      ? "#059669"
                                      : undefined,
                                ),
                                fontSize: 13,
                                fontWeight: 700,
                                textAlign: "center",
                                padding: "7px 10px",
                              }}
                              placeholder="0"
                              disabled={!item.productId}
                            />
                            {item.overLimit && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "#DC2626",
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
                                    color: sc,
                                  }}
                                >
                                  {item.overLimit ? "—" : item.remaining}
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "#94A3B8",
                                      marginLeft: 2,
                                    }}
                                  >
                                    {item.product.unit}
                                  </span>
                                </span>
                                <div style={{ marginTop: 3 }}>
                                  <span
                                    style={{
                                      background: item.overLimit
                                        ? "#FEE2E2"
                                        : item.willBeZero
                                          ? "#FEE2E2"
                                          : item.willBeLow
                                            ? "#FEF3C7"
                                            : "#D1FAE5",
                                      color: sc,
                                      padding: "1px 6px",
                                      borderRadius: 5,
                                      fontSize: 9,
                                      fontWeight: 800,
                                    }}
                                  >
                                    {stIcon}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#CBD5E1", fontSize: 12 }}>
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
                                border: "1px solid #E2E8F0",
                                background: "#F8FAFC",
                                color: "#94A3B8",
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
                    <tr style={{ borderTop: "1px dashed #E2E8F0" }}>
                      <td colSpan={6} style={{ padding: "8px 16px" }}>
                        <button
                          onClick={addEditItem}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "none",
                            border: "1.5px dashed #CBD5E1",
                            borderRadius: 7,
                            padding: "6px 14px",
                            cursor: "pointer",
                            color: "#64748B",
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

                {/* Footer: totals + actions */}
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderTop: "1px solid #E5E7EB",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#64748B", flex: 1 }}>
                    {editValidItemCount > 0 ? (
                      `${editValidItemCount} line item${editValidItemCount > 1 ? "s" : ""} · ${editTotalQty} units`
                    ) : (
                      <span style={{ color: "#EF4444" }}>No valid items</span>
                    )}
                  </div>
                  <button
                    onClick={closeEditDispatch}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 9,
                      border: "1.5px solid #E2E8F0",
                      background: "#fff",
                      color: "#374151",
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
                      background: canSaveEdit ? "#2563EB" : "#CBD5E1",
                      color: canSaveEdit ? "#fff" : "#94A3B8",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: canSaveEdit ? "pointer" : "not-allowed",
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
      <div
        style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}
      >
        {[
          {
            l: "Total Invoices",
            v: dispatches.length,
            bg: "#EFF6FF",
            col: "#1D4ED8",
            icon: "🧾",
          },
          {
            l: "Customers Served",
            v: new Set(dispatches.map((d) => d.customerName)).size,
            bg: "#ECFDF5",
            col: "#065F46",
            icon: "👥",
          },
          {
            l: "Items Dispatched",
            v: dispatches.reduce((s, d) => s + normD(d).items.length, 0),
            bg: "#F3E8FF",
            col: "#6D28D9",
            icon: "📦",
          },
          {
            l: "Today",
            v: dispatches.filter((d) => d.date === todayStr()).length,
            bg: "#FEF3C7",
            col: "#92400E",
            icon: "📅",
          },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: s.bg,
              borderRadius: 12,
              padding: "12px 16px",
              flex: "1 1 80px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: s.col }}>
              {s.v}
            </div>
            <div
              style={{
                fontSize: 10,
                color: s.col + "99",
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
          background: "#fff",
          border: "1.5px solid #CBD5E1",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,.08)",
          marginBottom: 20,
        }}
      >
        {/* Invoice header band */}
        <div
          style={{
            background: "#0F172A",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                color: "#F8FAFC",
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: "-.3px",
              }}
            >
              ⚗ DISPATCH INVOICE
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>
              Chemical Stock Outward Entry
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color: "#475569",
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
                color: "#F1F5F9",
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: ".05em",
                background: "rgba(255,255,255,.07)",
                padding: "5px 12px",
                borderRadius: 7,
                border: "1px solid rgba(255,255,255,.1)",
                display: "inline-block",
              }}
            >
              {invoiceNo}
            </div>
          </div>
        </div>

        {/* FROM | TO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <div
            style={{ padding: "16px 24px", borderRight: "1px solid #E5E7EB" }}
          >
            <div style={labelStyle}>From</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#0F172A",
                marginBottom: 8,
              }}
            >
              {companyName}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 5 }}>
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
                ...S.input(),
                fontSize: 12,
                padding: "7px 10px",
                appearance: "auto",
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
                ...S.input(dispatchForm.customerName ? "#2563EB" : undefined),
                fontSize: 13,
                fontWeight: 600,
              }}
              placeholder="Customer / Party Name"
            />
            {!dispatchForm.customerName && (
              <div
                style={{
                  fontSize: 10,
                  color: "#EF4444",
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                * Required to issue invoice
              </div>
            )}
          </div>
        </div>

        {/* Date | Note */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "2px solid #E5E7EB",
          }}
        >
          <div
            style={{ padding: "12px 24px", borderRight: "1px solid #E5E7EB" }}
          >
            <div style={labelStyle}>Invoice Date</div>
            <input
              type="date"
              value={dispatchForm.date}
              onChange={(e) =>
                setDispatchForm((p) => ({ ...p, date: e.target.value }))
              }
              style={{ ...S.input(), fontSize: 12, padding: "7px 10px" }}
            />
          </div>
          <div style={{ padding: "12px 24px" }}>
            <div style={labelStyle}>Reference / Note</div>
            <input
              value={dispatchForm.note}
              onChange={(e) =>
                setDispatchForm((p) => ({ ...p, note: e.target.value }))
              }
              style={{ ...S.input(), fontSize: 12, padding: "7px 10px" }}
              placeholder="Order no., PO ref., batch…"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                  background: "#F8FAFC",
                  borderBottom: "2px solid #E2E8F0",
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
              const sc = item.overLimit
                ? "#DC2626"
                : item.willBeZero
                  ? "#DC2626"
                  : item.willBeLow
                    ? "#D97706"
                    : "#059669";
              const stIcon = item.overLimit
                ? "✕ OVER"
                : item.willBeZero
                  ? "🚫 OUT"
                  : item.willBeLow
                    ? "⚠ LOW"
                    : "✓ OK";
              return (
                <tr
                  key={item._id}
                  style={{
                    background: rowErr
                      ? "#FFF5F5"
                      : idx % 2
                        ? "#FAFAFA"
                        : "#fff",
                    borderBottom: "1px solid #F1F5F9",
                  }}
                >
                  <td
                    style={TD({
                      textAlign: "center",
                      color: "#94A3B8",
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
                        ...S.input(
                          rowErr
                            ? "#EF4444"
                            : item.productId
                              ? "#2563EB"
                              : undefined,
                        ),
                        fontSize: 12,
                        padding: "7px 9px",
                        appearance: "auto",
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
                            style={{
                              color:
                                p.qty === 0
                                  ? "#DC2626"
                                  : isDisabledDup
                                    ? "#94A3B8"
                                    : "inherit",
                            }}
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
                          color: "#DC2626",
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
                              ? "#DC2626"
                              : avail <= item.product.minQty
                                ? "#D97706"
                                : "#0F172A",
                          fontSize: 13,
                        }}
                      >
                        {avail}
                        <span
                          style={{
                            fontSize: 10,
                            color: "#94A3B8",
                            marginLeft: 3,
                          }}
                        >
                          {item.product.unit}
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: "#CBD5E1" }}>—</span>
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
                        ...S.input(
                          item.overLimit
                            ? "#EF4444"
                            : item.qty && item.product && !item.overLimit
                              ? "#059669"
                              : undefined,
                        ),
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: "center",
                        padding: "7px 10px",
                      }}
                      placeholder="0"
                      disabled={!item.productId}
                    />
                    {item.overLimit && (
                      <div
                        style={{
                          fontSize: 9,
                          color: "#DC2626",
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
                          style={{ fontWeight: 800, fontSize: 13, color: sc }}
                        >
                          {item.overLimit ? "—" : item.remaining}
                          <span
                            style={{
                              fontSize: 10,
                              color: "#94A3B8",
                              marginLeft: 2,
                            }}
                          >
                            {item.product.unit}
                          </span>
                        </span>
                        <div style={{ marginTop: 3 }}>
                          <span
                            style={{
                              background: item.overLimit
                                ? "#FEE2E2"
                                : item.willBeZero
                                  ? "#FEE2E2"
                                  : item.willBeLow
                                    ? "#FEF3C7"
                                    : "#D1FAE5",
                              color: sc,
                              padding: "1px 6px",
                              borderRadius: 5,
                              fontSize: 9,
                              fontWeight: 800,
                            }}
                          >
                            {stIcon}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={TD({ textAlign: "center", width: 36 })}>
                    <button
                      onClick={() => removeDispatchItem(item._id)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: "1px solid #E2E8F0",
                        background: "#F8FAFC",
                        color: "#94A3B8",
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
            {/* Add line item */}
            <tr style={{ borderTop: "1px dashed #E2E8F0" }}>
              <td colSpan={6} style={{ padding: "8px 16px" }}>
                <button
                  onClick={addDispatchItem}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "1.5px dashed #CBD5E1",
                    borderRadius: 7,
                    padding: "6px 14px",
                    cursor: "pointer",
                    color: "#64748B",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  ＋ Add Line Item
                </button>
              </td>
            </tr>
            {/* Totals + dispatch button */}
            <tr
              style={{ background: "#0F172A", borderTop: "2px solid #E2E8F0" }}
            >
              <td colSpan={2} style={{ padding: "14px 20px" }}>
                <span style={{ color: "#475569", fontSize: 11 }}>
                  {validItemCount > 0 ? (
                    `${validItemCount} line item${validItemCount > 1 ? "s" : ""} · ready to issue`
                  ) : (
                    <span style={{ color: "#334155" }}>No valid items</span>
                  )}
                </span>
              </td>
              <td style={{ padding: "14px 12px", textAlign: "center" }}>
                <span
                  style={{
                    color: "#64748B",
                    fontSize: 10,
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  Total
                </span>
                <span
                  style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 900 }}
                >
                  {totalDispatchQty}
                </span>
                <span style={{ color: "#475569", fontSize: 10, marginLeft: 3 }}>
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
                    background: canDispatch ? "#2563EB" : "#1E293B",
                    color: canDispatch ? "#fff" : "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: canDispatch ? "pointer" : "not-allowed",
                    transition: "all .2s",
                    letterSpacing: "-.2px",
                  }}
                >
                  📤 Issue & Dispatch
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ════════════ INVOICE LEDGER (History) ════════════ */}
      <div style={S.card}>
        {/* Ledger toolbar */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
              🧾 Invoice Ledger
            </div>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>
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
                color: "#94A3B8",
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
              style={{
                ...S.input(),
                paddingLeft: 30,
                fontSize: 11,
                width: 210,
              }}
            />
          </div>
          <select
            value={dispatchLocFilter}
            onChange={(e) => setDispatchLocFilter(e.target.value)}
            style={{
              ...S.input(),
              width: "auto",
              fontSize: 11,
              padding: "8px 10px",
              appearance: "auto",
              minWidth: 130,
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
            onClick={exportDispatchPDF}
            style={S.smBtn("#0F172A", "#fff", "none")}
          >
            📄 PDF
          </button>
          <button
            onClick={exportDispatchExcel}
            style={S.smBtn("#065f46", "#6ee7b7", "none")}
          >
            ↓ Excel
          </button>
        </div>

        {/* Ledger table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              minWidth: 700,
            }}
          >
            <thead>
              <tr style={{ background: "#0F172A" }}>
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
                      color: "#64748B",
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
                      color: "#94A3B8",
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
                        borderTop: "1px solid #F1F5F9",
                        cursor: "pointer",
                        background: isExpanded
                          ? "#F0F9FF"
                          : idx % 2
                            ? "#FAFAFA"
                            : "#fff",
                        transition: "background .1s",
                      }}
                      onMouseEnter={(e) =>
                        !isExpanded &&
                        (e.currentTarget.style.background = "#F8FAFC")
                      }
                      onMouseLeave={(e) =>
                        !isExpanded &&
                        (e.currentTarget.style.background =
                          idx % 2 ? "#FAFAFA" : "#fff")
                      }
                      onClick={() =>
                        setExpandedDispatchId(isExpanded ? null : d.id)
                      }
                    >
                      {/* Invoice number */}
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <span
                          style={{
                            background: "#0F172A",
                            color: "#F1F5F9",
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
                          color: "#374151",
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div>{d.date}</div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#94A3B8",
                            marginTop: 1,
                          }}
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
                        <div style={{ fontWeight: 700, color: "#0F172A" }}>
                          {d.customerName}
                        </div>
                        {d.note && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#94A3B8",
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
                              color: "#7C3AED",
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
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            padding: "3px 9px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {nd.items.length} item{nd.items.length > 1 ? "s" : ""}
                        </span>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#94A3B8",
                            marginTop: 3,
                          }}
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
                            color: "#DC2626",
                          }}
                        >
                          −{totalQty}
                        </span>
                        <div style={{ fontSize: 9, color: "#94A3B8" }}>
                          units
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <span
                          style={{
                            background: "#F1F5F9",
                            color: "#374151",
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
                              border: "1.5px solid #BFDBFE",
                              background: "#EFF6FF",
                              color: "#1D4ED8",
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
                              border: "1.5px solid #DDD6FE",
                              background: "#F5F3FF",
                              color: "#6D28D9",
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
                              border: "1.5px solid #FECACA",
                              background: "#FEF2F2",
                              color: "#DC2626",
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
                    {/* Expanded line items */}
                    {isExpanded && (
                      <tr key={`${d.id}-exp`} style={{ borderTop: "none" }}>
                        <td
                          colSpan={7}
                          style={{
                            padding: "0 14px 10px 14px",
                            background: "#F0F9FF",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "1px solid #BFDBFE",
                            }}
                          >
                            <thead>
                              <tr style={{ background: "#1E40AF" }}>
                                <th
                                  style={{
                                    padding: "7px 12px",
                                    fontSize: 9,
                                    color: "#BFDBFE",
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
                                    color: "#BFDBFE",
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
                                    color: "#BFDBFE",
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
                                    background: ii % 2 ? "#EFF6FF" : "#fff",
                                    borderBottom: "1px solid #DBEAFE",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "8px 12px",
                                      textAlign: "center",
                                      color: "#94A3B8",
                                      fontSize: 11,
                                    }}
                                  >
                                    {ii + 1}
                                  </td>
                                  <td style={{ padding: "8px 12px" }}>
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        color: "#0F172A",
                                        fontSize: 12,
                                      }}
                                    >
                                      {item.productName}
                                    </span>
                                    {item.shade && (
                                      <span
                                        style={{
                                          background: "#F3E8FF",
                                          color: "#6D28D9",
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
                                        color: "#DC2626",
                                      }}
                                    >
                                      {item.qtyDispatched}
                                    </span>
                                    <span
                                      style={{
                                        color: "#94A3B8",
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

        {/* Ledger footer */}
        {filteredDispatches.length > 0 && (
          <div
            style={{
              padding: "10px 18px",
              background: "#F8FAFC",
              borderTop: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11, color: "#64748B" }}>
              {filteredDispatches.length} invoice
              {filteredDispatches.length > 1 ? "s" : ""} ·{" "}
              {filteredDispatches.reduce(
                (s, d) => s + normD(d).items.length,
                0,
              )}{" "}
              line items
            </span>
            <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
              <span style={{ color: "#DC2626", fontWeight: 700 }}>
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
              <span style={{ color: "#64748B" }}>
                Customers:{" "}
                <strong style={{ color: "#0F172A" }}>
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
