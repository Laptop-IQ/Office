import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { genId, newItem, normD, todayStr } from "../shared";
import { fmtQty, productStatus, useStock } from "./store";
import { exportDispatchExcel, printInvoices } from "./reports";
import { Card, Empty, Field, Kpi, Page, Search } from "./ui";
import { Ico } from "./icons";

const genInvNo = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `DIS-${ymd}-${Math.floor(Math.random() * 9000) + 1000}`;
};
const invNo = (d) => d.invoiceNo || `DIS-${String(d.id).slice(-8).toUpperCase()}`;
const totalOf = (d) => normD(d).items.reduce((s, i) => s + (i.qtyDispatched || 0), 0);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };

const hue = (str) => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (n) => String(n).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const dayLabel = (iso) => {
  const t = todayStr();
  if (iso === t) return "Today";
  if (iso === daysAgo(1)) return "Yesterday";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};
const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const Avatar = ({ name, size }) => (
  <span className="sk-av" style={{ "--h": hue(name), ...(size ? { width: size, height: size } : {}) }} aria-hidden="true">{initials(name)}</span>
);

const NotFound = () => (
  <Page title="Invoice not found">
    <Empty icon="🔎" title="Invoice not found" text="It may have been voided, or the link is incorrect.">
      <Link to="/Dispatch" className="sk-btn pri"><Ico v="←" /> Back to ledger</Link>
    </Empty>
  </Page>
);

/* ═══════════════════════════ LEDGER ═══════════════════════════ */
export function DispatchHome() {
  const s = useStock();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("ALL");
  const [range, setRange] = useState("all");
  const [day, setDay] = useState("");
  const [sort, setSort] = useState("new");
  const nav = useNavigate();
  const searchRef = useRef(null);
  useEffect(() => {
    const h = (e) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = t && (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable);
      if (e.key === "/" && !typing) { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "n" && !typing) { e.preventDefault(); nav("/Dispatch/new"); }
      else if (e.key === "Escape" && t === searchRef.current) { setQ(""); t.blur(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [nav]);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const from = range === "today" ? todayStr() : range === "7" ? daysAgo(7) : range === "30" ? daysAgo(30) : "";
    const out = s.dispatches.filter((d) => {
      if (loc !== "ALL" && d.location !== loc) return false;
      if (day && d.date !== day) return false;
      if (!day && from && d.date < from) return false;
      if (!n) return true;
      return `${invNo(d)} ${d.customerName} ${normD(d).items.map((i) => `${i.productName} ${i.shade || ""}`).join(" ")}`.toLowerCase().includes(n);
    });
    const by = {
      new: (a, b) => (b.date || "").localeCompare(a.date || ""),
      old: (a, b) => (a.date || "").localeCompare(b.date || ""),
      qty: (a, b) => totalOf(b) - totalOf(a),
      name: (a, b) => a.customerName.localeCompare(b.customerName),
    }[sort];
    return [...out].sort(by);
  }, [s.dispatches, q, loc, range, day, sort]);

  // last 14 days activity (always based on all dispatches)
  const activity = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) days.push({ date: daysAgo(i), n: 0, qty: 0 });
    s.dispatches.forEach((d) => { const x = days.find((y) => y.date === d.date); if (x) { x.n += 1; x.qty += totalOf(d); } });
    return days;
  }, [s.dispatches]);
  const maxAct = Math.max(1, ...activity.map((x) => x.n));
  const chips = [
    q && ["q", `“${q}”`, () => setQ("")],
    loc !== "ALL" && ["loc", s.locName(loc), () => setLoc("ALL")],
    day && ["day", dayLabel(day), () => setDay("")],
    !day && range !== "all" && ["range", range === "today" ? "Today" : `${range} days`, () => setRange("all")],
  ].filter(Boolean);

  const groups = useMemo(() => {
    if (sort === "qty" || sort === "name")
      return [{ date: "flat", label: sort === "qty" ? "Largest quantity first" : "Customer A–Z", rows: list, qty: list.reduce((n, d) => n + totalOf(d), 0) }];
    const m = new Map();
    list.forEach((d) => {
      if (!m.has(d.date)) m.set(d.date, { date: d.date, label: dayLabel(d.date), rows: [], qty: 0 });
      const g = m.get(d.date);
      g.rows.push(d);
      g.qty += totalOf(d);
    });
    return [...m.values()];
  }, [list, sort]);

  const customers = useMemo(() => {
    const m = {};
    s.dispatches.forEach((d) => { const k = d.customerName; m[k] = m[k] || { name: k, n: 0, qty: 0 }; m[k].n += 1; m[k].qty += totalOf(d); });
    return Object.values(m).sort((a, b) => b.n - a.n || b.qty - a.qty);
  }, [s.dispatches]);
  const today = s.dispatches.filter((d) => d.date === todayStr()).length;
  const items = list.reduce((n, d) => n + normD(d).items.length, 0);

  if (!s.locations.length)
    return (
      <Page title="Dispatch" icon="📤" sub="Issue invoices and track outward stock">
        <Empty icon="🏭" title="Set up stock first" text="Dispatching needs a location with products. Create a location and add your products, then come back here."><Link to="/Stockmanager" className="sk-btn pri">Go to Stock Manager</Link></Empty>
      </Page>
    );

  return (
    <Page title="Dispatch ledger" sub="Every invoice issued from your stock"
      actions={<>
        <button className="sk-btn" disabled={!list.length} onClick={() => { exportDispatchExcel(list, s.locName, `dispatches_${Date.now()}.xlsx`); s.toast("Excel exported ✓"); }}><Ico v="⬇" /> Excel</button>
        <button className="sk-btn" disabled={!list.length} onClick={() => printInvoices({ list: list.slice(0, 100), company: s.companyName, locName: s.locName })}><Ico v="🖨" /> PDF</button>
        <Link to="/Dispatch/new" className="sk-btn pri"><Ico v="＋" /> New dispatch</Link></>}>
      <div className="sk-kpis">
        <Kpi label="Invoices" value={list.length} sub={range === "all" ? "all time" : "in selected range"} icon="🧾" />
        <Kpi label="Customers served" value={new Set(list.map((d) => d.customerName.toLowerCase())).size} color="var(--ov-safe)" icon="👥" />
        <Kpi label="Items dispatched" value={items} color="var(--ov-info)" icon="📦" />
        <Kpi label="Today" value={today} color="var(--ov-gold)" sub="invoices issued" icon="📅" />
      </div>

      {s.dispatches.length === 0 ? (
        <Empty icon="📤" title="No dispatches yet" text="Issue your first invoice — stock is deducted automatically and you can print it as PDF."><Link to="/Dispatch/new" className="sk-btn pri"><Ico v="＋" /> New dispatch</Link></Empty>
      ) : (
        <div className="sk-cols">
          <div>
            <div className="sk-tools">
              <div className="sk-search"><Search /><input ref={searchRef} className="sk-in" style={{ paddingRight: 44 }} placeholder="Search invoice, customer or product…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search dispatches" /><kbd className="sk-kbd">/</kbd></div>
              <select className="sk-in" style={{ width: "auto" }} value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Location"><option value="ALL">All locations</option>{s.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
              <div className="sk-chips" role="group" aria-label="Date range">
                {[["today", "Today"], ["7", "7 days"], ["30", "30 days"], ["all", "All"]].map(([k, l]) => <button key={k} className={`sk-chip ${range === k && !day ? "on" : ""}`} aria-pressed={range === k && !day} onClick={() => { setRange(k); setDay(""); }}>{l}</button>)}
              </div>
              <select className="sk-in" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort invoices">
                <option value="new">Newest first</option><option value="old">Oldest first</option><option value="qty">Largest quantity</option><option value="name">Customer A–Z</option>
              </select>
            </div>
            <Card className="sk-act" title="Last 14 days" icon="📈" right={<span className="sk-sub" style={{ margin: 0 }}>{day ? "Click the bar again to clear" : "Click a bar to filter that day"}</span>}>
              <div className="sk-bars" role="group" aria-label="Invoices per day">
                {activity.map((x) => (
                  <button key={x.date} className={`sk-bar-c${day === x.date ? " on" : ""}${x.date === todayStr() ? " today" : ""}`} onClick={() => setDay(day === x.date ? "" : x.date)} title={`${dayLabel(x.date)} · ${x.n} invoice${x.n === 1 ? "" : "s"} · ${fmtQty(x.qty)} qty`} aria-pressed={day === x.date}>
                    <i style={{ height: `${Math.max(x.n ? 12 : 4, (x.n / maxAct) * 100)}%` }} />
                    <span>{Number(x.date.slice(8))}</span>
                  </button>
                ))}
              </div>
            </Card>
            {chips.length > 0 && (
              <div className="sk-chips" style={{ margin: "14px 0 4px", alignItems: "center" }}>
                <span className="sk-sub" style={{ margin: "0 4px 0 0" }}><b style={{ color: "var(--ov-gold)" }}>{list.length}</b> of {s.dispatches.length} invoices</span>
                {chips.map(([k, l, off]) => <button key={k} className="sk-chip on" onClick={off}>{l} <Ico v="✕" /></button>)}
                <button className="sk-chip" onClick={() => { setQ(""); setLoc("ALL"); setDay(""); setRange("all"); }}>Clear all</button>
              </div>
            )}
            <div style={{ height: 14 }} />
            {list.length === 0 ? <Empty icon="🔎" title="No matching invoices" text="Try a different search or date range." /> : (
              <div className="sk-groups">
                {groups.map((g) => (
                  <section key={g.date} aria-label={g.label}>
                    <div className="sk-dg"><b>{g.label}</b><span>{g.rows.length} invoice{g.rows.length === 1 ? "" : "s"} · {fmtQty(g.qty)} qty</span></div>
                    <div className="sk-irs">
                      {g.rows.map((d) => {
                        const it = normD(d).items;
                        return (
                          <Link key={d.id} to={`/Dispatch/${d.id}`} className="sk-ir" aria-label={`Open invoice ${invNo(d)} for ${d.customerName}`}>
                            <Avatar name={d.customerName} />
                            <div className="sk-ir-main">
                              <div className="sk-ir-cust">{d.customerName}{d.edited && <span className="sk-tag">edited</span>}</div>
                              <div className="sk-ir-meta sk-mono">{invNo(d)}</div>
                            </div>
                            <div className="sk-ir-items">
                              {it.slice(0, 2).map((i, n) => <span key={n} className="sk-ichip" title={i.productName}>{i.productName}</span>)}
                              {it.length > 2 && <span className="sk-ichip more">+{it.length - 2}</span>}
                            </div>
                            <span className="sk-ir-loc">{s.locName(d.location, d.locationName)}</span>
                            <div className="sk-ir-qty"><b className="sk-mono">{fmtQty(totalOf(d))}</b><span>{it.length} item{it.length === 1 ? "" : "s"}</span></div>
                            <span className="sk-view">View <Arrow /></span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
          <aside className="sk-sticky">
            <Card title="Top customers" icon="🏆">
              <div className="sk-list">
                {customers.slice(0, 6).map((c) => (
                  <button key={c.name} className="sk-li" style={{ cursor: "pointer", textAlign: "left", color: "inherit", font: "inherit" }} onClick={() => setQ(c.name)} title="Filter by this customer" aria-label={`Filter by ${c.name}`}>
                    <Avatar name={c.name} size={34} />
                    <div className="sk-li-b"><div className="sk-li-t">{c.name}</div><div className="sk-li-s">{c.n} invoice{c.n === 1 ? "" : "s"}</div></div>
                    <b className="sk-mono">{fmtQty(c.qty)}</b>
                  </button>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      )}
    </Page>
  );
}

/* ═══════════════════════════ NEW / EDIT ═══════════════════════════ */
export function DispatchFormPage({ mode }) {
  const { id } = useParams();
  const s = useStock();
  const nav = useNavigate();
  const orig = mode === "edit" ? s.dispatches.find((d) => String(d.id) === id) : null;
  const origItems = orig ? normD(orig).items : [];
  const firstLoc = s.locations.find((l) => (s.stocks[l.id] || []).some((p) => p.qty > 0))?.id || s.locations[0]?.id || "";
  const [form, setForm] = useState(() =>
    orig
      ? { customerName: orig.customerName, date: orig.date, note: orig.note || "", location: orig.location, items: origItems.map((i) => ({ _id: genId(), productId: String(i.productId), shade: i.shade || "", qty: String(i.qtyDispatched) })) }
      : { customerName: "", date: todayStr(), note: "", location: firstLoc, items: [newItem()] },
  );
  const [no] = useState(genInvNo);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  if (mode === "edit" && s.status === "ready" && !orig) return <NotFound />;
  if (!s.locations.length)
    return <Page title="New dispatch"><Empty icon="🏭" title="Set up stock first" text="Create a location and add products before dispatching."><Link to="/Stockmanager" className="sk-btn pri">Go to Stock Manager</Link></Empty></Page>;

  const products = s.stocks[form.location] || [];
  const pastCustomers = [...new Set(s.dispatches.map((d) => d.customerName))];
  const avail = (p) => p.qty + (origItems.find((i) => String(i.productId) === String(p.id))?.qtyDispatched || 0);
  const lines = form.items.map((it) => {
    const p = products.find((x) => String(x.id) === String(it.productId));
    const qty = parseFloat(it.qty) || 0;
    const have = p ? avail(p) : 0;
    const after = p ? have - qty : 0;
    const dup = it.productId && form.items.filter((x) => x.productId === it.productId).length > 1;
    return { ...it, p, qtyN: qty, have, after, over: !!p && qty > have, dup, status: p ? productStatus({ qty: after, minQty: p.minQty }) : "ok" };
  });
  const active = lines.filter((l) => l.productId || l.qty);
  const total = active.reduce((n, l) => n + l.qtyN, 0);
  const errors = [];
  if (!form.customerName.trim()) errors.push("Customer name is required");
  if (!active.length) errors.push("Add at least one product");
  active.forEach((l) => {
    if (!l.p) errors.push("Select a product for every line");
    else if (l.qtyN <= 0) errors.push(`${l.p.name}: enter a quantity`);
    else if (l.over) errors.push(`${l.p.name}: only ${fmtQty(l.have)} ${l.p.unit} available`);
    if (l.dup) errors.push(`${l.p?.name}: selected more than once`);
  });
  const uniq = [...new Set(errors)];

  const setItem = (_id, k, v) => setForm((f) => ({ ...f, items: f.items.map((i) => (i._id === _id ? { ...i, [k]: v } : i)) }));
  const submit = async () => {
    setTried(true);
    if (uniq.length || busy) return;
    setBusy(true);
    const payloadLines = active.map((l) => ({ productId: l.productId, shade: l.shade, qty: l.qtyN }));
    const r = mode === "edit"
      ? await s.updateDispatch(orig, { customerName: form.customerName, date: form.date, note: form.note, lines: payloadLines })
      : await s.createDispatch({ invoiceNo: no, customerName: form.customerName, location: form.location, date: form.date, note: form.note, lines: payloadLines });
    setBusy(false);
    if (!r.ok) return s.toast(r.message, "error");
    s.toast(mode === "edit" ? `Invoice ${invNo(orig)} updated` : r.offline ? "Offline — invoice saved locally" : `Invoice ${no} issued`, r.offline ? "error" : "success");
    nav(mode === "edit" ? `/Dispatch/${orig.id}` : r.id ? `/Dispatch/${r.id}` : "/Dispatch");
  };

  return (
    <Page crumbs={[["/Dispatch", "Dispatch"], [null, mode === "edit" ? `Edit ${invNo(orig)}` : "New dispatch"]]} icon={mode === "edit" ? "✏" : "📤"} title={mode === "edit" ? `Edit ${invNo(orig)}` : "New dispatch"} sub={mode === "edit" ? "Stock is re-adjusted automatically" : `Invoice no. ${no}`}>
      <div className="sk-cols">
        <div className="sk-grid">
          <Card title="Invoice details" icon="🧾">
            <div className="sk-form">
              <Field label="Customer / party" required error={tried && !form.customerName.trim() && "Customer name is required"}>
                <input className={`sk-in ${tried && !form.customerName.trim() ? "err" : ""}`} list="sk-customers" autoFocus value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="Start typing a name…" />
                <datalist id="sk-customers">{pastCustomers.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Dispatch date"><input className="sk-in" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
              <Field label="From location" hint={mode === "edit" ? "Location cannot be changed on an issued invoice" : undefined}>
                <select className="sk-in" disabled={mode === "edit"} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value, items: [newItem()] }))}>
                  {s.locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({(s.stocks[l.id] || []).length})</option>)}
                </select>
              </Field>
              <Field label="Reference / note"><input className="sk-in" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Order no., PO ref, vehicle…" /></Field>
            </div>
          </Card>

          <Card title="Products" icon="🧪" right={<button className="sk-btn sm" onClick={() => setForm((f) => ({ ...f, items: [...f.items, newItem()] }))}><Ico v="＋" /> Add line</button>}>
            {products.length === 0 ? (
              <div className="sk-sub">No products in this location. <Link to={`/Stockmanager/l/${form.location}/add`} style={{ color: "var(--ov-gold)", fontWeight: 700 }}>Add a product</Link></div>
            ) : lines.map((l, idx) => (
              <div key={l._id} className={`sk-line ${tried && (l.over || l.dup) ? "bad" : ""}`}>
                <Field label={`Product ${idx + 1}`}>
                  <select className="sk-in" value={l.productId} onChange={(e) => setItem(l._id, "productId", e.target.value)}>
                    <option value="">Select product…</option>
                    {products.filter((p) => avail(p) > 0 || String(p.id) === l.productId).map((p) => <option key={p.id} value={p.id}>{p.name} — {fmtQty(avail(p))} {p.unit}</option>)}
                  </select>
                </Field>
                <Field label="Shade (optional)"><input className="sk-in" value={l.shade} onChange={(e) => setItem(l._id, "shade", e.target.value)} placeholder="e.g. Navy" /></Field>
                <Field label={`Quantity${l.p ? ` (${l.p.unit})` : ""}`}>
                  <input className={`sk-in ${l.over ? "err" : ""}`} type="number" min="0" step="any" value={l.qty} onChange={(e) => setItem(l._id, "qty", e.target.value)} placeholder="0" />
                  {l.p && l.qtyN > 0 && (
                    <div className="sk-after" style={{ color: l.over ? "var(--ov-critical)" : l.status === "ok" ? "var(--ov-safe)" : l.status === "low" ? "var(--ov-warning)" : "var(--ov-critical)" }}>
                      {l.over ? `Only ${fmtQty(l.have)} available` : `After: ${fmtQty(l.after)} ${l.p.unit}${l.status === "low" ? " · low" : l.status === "out" ? " · out" : ""}`}
                    </div>
                  )}
                </Field>
                <button className="sk-rowbtn dng" style={{ marginTop: 24, height: 40 }} aria-label="Remove line" onClick={() => setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((i) => i._id !== l._id) : [newItem()] }))}><Ico v="✕" /></button>
              </div>
            ))}
          </Card>
        </div>

        <aside className="sk-sticky">
          <Card title="Summary" icon="🧮">
            <div className="sk-sum">
              <div className="sk-sum-r"><span>Customer</span><b style={{ fontSize: 13 }}>{form.customerName.trim() || "—"}</b></div>
              <div className="sk-sum-r"><span>Products</span><b className="sk-mono">{active.length}</b></div>
              <div className="sk-sum-r sk-sum-big"><span>Total quantity</span><b className="sk-mono">{fmtQty(total)}</b></div>
            </div>
            {tried && uniq.length > 0 && <div className="sk-err" style={{ marginTop: 14, lineHeight: 1.6 }}>{uniq.map((e) => <div key={e}>• {e}</div>)}</div>}
            <button className="sk-btn pri" style={{ width: "100%", marginTop: 16, height: 44 }} disabled={busy} onClick={submit}>{busy ? "Saving…" : mode === "edit" ? "Save changes" : "Issue invoice"}</button>
            <Link to={mode === "edit" ? `/Dispatch/${orig.id}` : "/Dispatch"} className="sk-btn ghost" style={{ width: "100%", marginTop: 8 }}>Cancel</Link>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

/* ═══════════════════════════ INVOICE VIEW ═══════════════════════════ */
export function InvoicePage() {
  const { id } = useParams();
  const s = useStock();
  const nav = useNavigate();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const d = s.dispatches.find((x) => String(x.id) === id);
  if (s.status === "ready" && !d) return <NotFound />;
  if (!d) return null;
  const nd = normD(d);
  const doVoid = async () => {
    if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3500); return; }
    setBusy(true);
    const r = await s.voidDispatch(d);
    setBusy(false);
    if (!r.ok) return s.toast(r.message, "error");
    s.toast(`Invoice ${invNo(d)} voided — stock restored`);
    nav("/Dispatch");
  };
  return (
    <Page crumbs={[["/Dispatch", "Dispatch"], [null, invNo(d)]]} icon="🧾" title={invNo(d)} sub={`${d.customerName} · ${d.date}`}
      actions={<>
        <button className="sk-btn" onClick={() => printInvoices({ list: [d], company: s.companyName, locName: s.locName })}><Ico v="🖨" /> Print / PDF</button>
        <Link to={`/Dispatch/${d.id}/edit`} className="sk-btn"><Ico v="✏" /> Edit</Link></>}>
      <Card pad={false} className="sk-inv">
        <div className="sk-inv-h">
          <div><div className="sk-inv-no sk-mono">{invNo(d)}</div><div className="sk-sub" style={{ marginTop: 4 }}>{s.companyName}</div></div>
          <div style={{ textAlign: "right" }}>{d.edited && <span className="sk-tag">Edited{d.editedAt ? ` · ${d.editedAt}` : ""}</span>}<div className="sk-sub" style={{ marginTop: 6 }}>Issued {d.time || d.date}</div></div>
        </div>
        <div className="sk-inv-meta">
          <div><span>Dispatched to</span><b>{d.customerName}</b></div>
          <div><span>Date</span><b>{d.date}</b></div>
          <div><span>From location</span><b>{s.locName(d.location, d.locationName)}</b></div>
          <div><span>Reference</span><b>{d.note || "—"}</b></div>
        </div>
        <div className="sk-tbl-wrap" style={{ border: 0, borderRadius: 0, boxShadow: "none" }}>
          <table className="sk-tbl" style={{ minWidth: 520 }}>
            <thead><tr><th>#</th><th>Product</th><th className="r">Quantity</th><th className="r">Stock before</th><th className="r">Stock after</th></tr></thead>
            <tbody>
              {nd.items.map((i, n) => (
                <tr key={n}>
                  <td>{n + 1}</td>
                  <td><b>{i.productName}</b>{i.shade && <div className="sk-ps">Shade: {i.shade}</div>}</td>
                  <td className="r sk-mono" style={{ fontWeight: 800 }}>{fmtQty(i.qtyDispatched)} {i.unit}</td>
                  <td className="r sk-mono">{i.prevQty != null ? fmtQty(i.prevQty) : "—"}</td>
                  <td className="r sk-mono">{i.newQty != null ? fmtQty(i.newQty) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="sk-sub">{nd.items.length} product{nd.items.length === 1 ? "" : "s"}</span>
          <span>Total <b className="sk-mono" style={{ fontSize: 22, marginLeft: 8 }}>{fmtQty(totalOf(d))}</b></span>
        </div>
      </Card>
      <Card className="sk-danger" title="Void invoice" icon="🚫" style={{ marginTop: 16 }}>
        <div className="sk-actions" style={{ justifyContent: "space-between" }}>
          <div className="sk-sub" style={{ margin: 0, maxWidth: 520 }}>Voiding removes this invoice and returns all quantities to {s.locName(d.location, d.locationName)}.</div>
          <button className={`sk-btn dng ${armed ? "pri" : ""}`} disabled={busy} onClick={doVoid}>{busy ? "Voiding…" : armed ? "Click again to confirm" : "Void invoice"}</button>
        </div>
      </Card>
    </Page>
  );
}
