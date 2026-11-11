import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  API_BASE,
  DISPATCH_API_BASE,
  apiHeaders,
  getToken,
  getUserIdFromToken,
  genId,
  nowStr,
  todayStr,
  normD,
} from "../shared";

/* ══════════════════════════════════════════════════════════════════════════
   Stock workspace store – shared by the Stock Manager and Dispatch pages.
   • Locations are user defined (add / rename / delete). New users start empty.
   • Data is cached in localStorage and synced to the backend (debounced PUT).
   • Dispatch create / edit / void use the dedicated dispatch API and fall
     back to local-only changes when the server is unreachable.
   ══════════════════════════════════════════════════════════════════════════ */

export const UNITS = ["kg", "g", "L", "ml", "pcs", "box", "drum", "bag"];
export const LOC_ICONS = ["🏭", "🏙", "🏬", "🏢", "🧪", "🎨", "📦", "🚚", "🛢", "⚗"];
export const DEFAULT_CATEGORIES = [
  "ECOFAST",
  "ECOSOL",
  "ECOPLUS",
  "SAFEAUX",
  "DENIMOZ",
  "SULFAID",
  "OTHER",
];

const EMPTY = {
  locations: [],
  stocks: {},
  changeLog: [],
  lastUpdated: {},
  companyName: "My Chemical Store",
  dispatches: [],
};

/* ── product helpers ───────────────────────────────────────────────────── */
export const computePkgQty = (size, count) => {
  const s = parseInt(size, 10);
  const c = parseInt(count, 10);
  return s > 0 && c >= 0 && Number.isFinite(c) ? s * c : null;
};
export const isPkgTracked = (p) =>
  !!p && computePkgQty(p.packageSize, p.packageCount) !== null;

export const productStatus = (p) =>
  (p.qty || 0) <= 0 ? "out" : (p.qty || 0) <= (p.minQty || 0) ? "low" : "ok";

export const daysToExpiry = (p) => {
  if (!p?.expiry) return null;
  const t = new Date(`${p.expiry}T00:00:00`).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / 86400000);
};

export const suggestedOrder = (p) =>
  Math.max(0, Math.max((p.minQty || 0) * 2 - (p.qty || 0), (p.minQty || 0) - (p.qty || 0) + 1));

export const fmtQty = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const locSlug = (name, taken) => {
  const base =
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "loc";
  let id = base;
  let i = 2;
  while (taken.has(id)) id = `${base}-${i++}`;
  return id;
};

/* ── persistence ───────────────────────────────────────────────────────── */
const lsKey = (v = 2) => `chem_stock_app_v${v}_${getUserIdFromToken() || "anon"}`;
const lsLoad = () => {
  for (const v of [2, 1]) {
    try {
      const raw = localStorage.getItem(lsKey(v));
      if (!raw) continue;
      const d = JSON.parse(raw);
      if (d?.stocks) return d;
    } catch {
      /* ignore corrupt cache */
    }
  }
  return null;
};
const lsSave = (d) => {
  try {
    localStorage.setItem(lsKey(2), JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
};
const lsClear = () => {
  try {
    localStorage.removeItem(lsKey(2));
    localStorage.removeItem(lsKey(1));
  } catch {
    /* ignore */
  }
};

const LEGACY_LOCS = {
  sample: ["Sample", "🧪"],
  delhi: ["Delhi", "🏙"],
  faridabad: ["Faridabad", "🏭"],
  shadecard: ["Shade Card", "🎨"],
};

/** Accepts server / cache / backup data (old fixed-tab format too). */
export const normalizeWorkspace = (d = {}) => {
  const stocks = { ...(d.stocks || {}) };
  let locations = Array.isArray(d.locations)
    ? d.locations.filter((l) => l?.id && l?.name)
    : [];
  if (!locations.length) {
    // Legacy workspace: keep only locations that actually hold products.
    locations = Object.keys(stocks)
      .filter((k) => Array.isArray(stocks[k]) && stocks[k].length)
      .map((k) => ({
        id: k,
        name:
          LEGACY_LOCS[k]?.[0] ||
          k.charAt(0).toUpperCase() + k.slice(1),
        icon: LEGACY_LOCS[k]?.[1] || "📦",
      }));
  }
  const clean = {};
  locations.forEach((l) => {
    clean[l.id] = Array.isArray(stocks[l.id]) ? stocks[l.id] : [];
  });
  return {
    locations,
    stocks: clean,
    changeLog: Array.isArray(d.changeLog) ? d.changeLog : [],
    lastUpdated: d.lastUpdated || {},
    companyName: d.companyName || EMPTY.companyName,
    dispatches: Array.isArray(d.dispatches) ? d.dispatches : [],
  };
};

const fetchWorkspace = async (local = lsLoad()) => {
  if (!getToken()) return { authError: true };
  try {
    const res = await fetch(API_BASE, { headers: apiHeaders() });
    if (res.status === 401) return { authError: true };
    if (!res.ok)
      return local ? { data: local, offline: true } : { loadFailed: true };
    const remote = await res.json();
    if (!remote?.stocks)
      return local ? { data: local, offline: true } : { loadFailed: true };
    if (local?.savedAt && remote.updatedAt && local.savedAt > new Date(remote.updatedAt).getTime())
      return { data: local };
    return { data: remote };
  } catch {
    return local ? { data: local, offline: true } : { loadFailed: true };
  }
};

/* ── context ───────────────────────────────────────────────────────────── */
const Ctx = createContext(null);
export const useStock = () => useContext(Ctx);

export function StockProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  // false while a cached copy is shown and the server copy is still being checked
  const [synced, setSynced] = useState(false);
  const base = useRef(null); // the data object the page was last hydrated with
  const edited = useRef(false); // user changed something before the server answered
  const [syncState, setSyncState] = useState("idle");
  const [toasts, setToasts] = useState([]);
  const dirty = useRef(false);
  const latest = useRef(data);
  latest.current = data;

  const toast = useCallback((msg, type = "success") => {
    const id = genId();
    setToasts((t) => [...t.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  /* initial load – cache first: if this browser already has the workspace the
     page opens instantly from it, and the server copy is checked in the
     background (a slow / cold backend no longer blocks the screen). */
  const load = useCallback(async () => {
    const cached = getToken() ? lsLoad() : null;
    edited.current = false;
    setSynced(false);
    if (cached) {
      const first = normalizeWorkspace(cached);
      base.current = first;
      setData(first);
      setStatus("ready");
    } else {
      setStatus("loading");
    }
    const r = await fetchWorkspace(cached);
    if (r.authError) {
      window.location.href = "/login";
      return;
    }
    if (r.loadFailed) {
      setStatus("error");
      return;
    }
    // r.data is the cached object itself when the local copy is the newer one
    if (!cached || (r.data !== cached && !edited.current)) {
      const next = normalizeWorkspace(r.data);
      base.current = next;
      setData(next);
    }
    setStatus("ready");
    setSynced(true);
    if (r.offline) toast("Offline — working from local data", "error");
  }, [toast]);
  useEffect(() => {
    load();
  }, [load]);

  /* debounced save: localStorage immediately, backend after 800ms */
  const pushRemote = useCallback(async (payload, keepalive = false) => {
    try {
      const res = await fetch(API_BASE, {
        method: "PUT",
        headers: apiHeaders(),
        body: JSON.stringify(payload),
        keepalive,
      });
      if (res.status === 401) return setSyncState("auth-error");
      dirty.current = !res.ok;
      setSyncState(res.ok ? "synced" : "remote-error");
    } catch {
      setSyncState("remote-error");
    }
  }, []);
  useEffect(() => {
    if (status !== "ready") return;
    if (data !== base.current) edited.current = true;
    if (!synced) {
      // server copy not checked yet: keep local edits safe, but don't push
      if (edited.current) lsSave({ ...data, savedAt: Date.now() });
      return undefined;
    }
    const payload = { ...data, savedAt: Date.now() };
    dirty.current = true;
    setSyncState(lsSave(payload) ? "saving" : "error");
    const t = setTimeout(() => pushRemote(payload), 800);
    return () => clearTimeout(t);
  }, [data, status, synced, pushRemote]);
  // flush pending changes when the tab is closed / reloaded
  useEffect(() => {
    const flush = () => {
      if (dirty.current && status === "ready")
        pushRemote({ ...latest.current, savedAt: Date.now() }, true);
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [status, pushRemote]);
  // flush on leave (route change away from the stock module)
  useEffect(
    () => () => {
      if (dirty.current && status === "ready")
        pushRemote({ ...latest.current, savedAt: Date.now() }, true);
    },
    [],
  );

  /* ── log helper (pure) ── */
  const withLog = (d, action, loc, details) => ({
    ...d,
    changeLog: [{ id: genId(), action, tab: loc, details, time: nowStr() }, ...d.changeLog].slice(0, 200),
    lastUpdated: { ...d.lastUpdated, [loc]: nowStr() },
  });

  const locName = useCallback(
    (id, fallback) =>
      data.locations.find((l) => l.id === id)?.name ||
      fallback ||
      (id ? id.charAt(0).toUpperCase() + id.slice(1) : "Unknown"),
    [data.locations],
  );

  /* ── locations ── */
  const addLocation = useCallback(({ name, icon }) => {
    const nm = name.trim();
    if (!nm) return null;
    const id = locSlug(nm, new Set(latest.current.locations.map((l) => l.id)));
    setData((d) =>
      withLog(
        {
          ...d,
          locations: [...d.locations, { id, name: nm, icon: icon || "📦" }],
          stocks: { ...d.stocks, [id]: [] },
        },
        "LOCATION",
        id,
        `Location "${nm}" created`,
      ),
    );
    return id;
  }, []);
  const updateLocation = useCallback((id, { name, icon }) => {
    setData((d) =>
      withLog(
        {
          ...d,
          locations: d.locations.map((l) =>
            l.id === id ? { ...l, name: name.trim() || l.name, icon: icon || l.icon } : l,
          ),
        },
        "LOCATION",
        id,
        `Location renamed to "${name.trim()}"`,
      ),
    );
  }, []);
  const deleteLocation = useCallback((id) => {
    setData((d) => {
      const name = d.locations.find((l) => l.id === id)?.name || id;
      const stocks = { ...d.stocks };
      delete stocks[id];
      const lastUpdated = { ...d.lastUpdated };
      delete lastUpdated[id];
      const next = {
        ...d,
        locations: d.locations.filter((l) => l.id !== id),
        stocks,
        lastUpdated,
      };
      return {
        ...next,
        changeLog: [
          { id: genId(), action: "LOCATION", tab: id, details: `Location "${name}" deleted`, time: nowStr() },
          ...d.changeLog,
        ].slice(0, 200),
      };
    });
  }, []);

  /* ── products ── */
  const prepProduct = (raw) => {
    const size = raw.packageSize !== "" && raw.packageSize != null ? parseInt(raw.packageSize, 10) || "" : "";
    const count = raw.packageCount !== "" && raw.packageCount != null ? parseInt(raw.packageCount, 10) || 0 : "";
    const pkgQty = computePkgQty(size, count);
    return {
      ...raw,
      name: raw.name.trim(),
      qty: pkgQty !== null ? pkgQty : Number(raw.qty) || 0,
      minQty: Number(raw.minQty) || 0,
      category: (raw.category || "OTHER").trim().toUpperCase(),
      packageSize: size,
      packageCount: count,
    };
  };
  const addProduct = useCallback((loc, raw) => {
    const p = { ...prepProduct(raw), id: genId() };
    setData((d) =>
      withLog(
        { ...d, stocks: { ...d.stocks, [loc]: [...(d.stocks[loc] || []), p] } },
        "ADD",
        loc,
        `"${p.name}" added (QT: ${p.qty} ${p.unit})`,
      ),
    );
    return p;
  }, []);
  const updateProduct = useCallback((loc, id, raw) => {
    const u = { ...prepProduct(raw), id };
    setData((d) => {
      const prev = (d.stocks[loc] || []).find((p) => p.id === id);
      const ch = [];
      if (prev && prev.qty !== u.qty) ch.push(`QT: ${prev.qty}→${u.qty}`);
      if (prev && prev.name !== u.name) ch.push("name changed");
      return withLog(
        { ...d, stocks: { ...d.stocks, [loc]: d.stocks[loc].map((p) => (p.id === id ? u : p)) } },
        "EDIT",
        loc,
        `"${u.name}" ${ch.join(", ") || "updated"}`,
      );
    });
  }, []);
  const deleteProduct = useCallback((loc, id) => {
    setData((d) => {
      const p = (d.stocks[loc] || []).find((x) => x.id === id);
      return withLog(
        { ...d, stocks: { ...d.stocks, [loc]: d.stocks[loc].filter((x) => x.id !== id) } },
        "DELETE",
        loc,
        `"${p?.name}" deleted`,
      );
    });
  }, []);
  const setQty = useCallback((loc, id, value) => {
    setData((d) => {
      const p = (d.stocks[loc] || []).find((x) => x.id === id);
      if (!p) return d;
      const qty = Math.max(0, Number(value) || 0);
      if (qty === p.qty) return d;
      const next = isPkgTracked(p)
        ? { ...p, qty: Math.round(qty / p.packageSize) * p.packageSize, packageCount: Math.round(qty / p.packageSize) }
        : { ...p, qty };
      return withLog(
        { ...d, stocks: { ...d.stocks, [loc]: d.stocks[loc].map((x) => (x.id === id ? next : x)) } },
        "QTY",
        loc,
        `"${p.name}" QT: ${p.qty} → ${next.qty}`,
      );
    });
  }, []);
  const nudgeQty = useCallback((loc, id, delta) => {
    setData((d) => {
      const p = (d.stocks[loc] || []).find((x) => x.id === id);
      if (!p) return d;
      let next;
      if (isPkgTracked(p)) {
        const count = Math.max(0, (parseInt(p.packageCount, 10) || 0) + delta);
        next = { ...p, packageCount: count, qty: count * p.packageSize };
      } else next = { ...p, qty: Math.max(0, p.qty + delta) };
      if (next.qty === p.qty) return d;
      return withLog(
        { ...d, stocks: { ...d.stocks, [loc]: d.stocks[loc].map((x) => (x.id === id ? next : x)) } },
        "QTY",
        loc,
        `"${p.name}" QT: ${p.qty} → ${next.qty}`,
      );
    });
  }, []);
  const importProducts = useCallback((loc, list) => {
    const items = list.map((r) => ({ ...prepProduct(r), id: genId() + Math.floor(Math.random() * 1000) }));
    setData((d) =>
      withLog(
        { ...d, stocks: { ...d.stocks, [loc]: [...(d.stocks[loc] || []), ...items] } },
        "IMPORT",
        loc,
        `${items.length} products imported`,
      ),
    );
    return items.length;
  }, []);
  /** Move quantity of a product from one location to another. */
  const transferStock = useCallback(
    ({ from, to, productId, qty }) => {
      const cur = latest.current;
      const src = (cur.stocks[from] || []).find((p) => p.id === productId);
      const n = Number(qty);
      if (!src || from === to) return { ok: false, message: "Choose a product and two different locations" };
      if (!(n > 0)) return { ok: false, message: "Enter a quantity greater than 0" };
      if (n > src.qty) return { ok: false, message: `Only ${fmtQty(src.qty)} ${src.unit} available` };
      setData((d) => {
        const dest = d.stocks[to] || [];
        const match = dest.find(
          (p) => p.name.trim().toLowerCase() === src.name.trim().toLowerCase() && p.unit === src.unit,
        );
        const dec = (p) => {
          const q = p.qty - n;
          return isPkgTracked(p) ? { ...p, qty: q, packageCount: Math.floor(q / p.packageSize) } : { ...p, qty: q };
        };
        const stocks = {
          ...d.stocks,
          [from]: d.stocks[from].map((p) => (p.id === productId ? dec(p) : p)),
          [to]: match
            ? dest.map((p) => (p.id === match.id ? { ...p, qty: p.qty + n } : p))
            : [...dest, { ...src, id: genId(), qty: n, packageSize: "", packageCount: "", minQty: 0 }],
        };
        const details = `${fmtQty(n)} ${src.unit} of "${src.name}" moved ${locName(from)} → ${locName(to)}`;
        return withLog(withLog({ ...d, stocks }, "TRANSFER", from, details), "TRANSFER", to, details);
      });
      return { ok: true };
    },
    [locName],
  );

  /* ── dispatch API (server first, local fallback) ── */
  const applyServer = (s) =>
    setData((d) => ({
      ...d,
      stocks: { ...d.stocks, ...(s.stocks || {}) },
      dispatches: s.dispatches || d.dispatches,
      changeLog: s.changeLog || d.changeLog,
      lastUpdated: s.lastUpdated || d.lastUpdated,
    }));

  const buildItems = (loc, lines) =>
    lines.map((l) => {
      const p = (latest.current.stocks[loc] || []).find((x) => String(x.id) === String(l.productId));
      return { productId: l.productId, shade: (l.shade || "").trim(), qty: l.qty, product: p };
    });

  const createDispatch = useCallback(
    async ({ invoiceNo, customerName, location, date, note, lines }) => {
      let res = null;
      try {
        res = await fetch(DISPATCH_API_BASE, {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify({
            invoiceNo,
            customerName: customerName.trim(),
            location,
            date,
            note: (note || "").trim(),
            items: lines.map((l) => ({ productId: l.productId, shade: (l.shade || "").trim(), qty: l.qty })),
          }),
        });
      } catch {
        res = null;
      }
      if (res) {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, message: body.message || "Dispatch failed" };
        applyServer(body);
        return { ok: true, id: body.dispatch?.id, offline: false };
      }
      // offline fallback
      const items = buildItems(location, lines);
      const dItems = items.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        shade: i.shade,
        qtyDispatched: i.qty,
        unit: i.product.unit,
        prevQty: i.product.qty,
        newQty: i.product.qty - i.qty,
      }));
      const entry = {
        id: genId(),
        invoiceNo,
        customerName: customerName.trim(),
        location,
        locationName: locName(location),
        items: dItems,
        note: (note || "").trim(),
        date,
        time: nowStr(),
        totalQty: dItems.reduce((s, i) => s + i.qtyDispatched, 0),
      };
      setData((d) => {
        const map = {};
        lines.forEach((l) => (map[String(l.productId)] = l.qty));
        return withLog(
          {
            ...d,
            stocks: {
              ...d.stocks,
              [location]: d.stocks[location].map((p) => (map[String(p.id)] ? { ...p, qty: p.qty - map[String(p.id)] } : p)),
            },
            dispatches: [entry, ...d.dispatches],
          },
          "DISPATCH",
          location,
          `${invoiceNo} — ${dItems.length} chemicals → ${entry.customerName}`,
        );
      });
      return { ok: true, id: entry.id, offline: true };
    },
    [locName],
  );

  const updateDispatch = useCallback(
    async (d0, { customerName, date, note, lines }) => {
      let res = null;
      try {
        res = await fetch(`${DISPATCH_API_BASE}/${d0.id}`, {
          method: "PUT",
          headers: apiHeaders(),
          body: JSON.stringify({
            customerName: customerName.trim(),
            date,
            note: (note || "").trim(),
            items: lines.map((l) => ({ productId: l.productId, shade: (l.shade || "").trim(), qty: l.qty })),
          }),
        });
      } catch {
        res = null;
      }
      if (res) {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, message: body.message || "Update failed" };
        applyServer(body);
        return { ok: true };
      }
      const orig = normD(d0).items;
      setData((d) => {
        const loc = d0.location;
        const restored = (d.stocks[loc] || []).map((p) => {
          const o = orig.find((i) => String(i.productId) === String(p.id));
          return o ? { ...p, qty: p.qty + o.qtyDispatched } : p;
        });
        const fin = restored.map((p) => {
          const l = lines.find((x) => String(x.productId) === String(p.id));
          return l ? { ...p, qty: p.qty - l.qty } : p;
        });
        const items = lines.map((l) => {
          const p = restored.find((x) => String(x.id) === String(l.productId));
          return {
            productId: l.productId,
            productName: p.name,
            shade: (l.shade || "").trim(),
            qtyDispatched: l.qty,
            unit: p.unit,
            prevQty: p.qty,
            newQty: p.qty - l.qty,
          };
        });
        return withLog(
          {
            ...d,
            stocks: { ...d.stocks, [loc]: fin },
            dispatches: d.dispatches.map((x) =>
              x.id === d0.id
                ? {
                    ...x,
                    customerName: customerName.trim(),
                    date,
                    note: (note || "").trim(),
                    items,
                    totalQty: items.reduce((s, i) => s + i.qtyDispatched, 0),
                    edited: true,
                    editedAt: nowStr(),
                  }
                : x,
            ),
          },
          "EDIT_DISPATCH",
          loc,
          `${d0.invoiceNo || d0.id} updated`,
        );
      });
      return { ok: true, offline: true };
    },
    [],
  );

  const voidDispatch = useCallback(async (d0) => {
    let res = null;
    try {
      res = await fetch(`${DISPATCH_API_BASE}/${d0.id}/undo`, { method: "POST", headers: apiHeaders() });
    } catch {
      res = null;
    }
    if (res) {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, message: body.message || "Void failed" };
      applyServer(body);
      return { ok: true };
    }
    const items = normD(d0).items;
    setData((d) => {
      const add = {};
      items.forEach((i) => (add[String(i.productId)] = (add[String(i.productId)] || 0) + i.qtyDispatched));
      const list = d.stocks[d0.location];
      return withLog(
        {
          ...d,
          stocks: list
            ? { ...d.stocks, [d0.location]: list.map((p) => (add[String(p.id)] ? { ...p, qty: p.qty + add[String(p.id)] } : p)) }
            : d.stocks,
          dispatches: d.dispatches.filter((x) => x.id !== d0.id),
        },
        "UNDO_DISPATCH",
        d0.location,
        `Voided ${d0.invoiceNo || d0.id}: ${d0.customerName}`,
      );
    });
    return { ok: true, offline: true };
  }, []);

  /* ── company, backup, clear ── */
  const setCompanyName = useCallback((name) => setData((d) => ({ ...d, companyName: name })), []);
  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(latest.current, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chemical_stock_backup_${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);
  const restoreBackup = useCallback((json) => {
    if (!json?.stocks) return false;
    setData(normalizeWorkspace(json));
    return true;
  }, []);
  const clearAll = useCallback(async () => {
    lsClear();
    try {
      await fetch(API_BASE, { method: "DELETE", headers: apiHeaders() });
    } catch {
      /* ignore */
    }
    setData(EMPTY);
  }, []);

  /* ── derived ── */
  const derived = useMemo(() => {
    const all = data.locations.flatMap((l) =>
      (data.stocks[l.id] || []).map((p) => ({ ...p, _loc: l.id, _locName: l.name })),
    );
    const alerts = all.filter((p) => productStatus(p) !== "ok");
    const expiring = all.filter((p) => {
      const d = daysToExpiry(p);
      return d !== null && d <= 30;
    });
    return { all, alerts, expiring, alertCount: alerts.length + expiring.filter((p) => productStatus(p) === "ok").length };
  }, [data]);

  const value = {
    ...data,
    ...derived,
    status,
    syncState,
    toasts,
    toast,
    reload: load,
    locName,
    addLocation,
    updateLocation,
    deleteLocation,
    addProduct,
    updateProduct,
    deleteProduct,
    setQty,
    nudgeQty,
    importProducts,
    transferStock,
    createDispatch,
    updateDispatch,
    voidDispatch,
    setCompanyName,
    exportBackup,
    restoreBackup,
    clearAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
