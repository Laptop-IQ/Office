import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CATEGORIES, detectColumns, getCategory, normD } from "../shared";
import {
  DEFAULT_CATEGORIES,
  LOC_ICONS,
  UNITS,
  computePkgQty,
  daysToExpiry,
  fmtQty,
  isPkgTracked,
  productStatus,
  suggestedOrder,
  useStock,
} from "./store";
import {
  exportAllExcel,
  exportProductsExcel,
  exportReorderExcel,
  parseProductSheet,
  printReorderReport,
  printStockReport,
} from "./reports";
import { Card, Empty, Field, Kpi, Page, Search, StatusPill } from "./ui";
import { Ico } from "./icons";
import { loadXLSX } from "@/lib/xlsx";

const STATUS_COLOR = { ok: "var(--ov-safe)", low: "var(--ov-warning)", out: "var(--ov-critical)" };

const ExpiryPill = ({ p }) => {
  const d = daysToExpiry(p);
  if (d === null || d > 30) return null;
  return <span className="sk-pill exp">{d < 0 ? `Expired ${-d}d ago` : d === 0 ? "Expires today" : `Expires in ${d}d`}</span>;
};

const catLabel = (c) => CATEGORIES[c]?.label || c;

/* ═══════════════════════════ OVERVIEW ═══════════════════════════ */
export function Overview() {
  const s = useStock();
  const { locations, stocks, all, alerts, expiring, changeLog } = s;
  const out = all.filter((p) => productStatus(p) === "out").length;
  const low = alerts.length - out;

  if (!locations.length)
    return (
      <Page title="Welcome to Stock Manager" sub="Start fresh — nothing is pre-filled. Create your first location to begin." icon="👋">
        <Empty icon="🏭" title="Create your first location" text="A location is any place you keep stock — a warehouse, a shop, a shade-card shelf. You can rename or delete locations any time.">
          <Link to="/Stockmanager/locations/new" className="sk-btn pri"><Ico v="＋" /> Create location</Link>
        </Empty>
        <div className="sk-kpis" style={{ marginTop: 18 }}>
          {[["1", "Create a location", "Name it and pick an icon"], ["2", "Add products", "One by one or import from Excel"], ["3", "Dispatch", "Issue invoices — stock updates automatically"]].map(([n, t, d]) => (
            <div key={n} className="sk-kpi">
              <div className="sk-kpi-l">Step {n}</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>{t}</div>
              <div className="sk-kpi-s">{d}</div>
            </div>
          ))}
        </div>
      </Page>
    );

  return (
    <Page
      title="Inventory overview"
      sub={`${locations.length} location${locations.length > 1 ? "s" : ""} · ${all.length} products`}
      actions={
        <>
          <button className="sk-btn" onClick={() => { exportAllExcel(locations, stocks, `stock_all_${Date.now()}.xlsx`); s.toast("Excel exported ✓"); }}><Ico v="⬇" /> Excel</button>
          <button className="sk-btn" onClick={() => printStockReport({ title: "Stock report — all locations", products: all, company: s.companyName, showLoc: true })}><Ico v="🖨" /> PDF</button>
          <Link to="/Stockmanager/locations/new" className="sk-btn pri"><Ico v="＋" /> Location</Link>
        </>
      }
    >
      <div className="sk-kpis">
        <Kpi label="Products" value={all.length} sub={`across ${locations.length} locations`} icon="📦" />
        <Kpi label="Low stock" value={low} color="var(--ov-warning)" sub="at or below minimum" icon="⚠" />
        <Kpi label="Out of stock" value={out} color="var(--ov-critical)" sub="needs reorder" icon="🚫" />
        <Kpi label="Expiring ≤ 30d" value={expiring.length} color="var(--ov-urgent)" sub="including expired" icon="⏳" />
      </div>

      <div className="sk-cols">
        <div>
          <div className="sk-locs">
            {locations.map((l) => {
              const list = stocks[l.id] || [];
              const lo = list.filter((p) => productStatus(p) === "low").length;
              const ou = list.filter((p) => productStatus(p) === "out").length;
              const ok = list.length - lo - ou;
              return (
                <Link key={l.id} to={`/Stockmanager/l/${l.id}`} className="sk-loc">
                  <div className="sk-loc-top">
                    <div className="sk-loc-ic" aria-hidden="true"><Ico v={l.icon} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="sk-loc-n">{l.name}</div>
                      <div className="sk-loc-m">{s.lastUpdated[l.id] ? `Updated ${s.lastUpdated[l.id]}` : "No activity yet"}</div>
                    </div>
                  </div>
                  <div className="sk-loc-stats">
                    <div className="sk-loc-stat"><b className="sk-mono">{list.length}</b><span>Products</span></div>
                    <div className="sk-loc-stat"><b className="sk-mono" style={{ color: lo ? "var(--ov-warning)" : undefined }}>{lo}</b><span>Low</span></div>
                    <div className="sk-loc-stat"><b className="sk-mono" style={{ color: ou ? "var(--ov-critical)" : undefined }}>{ou}</b><span>Out</span></div>
                  </div>
                  <div className="sk-health" aria-label="Stock health">
                    {list.length ? (
                      <>
                        <i style={{ width: `${(ok / list.length) * 100}%`, background: "var(--ov-safe)" }} />
                        <i style={{ width: `${(lo / list.length) * 100}%`, background: "var(--ov-warning)" }} />
                        <i style={{ width: `${(ou / list.length) * 100}%`, background: "var(--ov-critical)" }} />
                      </>
                    ) : null}
                  </div>
                </Link>
              );
            })}
            <Link to="/Stockmanager/locations/new" className="sk-loc sk-loc-add">
              <div><div style={{ fontSize: 30 }}><Ico v="＋" /></div>Add location</div>
            </Link>
          </div>
        </div>

        <aside className="sk-grid sk-sticky">
          <Card title="Needs attention" icon="⚠" right={<Link className="sk-rowbtn" to="/Stockmanager/alerts">View all</Link>}>
            {alerts.length === 0 ? (
              <div className="sk-sub">All products are above their minimum</div>
            ) : (
              <div className="sk-list">
                {alerts.slice(0, 6).map((p) => (
                  <Link key={`${p._loc}-${p.id}`} to={`/Stockmanager/l/${p._loc}/p/${p.id}`} className="sk-li" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="sk-li-b">
                      <div className="sk-li-t">{p.name}</div>
                      <div className="sk-li-s">{p._locName}</div>
                    </div>
                    <span className="sk-mono" style={{ fontWeight: 800, color: STATUS_COLOR[productStatus(p)] }}>{fmtQty(p.qty)} {p.unit}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
          <Card title="Recent activity" icon="🕘" right={<Link className="sk-rowbtn" to="/Stockmanager/log">All</Link>}>
            {changeLog.length === 0 ? (
              <div className="sk-sub">No activity yet.</div>
            ) : (
              <div className="sk-tl">
                {changeLog.slice(0, 5).map((c) => (
                  <div key={c.id} className="sk-tl-i">
                    <div className="sk-tl-t">{c.details}</div>
                    <div className="sk-tl-m">{c.time}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </Page>
  );
}

/* ═══════════════════════════ LOCATION INVENTORY ═══════════════════════════ */
const NotFound = ({ what, back = "/Stockmanager" }) => (
  <Page title={`${what} not found`}>
    <Empty icon="🔎" title={`${what} not found`} text="It may have been deleted, or the link is incorrect.">
      <Link to={back} className="sk-btn pri"><Ico v="←" /> Go back</Link>
    </Empty>
  </Page>
);

export function LocationPage() {
  const { locId } = useParams();
  const s = useStock();
  const loc = s.locations.find((l) => l.id === locId);
  const list = s.stocks[locId] || [];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [flt, setFlt] = useState("all");
  const [sort, setSort] = useState({ k: "name", dir: 1 });
  const [armed, setArmed] = useState(null);
  const armTimer = useRef();

  const cats = useMemo(() => [...new Set(list.map((p) => p.category))].sort(), [list]);
  const counts = useMemo(
    () => ({
      all: list.length,
      low: list.filter((p) => productStatus(p) === "low").length,
      out: list.filter((p) => productStatus(p) === "out").length,
      exp: list.filter((p) => { const d = daysToExpiry(p); return d !== null && d <= 30; }).length,
    }),
    [list],
  );
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const f = list.filter((p) => {
      if (n && !`${p.name} ${p.batch || ""} ${p.supplier || ""}`.toLowerCase().includes(n)) return false;
      if (cat !== "ALL" && p.category !== cat) return false;
      if (flt === "low") return productStatus(p) === "low";
      if (flt === "out") return productStatus(p) === "out";
      if (flt === "exp") { const d = daysToExpiry(p); return d !== null && d <= 30; }
      return true;
    });
    const rank = { out: 0, low: 1, ok: 2 };
    const cmp = {
      name: (a, b) => a.name.localeCompare(b.name),
      qty: (a, b) => a.qty - b.qty,
      status: (a, b) => rank[productStatus(a)] - rank[productStatus(b)] || a.name.localeCompare(b.name),
      expiry: (a, b) => (daysToExpiry(a) ?? 1e9) - (daysToExpiry(b) ?? 1e9),
    }[sort.k];
    return [...f].sort((a, b) => cmp(a, b) * sort.dir);
  }, [list, q, cat, flt, sort]);

  if (s.status === "ready" && !loc) return <NotFound what="Location" />;
  if (!loc) return null;

  const th = (k, label, cls = "") => (
    <th className={`srt ${cls}`} onClick={() => setSort((p) => ({ k, dir: p.k === k ? -p.dir : 1 }))} aria-sort={sort.k === k ? (sort.dir > 0 ? "ascending" : "descending") : "none"}>
      {label} {sort.k === k ? <Ico v={sort.dir > 0 ? "↑" : "↓"} /> : ""}
    </th>
  );
  const askDelete = (id) => {
    clearTimeout(armTimer.current);
    if (armed === id) {
      const p = list.find((x) => x.id === id);
      s.deleteProduct(locId, id);
      s.toast(`"${p?.name}" deleted`);
      setArmed(null);
    } else {
      setArmed(id);
      armTimer.current = setTimeout(() => setArmed(null), 3000);
    }
  };
  const Qty = ({ p }) => (
    <div>
      <div className="sk-qty" style={{ "--q": STATUS_COLOR[productStatus(p)] }}>
        <button aria-label={`Decrease ${p.name}`} onClick={() => s.nudgeQty(locId, p.id, -1)}>−</button>
        <input
          key={p.qty}
          defaultValue={p.qty}
          inputMode="decimal"
          aria-label={`Quantity of ${p.name}`}
          onBlur={(e) => e.target.value !== String(p.qty) && s.setQty(locId, p.id, e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
        <button aria-label={`Increase ${p.name}`} onClick={() => s.nudgeQty(locId, p.id, 1)}>+</button>
      </div>
      <div className="sk-qty-u">{p.unit}{isPkgTracked(p) ? ` · ${p.packageCount} × ${p.packageSize}` : ""}</div>
    </div>
  );
  const meter = (p) => {
    const st = productStatus(p);
    const pct = p.minQty > 0 ? Math.min(100, (p.qty / (p.minQty * 2)) * 100) : p.qty > 0 ? 100 : 0;
    return <div className="sk-meter"><i style={{ width: `${pct}%`, background: STATUS_COLOR[st] }} /></div>;
  };
  const Actions = ({ p }) => (
    <span className="sk-rowbtns">
      <Link className="sk-rowbtn" to={`/Stockmanager/l/${locId}/edit/${p.id}`}><Ico v="✏" /> Edit</Link>
      <button className={`sk-rowbtn dng ${armed === p.id ? "armed" : ""}`} onClick={() => askDelete(p.id)} aria-label={`Delete ${p.name}`}>
        {armed === p.id ? "Confirm?" : <Ico v="🗑" />}
      </button>
    </span>
  );

  return (
    <Page
      crumbs={[["/Stockmanager", "Overview"], [null, loc.name]]}
      icon={loc.icon}
      title={loc.name}
      sub={`${list.length} product${list.length === 1 ? "" : "s"}${s.lastUpdated[locId] ? ` · updated ${s.lastUpdated[locId]}` : ""}`}
      actions={
        <>
          <Link to={`/Stockmanager/locations/${locId}/edit`} className="sk-btn ghost sm"><Ico v="✏" /> Rename</Link>
          <button className="sk-btn sm" disabled={!list.length} onClick={() => { exportProductsExcel(rows.map((p) => ({ ...p, _locName: loc.name })), loc.name, `${loc.id}_stock_${Date.now()}.xlsx`); s.toast("Excel exported ✓"); }}><Ico v="⬇" /> Excel</button>
          <button className="sk-btn sm" disabled={!list.length} onClick={() => printStockReport({ title: `${loc.name} stock report`, products: rows.map((p) => ({ ...p, _locName: loc.name })), company: s.companyName })}><Ico v="🖨" /> PDF</button>
          <Link to={`/Stockmanager/l/${locId}/import`} className="sk-btn sm"><Ico v="⬆" /> Import</Link>
          <Link to={`/Stockmanager/l/${locId}/add`} className="sk-btn pri"><Ico v="＋" /> Add product</Link>
        </>
      }
    >
      {list.length === 0 ? (
        <Empty icon="🧪" title="No products here yet" text={`${loc.name} is empty. Add your first product or import a list from Excel.`}>
          <div className="sk-actions" style={{ justifyContent: "center" }}>
            <Link to={`/Stockmanager/l/${locId}/add`} className="sk-btn pri"><Ico v="＋" /> Add product</Link>
            <Link to={`/Stockmanager/l/${locId}/import`} className="sk-btn"><Ico v="⬆" /> Import Excel</Link>
          </div>
        </Empty>
      ) : (
        <>
          <div className="sk-kpis">
            <Kpi label="Products" value={counts.all} icon="📦" />
            <Kpi label="Low" value={counts.low} color="var(--ov-warning)" icon="⚠" />
            <Kpi label="Out of stock" value={counts.out} color="var(--ov-critical)" icon="🚫" />
            <Kpi label="Expiring ≤ 30d" value={counts.exp} color="var(--ov-urgent)" icon="⏳" />
          </div>
          <div className="sk-tools">
            <div className="sk-search">
              <Search />
              <input className="sk-in" placeholder="Search name, batch or supplier…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
            </div>
            <select className="sk-in" style={{ width: "auto", minWidth: 160 }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
              <option value="ALL">All categories</option>
              {cats.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
            </select>
            <div className="sk-chips" role="group" aria-label="Status filter">
              {[["all", "All", counts.all], ["low", "Low", counts.low], ["out", "Out", counts.out], ["exp", "Expiring", counts.exp]].map(([k, l, n]) => (
                <button key={k} className={`sk-chip ${flt === k ? "on" : ""}`} onClick={() => setFlt(k)} aria-pressed={flt === k}>{l} <small>{n}</small></button>
              ))}
            </div>
          </div>

          <div className="sk-tbl-wrap has-m">
            <table className="sk-tbl">
              <thead>
                <tr>{th("name", "Product")}<th>Category</th>{th("qty", "Quantity", "c")}<th className="r">Min</th>{th("status", "Status")}{th("expiry", "Expiry")}<th className="r">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link className="sk-pn" to={`/Stockmanager/l/${locId}/p/${p.id}`}>{p.name}</Link>
                      <div className="sk-ps">{[p.batch && `Batch ${p.batch}`, p.supplier].filter(Boolean).join(" · ") || "—"}</div>
                    </td>
                    <td><span className="sk-cat">{catLabel(p.category)}</span></td>
                    <td className="c"><Qty p={p} />{meter(p)}</td>
                    <td className="r sk-mono">{fmtQty(p.minQty)} {p.unit}</td>
                    <td><StatusPill status={productStatus(p)} /></td>
                    <td>{p.expiry ? <div><div className="sk-mono" style={{ fontSize: 12 }}>{p.expiry}</div><ExpiryPill p={p} /></div> : "—"}</td>
                    <td className="r"><Actions p={p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="sk-empty" style={{ padding: 36 }}><p style={{ margin: 0 }}>No products match your filters.</p></div>}
          </div>
          <div className="sk-mcards">
            {rows.map((p) => (
              <div key={p.id} className="sk-mcard">
                <div className="sk-mcard-top">
                  <div style={{ minWidth: 0 }}>
                    <Link className="sk-pn" to={`/Stockmanager/l/${locId}/p/${p.id}`}>{p.name}</Link>
                    <div className="sk-ps">{catLabel(p.category)} · min {fmtQty(p.minQty)} {p.unit}</div>
                  </div>
                  <StatusPill status={productStatus(p)} />
                </div>
                <div className="sk-mcard-bot"><Qty p={p} /><Actions p={p} /></div>
                {p.expiry && <div style={{ marginTop: 10 }}><ExpiryPill p={p} /></div>}
              </div>
            ))}
            {rows.length === 0 && <div className="sk-sub" style={{ textAlign: "center", padding: 24 }}>No products match your filters.</div>}
          </div>
        </>
      )}
    </Page>
  );
}

/* ═══════════════════════════ PRODUCT FORM (add / edit) ═══════════════════════════ */
const BLANK = { name: "", category: "", unit: "kg", qty: "", minQty: "", batch: "", expiry: "", supplier: "", reorderNote: "", packageSize: "", packageCount: "" };

export function ProductFormPage({ mode }) {
  const { locId, pid } = useParams();
  const s = useStock();
  const nav = useNavigate();
  const loc = s.locations.find((l) => l.id === locId);
  const existing = mode === "edit" ? (s.stocks[locId] || []).find((p) => String(p.id) === pid) : null;
  const [f, setF] = useState(() => (existing ? { ...BLANK, ...existing } : BLANK));
  const [track, setTrack] = useState(() => !!existing && isPkgTracked(existing));
  const [touched, setTouched] = useState({});
  const [armed, setArmed] = useState(false);
  const cats = useMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...s.all.map((p) => p.category)])], [s.all]);

  useEffect(() => {
    if (existing) { setF({ ...BLANK, ...existing }); setTrack(isPkgTracked(existing)); }
  }, [existing?.id]); // eslint-disable-line

  if (s.status === "ready" && !loc) return <NotFound what="Location" />;
  if (mode === "edit" && s.status === "ready" && !existing) return <NotFound what="Product" back={`/Stockmanager/l/${locId}`} />;
  if (!loc) return null;

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const pkgQty = computePkgQty(f.packageSize, f.packageCount);
  const err = {
    name: !f.name.trim() ? "Product name is required" : "",
    qty: !track && f.qty !== "" && Number(f.qty) < 0 ? "Quantity cannot be negative" : "",
    pkg: track && (pkgQty === null) ? "Enter package size and number of packages" : "",
  };
  const bad = Object.values(err).some(Boolean);
  const back = `/Stockmanager/l/${locId}`;
  const submit = (again = false) => {
    setTouched({ name: true, qty: true, pkg: true });
    if (bad) return;
    const data = { ...f, category: f.category || getCategory(f.name), ...(track ? {} : { packageSize: "", packageCount: "" }) };
    if (mode === "edit") {
      s.updateProduct(locId, existing.id, data);
      s.toast("Product saved");
      nav(back);
    } else {
      const p = s.addProduct(locId, data);
      s.toast(`"${p.name}" added`);
      if (again) { setF({ ...BLANK, unit: f.unit, category: f.category }); setTouched({}); } else nav(back);
    }
  };

  return (
    <Page narrow={860} crumbs={[["/Stockmanager", "Overview"], [back, loc.name], [null, mode === "edit" ? "Edit product" : "Add product"]]} icon={mode === "edit" ? "✏" : "＋"} title={mode === "edit" ? existing.name : "Add product"} sub={`${loc.name}`}>
      <Card>
        <div className="sk-form">
          <Field label="Product name" required full error={touched.name && err.name}>
            <input className={`sk-in ${touched.name && err.name ? "err" : ""}`} autoFocus value={f.name} onChange={set("name")} placeholder="e.g. Ecofast Red 195" />
          </Field>
          <Field label="Category" hint={!f.category && f.name ? `Auto-detected: ${catLabel(getCategory(f.name))}` : undefined}>
            <input className="sk-in" list="sk-cats" value={f.category} onChange={set("category")} placeholder="Type or pick a category" />
            <datalist id="sk-cats">{cats.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}</datalist>
          </Field>
          <Field label="Unit">
            <select className="sk-in" value={f.unit} onChange={set("unit")}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
          </Field>
          <div className="full">
            <label className="sk-switch">
              <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} />
              <i /> Track by packages (e.g. 25 kg bags)
            </label>
          </div>
          {track ? (
            <>
              <Field label={`Package size (${f.unit})`} error={touched.pkg && err.pkg}>
                <input className="sk-in" type="number" min="1" value={f.packageSize} onChange={set("packageSize")} placeholder="25" />
              </Field>
              <Field label="Number of packages">
                <input className="sk-in" type="number" min="0" value={f.packageCount} onChange={set("packageCount")} placeholder="10" />
              </Field>
              <div className="full sk-hint">Total quantity = <b className="sk-mono">{pkgQty ?? "—"} {f.unit}</b></div>
            </>
          ) : (
            <Field label={`Quantity (${f.unit})`} error={touched.qty && err.qty}>
              <input className="sk-in" type="number" min="0" step="any" value={f.qty} onChange={set("qty")} placeholder="0" />
            </Field>
          )}
          <Field label={`Minimum quantity (${f.unit})`} hint="You get a low-stock alert at or below this level">
            <input className="sk-in" type="number" min="0" step="any" value={f.minQty} onChange={set("minQty")} placeholder="0" />
          </Field>
          <Field label="Batch no."><input className="sk-in" value={f.batch} onChange={set("batch")} /></Field>
          <Field label="Expiry date"><input className="sk-in" type="date" value={f.expiry} onChange={set("expiry")} /></Field>
          <Field label="Supplier"><input className="sk-in" value={f.supplier} onChange={set("supplier")} /></Field>
          <Field label="Reorder note" full><textarea className="sk-in" value={f.reorderNote} onChange={set("reorderNote")} placeholder="Anything to remember when reordering…" /></Field>
        </div>
      </Card>

      {mode === "edit" && (
        <Card className="sk-danger" title="Danger zone" icon="🗑" style={{ marginTop: 16 }}>
          <div className="sk-actions" style={{ justifyContent: "space-between" }}>
            <div className="sk-sub" style={{ margin: 0 }}>Delete this product from {loc.name}. This cannot be undone.</div>
            <button className={`sk-btn dng ${armed ? "pri" : ""}`} onClick={() => { if (armed) { s.deleteProduct(locId, existing.id); s.toast("Product deleted"); nav(back); } else { setArmed(true); setTimeout(() => setArmed(false), 3500); } }}>
              {armed ? "Click again to confirm" : "Delete product"}
            </button>
          </div>
        </Card>
      )}

      <div className="sk-foot">
        <Link to={back} className="sk-btn">Cancel</Link>
        {mode === "add" && <button className="sk-btn" onClick={() => submit(true)}>Save & add another</button>}
        <button className="sk-btn pri" onClick={() => submit(false)}>{mode === "edit" ? "Save changes" : "Add product"}</button>
      </div>
    </Page>
  );
}

/* ═══════════════════════════ PRODUCT DETAIL ═══════════════════════════ */
export function ProductDetailPage() {
  const { locId, pid } = useParams();
  const s = useStock();
  const loc = s.locations.find((l) => l.id === locId);
  const p = (s.stocks[locId] || []).find((x) => String(x.id) === pid);
  if (s.status === "ready" && (!loc || !p)) return <NotFound what="Product" back={`/Stockmanager/l/${locId}`} />;
  if (!loc || !p) return null;
  const st = productStatus(p);
  const history = s.changeLog.filter((c) => c.tab === locId && c.details.includes(`"${p.name}"`)).slice(0, 15);
  const sent = s.dispatches
    .filter((d) => d.location === locId)
    .flatMap((d) => normD(d).items.filter((i) => String(i.productId) === String(p.id)).map((i) => ({ d, i })))
    .slice(0, 8);
  const dd = daysToExpiry(p);
  return (
    <Page
      crumbs={[["/Stockmanager", "Overview"], [`/Stockmanager/l/${locId}`, loc.name], [null, p.name]]}
      icon="🧪"
      title={p.name}
      sub={`${catLabel(p.category)} · ${loc.name}`}
      actions={<><Link to={`/Stockmanager/transfer?from=${locId}&product=${p.id}`} className="sk-btn"><Ico v="⇄" /> Transfer</Link><Link to={`/Stockmanager/l/${locId}/edit/${p.id}`} className="sk-btn pri"><Ico v="✏" /> Edit</Link></>}
    >
      <div className="sk-kpis">
        <Kpi label="In stock" value={`${fmtQty(p.qty)}`} sub={p.unit} color={STATUS_COLOR[st]} />
        <Kpi label="Minimum" value={fmtQty(p.minQty)} sub={p.unit} />
        <Kpi label="Status" value={<StatusPill status={st} />} sub={st !== "ok" ? `Suggested order: ${fmtQty(suggestedOrder(p))} ${p.unit}` : "Above minimum"} />
        <Kpi label="Expiry" value={p.expiry || "—"} sub={dd === null ? "Not set" : dd < 0 ? `Expired ${-dd} days ago` : `${dd} days left`} color={dd !== null && dd <= 30 ? "var(--ov-urgent)" : undefined} />
      </div>
      <div className="sk-cols">
        <div className="sk-grid">
          <Card title="Dispatch history" icon="📤">
            {sent.length === 0 ? <div className="sk-sub">This product has not been dispatched yet.</div> : (
              <div className="sk-list">
                {sent.map(({ d, i }) => (
                  <Link key={`${d.id}-${i.productId}`} to={`/Dispatch/${d.id}`} className="sk-li" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="sk-li-b"><div className="sk-li-t">{d.customerName}</div><div className="sk-li-s">{d.invoiceNo || d.id} · {d.date}</div></div>
                    <b className="sk-mono">{fmtQty(i.qtyDispatched)} {i.unit}</b>
                  </Link>
                ))}
              </div>
            )}
          </Card>
          <Card title="Stock movement" icon="🕘">
            {history.length === 0 ? <div className="sk-sub">No recorded changes yet.</div> : (
              <div className="sk-tl">{history.map((c) => <div key={c.id} className="sk-tl-i"><div className="sk-tl-t">{c.details}</div><div className="sk-tl-m">{c.time}</div></div>)}</div>
            )}
          </Card>
        </div>
        <aside className="sk-sticky">
          <Card title="Details" icon="ℹ">
            <div className="sk-list">
              {[["Batch", p.batch], ["Supplier", p.supplier], ["Packages", isPkgTracked(p) ? `${p.packageCount} × ${p.packageSize} ${p.unit}` : ""], ["Reorder note", p.reorderNote]].map(([k, v]) => (
                <div key={k} className="sk-li"><div className="sk-li-b"><div className="sk-li-s">{k}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v || "—"}</div></div></div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

/* ═══════════════════════════ IMPORT ═══════════════════════════ */
export function ImportPage() {
  const { locId } = useParams();
  const s = useStock();
  const nav = useNavigate();
  const loc = s.locations.find((l) => l.id === locId);
  const [rows, setRows] = useState(null);
  const [file, setFile] = useState("");
  const [unit, setUnit] = useState("kg");
  const [over, setOver] = useState(false);
  const inp = useRef();
  if (s.status === "ready" && !loc) return <NotFound what="Location" />;
  if (!loc) return null;

  const read = (f) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = async (e) => {
      try {
        const parsed = await parseProductSheet(e.target.result, detectColumns);
        if (!parsed.length) return s.toast("No valid rows found in this file", "error");
        setRows(parsed); setFile(f.name);
      } catch { s.toast("Could not read this file", "error"); }
    };
    r.readAsArrayBuffer(f);
  };
  const template = async () => {
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Product Name", "Qty", "Min Qty"], ["Example product", 100, 20]]), "Template");
    XLSX.writeFile(wb, "stock_import_template.xlsx");
  };
  const done = () => {
    const n = s.importProducts(locId, rows.map((r) => ({ ...r, unit, category: getCategory(r.name), batch: "", expiry: "", supplier: "", reorderNote: "", packageSize: "", packageCount: "" })));
    s.toast(`${n} products imported`);
    nav(`/Stockmanager/l/${locId}`);
  };
  return (
    <Page narrow={960} crumbs={[["/Stockmanager", "Overview"], [`/Stockmanager/l/${locId}`, loc.name], [null, "Import"]]} icon="⬆" title="Import from Excel" sub={`Add products to ${loc.name}`}
      actions={<button className="sk-btn" onClick={template}><Ico v="⬇" /> Download template</button>}>
      {!rows ? (
        <div className={`sk-drop ${over ? "over" : ""}`} role="button" tabIndex={0}
          onClick={() => inp.current.click()} onKeyDown={(e) => e.key === "Enter" && inp.current.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files[0]); }}>
          <div>
            <div style={{ fontSize: 40 }}><Ico v="📂" /></div>
            <div style={{ fontWeight: 800, fontSize: 17, margin: "8px 0 4px" }}>Drop your Excel file here</div>
            <div className="sk-sub">or click to browse (.xlsx, .xls, .csv). Columns: Product Name, Qty, Min Qty.</div>
          </div>
          <input ref={inp} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { read(e.target.files[0]); e.target.value = ""; }} />
        </div>
      ) : (
        <>
          <Card title={`Preview · ${file}`} icon="👁" right={<span className="sk-pill info plain">{rows.length} rows</span>}>
            <div className="sk-form" style={{ marginBottom: 16 }}>
              <Field label="Unit for all imported products"><select className="sk-in" value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field>
            </div>
            <div className="sk-tbl-wrap">
              <table className="sk-tbl"><thead><tr><th>#</th><th>Product</th><th>Category</th><th className="r">Qty</th><th className="r">Min</th></tr></thead>
                <tbody>{rows.slice(0, 50).map((r, i) => <tr key={i}><td>{i + 1}</td><td><b>{r.name}</b></td><td><span className="sk-cat">{catLabel(getCategory(r.name))}</span></td><td className="r sk-mono">{fmtQty(r.qty)}</td><td className="r sk-mono">{fmtQty(r.minQty)}</td></tr>)}</tbody></table>
            </div>
            {rows.length > 50 && <div className="sk-hint">Showing the first 50 of {rows.length} rows.</div>}
          </Card>
          <div className="sk-foot">
            <button className="sk-btn" onClick={() => setRows(null)}>Choose another file</button>
            <button className="sk-btn pri" onClick={done}>Import {rows.length} products</button>
          </div>
        </>
      )}
    </Page>
  );
}

/* ═══════════════════════════ LOCATIONS ═══════════════════════════ */
export function LocationsPage() {
  const s = useStock();
  return (
    <Page title="Locations" icon="📍" sub="Warehouses, shops and shelves where you keep stock" actions={<Link to="/Stockmanager/locations/new" className="sk-btn pri"><Ico v="＋" /> New location</Link>}>
      {s.locations.length === 0 ? (
        <Empty icon="📍" title="No locations yet" text="Create a location to start adding products."><Link to="/Stockmanager/locations/new" className="sk-btn pri"><Ico v="＋" /> Create location</Link></Empty>
      ) : (
        <div className="sk-list">
          {s.locations.map((l) => {
            const n = (s.stocks[l.id] || []).length;
            return (
              <div key={l.id} className="sk-li" style={{ padding: 16 }}>
                <div className="sk-loc-ic" aria-hidden="true"><Ico v={l.icon} /></div>
                <div className="sk-li-b"><div className="sk-li-t" style={{ fontSize: 15 }}>{l.name}</div><div className="sk-li-s">{n} product{n === 1 ? "" : "s"}</div></div>
                <Link className="sk-btn sm" to={`/Stockmanager/l/${l.id}`}>Open</Link>
                <Link className="sk-btn sm" to={`/Stockmanager/locations/${l.id}/edit`}><Ico v="✏" /> Edit</Link>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}

export function LocationFormPage({ mode }) {
  const { locId } = useParams();
  const s = useStock();
  const nav = useNavigate();
  const ex = mode === "edit" ? s.locations.find((l) => l.id === locId) : null;
  const [name, setName] = useState(ex?.name || "");
  const [icon, setIcon] = useState(ex?.icon || "🏭");
  const [tried, setTried] = useState(false);
  const [confirm, setConfirm] = useState("");
  useEffect(() => { if (ex) { setName(ex.name); setIcon(ex.icon); } }, [ex?.id]); // eslint-disable-line
  if (mode === "edit" && s.status === "ready" && !ex) return <NotFound what="Location" />;
  const count = ex ? (s.stocks[ex.id] || []).length : 0;
  const dup = s.locations.some((l) => l.id !== ex?.id && l.name.trim().toLowerCase() === name.trim().toLowerCase());
  const error = !name.trim() ? "Location name is required" : dup ? "A location with this name already exists" : "";
  const save = () => {
    setTried(true);
    if (error) return;
    if (ex) { s.updateLocation(ex.id, { name, icon }); s.toast("Location updated"); nav(`/Stockmanager/l/${ex.id}`); }
    else { const id = s.addLocation({ name, icon }); s.toast(`"${name.trim()}" created`); nav(`/Stockmanager/l/${id}`); }
  };
  return (
    <Page narrow={760} crumbs={[["/Stockmanager", "Overview"], ["/Stockmanager/locations", "Locations"], [null, ex ? "Edit" : "New"]]} icon={icon} title={ex ? `Edit ${ex.name}` : "New location"} sub="Give it a clear name and pick an icon">
      <Card>
        <div className="sk-form">
          <Field label="Location name" required full error={tried && error}>
            <input className={`sk-in ${tried && error ? "err" : ""}`} autoFocus value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="e.g. Main warehouse" />
          </Field>
          <Field label="Icon" full>
            <div className="sk-icons" role="radiogroup" aria-label="Icon">
              {LOC_ICONS.map((i) => <button key={i} type="button" role="radio" aria-checked={icon === i} className={icon === i ? "on" : ""} onClick={() => setIcon(i)} aria-label="Location icon"><Ico v={i} /></button>)}
            </div>
          </Field>
        </div>
      </Card>
      {ex && (
        <Card className="sk-danger" title="Delete location" icon="🗑" style={{ marginTop: 16 }}>
          <div className="sk-sub" style={{ marginTop: 0 }}>
            {count > 0 ? <>This permanently deletes <b>{count} product{count === 1 ? "" : "s"}</b> stored in {ex.name}. </> : "This location is empty. "}
            Past dispatch invoices are kept.
          </div>
          <div className="sk-actions" style={{ marginTop: 12 }}>
            <input className="sk-in" style={{ maxWidth: 260 }} placeholder={`Type "${ex.name}" to confirm`} value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Type the location name to confirm deletion" />
            <button className="sk-btn dng" disabled={confirm.trim() !== ex.name} onClick={() => { s.deleteLocation(ex.id); s.toast(`"${ex.name}" deleted`); nav("/Stockmanager"); }}>Delete location</button>
          </div>
        </Card>
      )}
      <div className="sk-foot">
        <Link to={ex ? `/Stockmanager/l/${ex.id}` : "/Stockmanager/locations"} className="sk-btn">Cancel</Link>
        <button className="sk-btn pri" onClick={save}>{ex ? "Save changes" : "Create location"}</button>
      </div>
    </Page>
  );
}

/* ═══════════════════════════ ALERTS ═══════════════════════════ */
export function AlertsPage() {
  const s = useStock();
  const [tab, setTab] = useState("stock");
  const list = tab === "stock" ? s.alerts.slice().sort((a, b) => (productStatus(a) === "out" ? -1 : 1) - (productStatus(b) === "out" ? -1 : 1)) : s.expiring.slice().sort((a, b) => daysToExpiry(a) - daysToExpiry(b));
  return (
    <Page title="Alerts" icon="⚠" sub="Low stock, out of stock and expiring products across all locations"
      actions={s.alerts.length > 0 && <>
        <button className="sk-btn" onClick={() => exportReorderExcel(s.alerts, `reorder_list_${Date.now()}.xlsx`)}><Ico v="⬇" /> Reorder Excel</button>
        <button className="sk-btn pri" onClick={() => printReorderReport({ products: s.alerts, company: s.companyName })}><Ico v="🖨" /> Reorder PDF</button></>}>
      <div className="sk-chips" style={{ marginBottom: 14 }} role="tablist">
        <button className={`sk-chip ${tab === "stock" ? "on" : ""}`} onClick={() => setTab("stock")}>Low & out <small>{s.alerts.length}</small></button>
        <button className={`sk-chip ${tab === "exp" ? "on" : ""}`} onClick={() => setTab("exp")}>Expiring ≤ 30d <small>{s.expiring.length}</small></button>
      </div>
      {list.length === 0 ? (
        <Empty icon="✅" title="All clear" text={tab === "stock" ? "Every product is above its minimum quantity." : "No products are expiring in the next 30 days."} />
      ) : (
        <div className="sk-tbl-wrap">
          <table className="sk-tbl">
            <thead><tr><th>Product</th><th>Location</th><th className="r">In stock</th><th className="r">Min</th><th>Status</th><th className="r">{tab === "stock" ? "Suggested order" : "Expiry"}</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={`${p._loc}-${p.id}`}>
                  <td><Link className="sk-pn" to={`/Stockmanager/l/${p._loc}/p/${p.id}`}>{p.name}</Link><div className="sk-ps">{p.supplier || "—"}</div></td>
                  <td>{p._locName}</td>
                  <td className="r sk-mono" style={{ fontWeight: 800, color: STATUS_COLOR[productStatus(p)] }}>{fmtQty(p.qty)} {p.unit}</td>
                  <td className="r sk-mono">{fmtQty(p.minQty)}</td>
                  <td><StatusPill status={productStatus(p)} /> <ExpiryPill p={p} /></td>
                  <td className="r sk-mono">{tab === "stock" ? <b>{fmtQty(suggestedOrder(p))} {p.unit}</b> : p.expiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}

/* ═══════════════════════════ TRANSFER ═══════════════════════════ */
export function TransferPage() {
  const s = useStock();
  const nav = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const [from, setFrom] = useState(params.get("from") || s.locations[0]?.id || "");
  const [to, setTo] = useState("");
  const [pid, setPid] = useState(params.get("product") || "");
  const [qty, setQty] = useState("");
  const [msg, setMsg] = useState("");
  const src = s.stocks[from] || [];
  const p = src.find((x) => String(x.id) === String(pid));
  if (s.locations.length < 2)
    return (
      <Page title="Transfer stock" icon="⇄">
        <Empty icon="⇄" title="You need at least two locations" text="Create another location to move stock between locations."><Link to="/Stockmanager/locations/new" className="sk-btn pri"><Ico v="＋" /> New location</Link></Empty>
      </Page>
    );
  const go = () => {
    const r = s.transferStock({ from, to, productId: p?.id, qty });
    if (!r.ok) return setMsg(r.message);
    s.toast("Stock transferred");
    nav(`/Stockmanager/l/${to}`);
  };
  return (
    <Page narrow={760} icon="⇄" title="Transfer stock" sub="Move quantity from one location to another. Matching products are merged.">
      <Card>
        <div className="sk-form">
          <Field label="From location"><select className="sk-in" value={from} onChange={(e) => { setFrom(e.target.value); setPid(""); setMsg(""); }}>{s.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          <Field label="To location"><select className="sk-in" value={to} onChange={(e) => { setTo(e.target.value); setMsg(""); }}><option value="">Select…</option>{s.locations.filter((l) => l.id !== from).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          <Field label="Product" full><select className="sk-in" value={pid} onChange={(e) => { setPid(e.target.value); setMsg(""); }}><option value="">Select product…</option>{src.map((x) => <option key={x.id} value={x.id}>{x.name} — {fmtQty(x.qty)} {x.unit}</option>)}</select></Field>
          <Field label={`Quantity${p ? ` (${p.unit})` : ""}`} hint={p ? `Available: ${fmtQty(p.qty)} ${p.unit}` : undefined} error={msg}><input className="sk-in" type="number" min="0" step="any" value={qty} onChange={(e) => { setQty(e.target.value); setMsg(""); }} /></Field>
        </div>
      </Card>
      <div className="sk-foot"><button className="sk-btn pri" disabled={!from || !to || !p || !qty} onClick={go}>Transfer stock</button></div>
    </Page>
  );
}

/* ═══════════════════════════ ACTIVITY LOG ═══════════════════════════ */
const ACTION_META = {
  ADD: ["Added", "var(--ov-safe)"], EDIT: ["Edited", "var(--ov-info)"], DELETE: ["Deleted", "var(--ov-critical)"], QTY: ["Quantity", "var(--ov-gold)"],
  IMPORT: ["Import", "var(--ov-info)"], DISPATCH: ["Dispatch", "var(--ov-urgent)"], UNDO_DISPATCH: ["Void", "var(--ov-critical)"], EDIT_DISPATCH: ["Invoice edit", "var(--ov-info)"],
  TRANSFER: ["Transfer", "var(--ov-gold)"], LOCATION: ["Location", "var(--ov-info)"],
};
export function LogPage() {
  const s = useStock();
  const [q, setQ] = useState("");
  const [act, setAct] = useState("ALL");
  const [loc, setLoc] = useState("ALL");
  const rows = s.changeLog.filter((c) => (act === "ALL" || c.action === act) && (loc === "ALL" || c.tab === loc) && (!q || c.details.toLowerCase().includes(q.toLowerCase())));
  return (
    <Page title="Activity log" icon="🕘" sub="Last 200 changes across stock and dispatch">
      <div className="sk-tools">
        <div className="sk-search"><Search /><input className="sk-in" placeholder="Search activity…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search activity" /></div>
        <select className="sk-in" style={{ width: "auto" }} value={act} onChange={(e) => setAct(e.target.value)} aria-label="Action"><option value="ALL">All actions</option>{Object.entries(ACTION_META).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className="sk-in" style={{ width: "auto" }} value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Location"><option value="ALL">All locations</option>{s.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
      </div>
      {rows.length === 0 ? <Empty icon="🕘" title="No activity" text="Changes you make will appear here." /> : (
        <Card><div className="sk-tl">{rows.map((c) => { const [l, col] = ACTION_META[c.action] || [c.action, "var(--ov-gold)"]; return (
          <div key={c.id} className="sk-tl-i" style={{ "--tc": col }}>
            <div className="sk-tl-t"><span className="sk-tag" style={{ marginRight: 8 }}>{l}</span>{c.details}</div>
            <div className="sk-tl-m">{c.time} · {s.locName(c.tab)}</div>
          </div>); })}</div></Card>
      )}
    </Page>
  );
}

/* ═══════════════════════════ SETTINGS ═══════════════════════════ */
export function SettingsPage() {
  const s = useStock();
  const nav = useNavigate();
  const [name, setName] = useState(s.companyName);
  const [confirm, setConfirm] = useState("");
  const file = useRef();
  const restore = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { try { const ok = s.restoreBackup(JSON.parse(ev.target.result)); s.toast(ok ? "Data restored" : "Invalid backup file", ok ? "success" : "error"); } catch { s.toast("Invalid JSON file", "error"); } };
    r.readAsText(f); e.target.value = "";
  };
  return (
    <Page narrow={820} icon="⚙" title="Settings" sub="Company details, backup and data">
      <div className="sk-grid">
        <Card title="Company" icon="🏢">
          <div className="sk-form"><Field label="Company / store name" hint="Shown on invoices and reports." full>
            <div className="sk-actions"><input className="sk-in" style={{ flex: 1, minWidth: 200 }} value={name} onChange={(e) => setName(e.target.value)} /><button className="sk-btn pri" disabled={!name.trim() || name === s.companyName} onClick={() => { s.setCompanyName(name.trim()); s.toast("Saved"); }}>Save</button></div>
          </Field></div>
        </Card>
        <Card title="Backup & restore" icon="💾">
          <div className="sk-sub" style={{ marginTop: 0, marginBottom: 12 }}>Download everything (locations, stock, dispatches, history) as a JSON file, or restore from a previous backup.</div>
          <div className="sk-actions">
            <button className="sk-btn" onClick={() => { s.exportBackup(); s.toast("Backup downloaded"); }}><Ico v="⬇" /> Download backup</button>
            <button className="sk-btn" onClick={() => file.current.click()}><Ico v="⬆" /> Restore from file</button>
            <input ref={file} type="file" accept=".json" hidden onChange={restore} />
          </div>
        </Card>
        <Card className="sk-danger" title="Danger zone" icon="🗑">
          <div className="sk-sub" style={{ marginTop: 0 }}>Permanently deletes all locations, products, dispatches and history from this device and the server.</div>
          <div className="sk-actions" style={{ marginTop: 12 }}>
            <input className="sk-in" style={{ maxWidth: 240 }} placeholder='Type "DELETE" to confirm' value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Type DELETE to confirm" />
            <button className="sk-btn dng" disabled={confirm !== "DELETE"} onClick={async () => { await s.clearAll(); s.toast("All data cleared"); nav("/Stockmanager"); }}>Delete all data</button>
          </div>
        </Card>
      </div>
    </Page>
  );
}
