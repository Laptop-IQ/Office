import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Upload,
  Download,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit3,
  PhoneCall,
  FileText,
  ShoppingCart,
  Wallet,
  BookOpen,
  StickyNote,
  Paperclip,
  Trash2,
  Phone,
  MessageCircle,
  Mail,
  Building2,
  MapPin,
  CreditCard,
  Clock,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Star,
  Users,
  IndianRupee,
  Factory,
  Beaker,
  PackageSearch,
  ArrowUpDown,
  Filter as FilterIcon,
  Loader2,
  LayoutGrid,
  List,
  User,
  Layers,
  ShieldCheck,
  Sparkles,
  Check,
  Tag,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  fetchCustomers,
  fetchCustomerStats,
  fetchCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  bulkAssignSalesPerson,
  addTimelineEntry,
} from "../api/customerApi"; // adjust path to wherever you place customerApi.js

/* ────────────────────────────────────────────────────────────────
   STATIC OPTIONS (match backend enum values)
──────────────────────────────────────────────────────────────── */
const TYPES = ["Distributor", "Dealer", "Manufacturer", "Retail"];
const STATUSES = ["Active", "Inactive", "Blocked"];
const CATEGORIES = ["Dyes", "Auxiliaries", "Fixatives", "Solvents", "Pigments"];
const STATES = [
  "Haryana",
  "Gujarat",
  "Punjab",
  "Maharashtra",
  "Tamil Nadu",
  "Rajasthan",
  "Uttar Pradesh",
  "West Bengal",
  "Andhra Pradesh",
  "Karnataka",
  "Delhi",
];
const FOLLOWUPS = [
  "today",
  "tomorrow",
  "overdue",
  "completed",
  "cancelled",
  "upcoming",
];

/* ────────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────────── */
const inr = (n) =>
  "₹" + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const initialsOf = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ────────────────────────────────────────────────────────────────
   IMPORT / EXPORT (CSV) — one shared column map so a file exported
   from this page can be edited and re-imported without remapping.
──────────────────────────────────────────────────────────────── */
const IMPORT_EXPORT_COLUMNS = [
  { key: "customerId", label: "Customer ID" },
  { key: "company", label: "Company" },
  { key: "name", label: "Contact Person" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "type", label: "Type" },
  { key: "category", label: "Category" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "gst", label: "GST" },
  { key: "pan", label: "PAN" },
  { key: "creditLimit", label: "Credit Limit" },
  { key: "outstanding", label: "Outstanding" },
  { key: "status", label: "Status" },
  { key: "lastOrderDate", label: "Last Order Date" },
  { key: "nextFollowUpDate", label: "Next Follow-up" },
];

const csvEscape = (val) => {
  const s = val === null || val === undefined ? "" : String(val);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const buildCSV = (rows) => {
  const header = IMPORT_EXPORT_COLUMNS.map((c) => csvEscape(c.label)).join(",");
  const lines = rows.map((row) =>
    IMPORT_EXPORT_COLUMNS.map((c) => {
      let v = row[c.key];
      if (c.key === "lastOrderDate" || c.key === "nextFollowUpDate") {
        v = v ? new Date(v).toISOString().slice(0, 10) : "";
      }
      return csvEscape(v);
    }).join(","),
  );
  return [header, ...lines].join("\n");
};

// Prefixing a UTF-8 BOM keeps ₹ / Indian-language characters intact
// when the file is opened directly in Excel on Windows.
const downloadCSV = (filename, csv) => {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Minimal RFC4180-style CSV parser — handles quoted fields with
// embedded commas, escaped quotes (""), and newlines inside quotes.
const parseCSV = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
};

const STATUS_STYLES = {
  Active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/25",
  Inactive: "bg-white/5 text-slate-400 ring-white/10",
  Blocked: "bg-red-500/10 text-red-400 ring-red-500/25",
};
// Bright "enamel chip" treatment for the selected segment in the
// quick status-toggle control (action card), matching the pattern
// used for FollowUpModal's channel/outcome buttons.
const STATUS_ACTIVE_STYLES = {
  Active: "bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/30",
  Inactive: "bg-slate-400 text-slate-950 shadow-md shadow-slate-500/30",
  Blocked: "bg-red-400 text-red-950 shadow-md shadow-red-500/30",
};
const TYPE_STYLES = {
  Distributor: "bg-blue-500/10 text-blue-400",
  Dealer: "bg-violet-500/10 text-violet-400",
  Manufacturer: "bg-orange-500/10 text-orange-400",
  Retail: "bg-teal-500/10 text-teal-400",
};
const BADGE_STYLES = {
  VIP: "bg-[#CC9A4E]/15 text-[#E8C077] ring-1 ring-[#CC9A4E]/30",
  "New Customer": "bg-blue-500/15 text-blue-300",
  "High Value": "bg-emerald-500/15 text-emerald-300",
  "Low Credit": "bg-orange-500/15 text-orange-300",
  Blacklisted: "bg-red-500/15 text-red-300",
};
const FOLLOWUP_STYLES = {
  today: {
    label: "Today",
    cls: "text-amber-400 bg-amber-500/10",
    icon: CalendarClock,
  },
  tomorrow: {
    label: "Tomorrow",
    cls: "text-blue-400 bg-blue-500/10",
    icon: Clock,
  },
  overdue: {
    label: "Overdue",
    cls: "text-red-400 bg-red-500/10",
    icon: AlertTriangle,
  },
  completed: {
    label: "Completed",
    cls: "text-emerald-400 bg-emerald-500/10",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    cls: "text-slate-500 bg-white/5",
    icon: Ban,
  },
  upcoming: {
    label: "Upcoming",
    cls: "text-slate-500 bg-white/5",
    icon: Clock,
  },
};

/* ────────────────────────────────────────────────────────────────
   SMALL PRIMITIVES
──────────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${status === "Active" ? "bg-emerald-400" : status === "Blocked" ? "bg-red-400" : "bg-slate-500"}`}
    />
    {status}
  </span>
);
const TypeChip = ({ type }) => (
  <span
    className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${TYPE_STYLES[type]}`}
  >
    {type}
  </span>
);
const Badges = ({ badges = [] }) => (
  <div className="flex flex-wrap gap-1">
    {badges.map((b) => (
      <span
        key={b}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BADGE_STYLES[b]}`}
      >
        {b === "VIP" && <Star size={9} className="fill-current" />}
        {b}
      </span>
    ))}
  </div>
);
const Avatar = ({ name, size = 36 }) => (
  <div
    style={{ width: size, height: size }}
    className="rounded-lg bg-gradient-to-br from-[#4C6FFF] to-[#1E3A8A] ring-1 ring-white/10 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-black/30"
  >
    {initialsOf(name)}
  </div>
);
const Toast = ({ message, type, onClose }) => (
  <div
    className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl shadow-black/50 ring-1 text-sm font-medium text-white ${type === "error" ? "bg-red-950/90 ring-red-500/30" : "bg-[var(--surface-2)] ring-white/10"}`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full shrink-0 ${type === "error" ? "bg-red-400" : "bg-emerald-400"}`}
    />
    {message}
    <button
      onClick={onClose}
      className="text-slate-400 hover:text-white transition-colors"
    >
      <X size={14} />
    </button>
  </div>
);

/* ────────────────────────────────────────────────────────────────
   STATS CARDS
──────────────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, gradient, glow, loading }) => (
  <div className="group relative overflow-hidden rounded-xl bg-[var(--surface)] ring-1 ring-white/10 hover:ring-white/20 shadow-lg shadow-black/40 transition-all duration-300 p-4">
    <div
      className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-xl ${gradient} transition-transform duration-500 group-hover:scale-125`}
    />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>
        {loading ? (
          <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
            {value}
          </p>
        )}
      </div>
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${gradient} ${glow}`}
      >
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const StatsRow = ({ stats, loading }) => {
  const cards = [
    {
      icon: Users,
      label: "Total Customers",
      value: stats?.totalCustomers ?? 0,
      gradient: "bg-blue-600",
      glow: "shadow-lg shadow-blue-600/30",
    },
    {
      icon: CheckCircle2,
      label: "Active Customers",
      value: stats?.activeCustomers ?? 0,
      gradient: "bg-emerald-600",
      glow: "shadow-lg shadow-emerald-600/30",
    },
    {
      icon: CalendarClock,
      label: "Pending Follow-ups",
      value: stats?.pendingFollowUps ?? 0,
      gradient: "bg-orange-500",
      glow: "shadow-lg shadow-orange-500/30",
    },
    {
      icon: IndianRupee,
      label: "Monthly Sales",
      value: inr(stats?.monthlySales),
      gradient: "bg-teal-600",
      glow: "shadow-lg shadow-teal-600/30",
    },
    {
      icon: Wallet,
      label: "Outstanding Payment",
      value: inr(stats?.outstandingPayment),
      gradient: "bg-red-500",
      glow: "shadow-lg shadow-red-500/30",
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} loading={loading} />
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   FILTER PANEL
──────────────────────────────────────────────────────────────── */
const FilterPanel = ({
  filters,
  setFilters,
  expanded,
  setExpanded,
  onReset,
  resultCount,
  viewMode,
  setViewMode,
}) => {
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const Select = ({ k, label, options }) => (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
        {label}
      </label>
      <select
        value={filters[k]}
        onChange={set(k)}
        style={{ colorScheme: "dark" }}
        className="w-full h-9 px-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
      >
        <option value="All">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <div className="rounded-xl bg-[var(--surface)]/70 backdrop-blur-sm ring-1 ring-white/10 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <FilterIcon size={15} className="text-blue-400" />
          Filters
          <span className="text-xs font-normal text-slate-500">
            · {resultCount} results
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/5 ring-1 ring-white/10">
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title="Card view"
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                viewMode === "cards"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            {expanded ? "Collapse" : "Advanced Filter"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={filters.search}
            onChange={set("search")}
            placeholder="Search by customer, company, phone, GST, email…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
          />
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 border-t border-white/10 pt-4">
          <Select k="type" label="Customer Type" options={TYPES} />
          <Select k="status" label="Status" options={STATUSES} />
          <Select k="category" label="Chemical Category" options={CATEGORIES} />
          <Select k="state" label="State" options={STATES} />
          <Select k="followUpStatus" label="Follow-up" options={FOLLOWUPS} />
          <div className="flex items-end">
            <button
              onClick={onReset}
              className="h-9 w-full px-4 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   ACTION POPUP — renders via portal so it's never clipped by the
   table's horizontal scroll container (the old anchored dropdown
   used to get cut off + show scrollbars inside the row)
──────────────────────────────────────────────────────────────── */
const ActionDropdown = ({
  customer,
  onView,
  onEdit,
  onDelete,
  onQuickFollowUp,
  onNotes,
  onStatusChange,
  onAssignSalesPerson,
}) => {
  const [open, setOpen] = useState(false);

  const actions = [
    { icon: Eye, label: "View", action: () => onView(customer) },
    { icon: Edit3, label: "Edit", action: () => onEdit(customer) },
    {
      icon: PhoneCall,
      label: "Follow-up",
      action: () => onQuickFollowUp(customer),
    },
    {
      icon: Users,
      label: "Assign",
      action: () => onAssignSalesPerson(customer),
    },
    { icon: StickyNote, label: "Notes", action: () => onNotes(customer) },
    {
      icon: Trash2,
      label: "Delete",
      danger: true,
      action: () => onDelete(customer),
    },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-slate-200 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-sm bg-[var(--surface-2)] ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-[popIn_.15s_ease-out]">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-[#182036] to-[#0F1420] px-5 py-4 text-white flex items-center gap-3 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                <Avatar name={customer.company} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">
                    {customer.company}
                  </p>
                  <p className="text-blue-300/80 text-[11px] font-mono">
                    {customer.customerId}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Quick status toggle */}
              <div className="px-4 pt-4 pb-3 border-b border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Status
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {STATUSES.map((s) => {
                    const active = customer.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          if (!active) onStatusChange(customer, s);
                          setOpen(false);
                        }}
                        className={`h-8 rounded-lg text-xs font-semibold transition-all ${
                          active
                            ? STATUS_ACTIVE_STYLES[s]
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions grid */}
              <div className="p-3 grid grid-cols-3 gap-1">
                {actions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      a.action?.();
                      setOpen(false);
                    }}
                    className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors ${
                      a.danger
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-slate-300 hover:bg-blue-500/10 hover:text-blue-300"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.danger ? "bg-red-500/10" : "bg-blue-500/10"}`}
                    >
                      <a.icon
                        size={16}
                        className={a.danger ? "text-red-400" : "text-blue-400"}
                      />
                    </div>
                    <span className="text-[10.5px] font-semibold text-center leading-tight">
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

/* ────────────────────────────────────────────────────────────────
   TABLE
──────────────────────────────────────────────────────────────── */
const COLUMNS = [
  { key: "customerId", label: "Customer ID" },
  { key: "company", label: "Company" },
  { key: "name", label: "Contact" },
  { key: "type", label: "Type" },
  { key: "city", label: "Location" },
  { key: "salesPerson", label: "Sales Person" },
  { key: "outstanding", label: "Outstanding" },
  { key: "creditLimit", label: "Credit Limit" },
  { key: "lastOrderDate", label: "Last Order" },
  { key: "followUpStatus", label: "Follow-up" },
  { key: "status", label: "Status" },
];

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: COLUMNS.length + 2 }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="h-3.5 bg-white/5 rounded w-full max-w-[100px]" />
      </td>
    ))}
  </tr>
);

const CustomerTable = ({
  rows,
  loading,
  selected,
  setSelected,
  sortKey,
  sortDir,
  onSort,
  onView,
  onEdit,
  onDelete,
  onQuickFollowUp,
  onNotes,
  onStatusChange,
  onAssignSalesPerson,
  onAddFirst,
}) => {
  const allChecked =
    rows.length > 0 && rows.every((r) => selected.includes(r._id));
  const toggleAll = () => setSelected(allChecked ? [] : rows.map((r) => r._id));
  const toggleOne = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const SortHeader = ({ col }) => (
    <th
      onClick={() => onSort(col.key)}
      className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-300 whitespace-nowrap transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {col.label}
        {sortKey === col.key ? (
          sortDir === "asc" ? (
            <ChevronUp size={12} className="text-blue-400" />
          ) : (
            <ChevronDown size={12} className="text-blue-400" />
          )
        ) : (
          <ArrowUpDown size={11} className="opacity-30" />
        )}
      </span>
    </th>
  );

  return (
    <div className="rounded-xl bg-[var(--surface)] ring-1 ring-white/10 shadow-lg shadow-black/30 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--surface-2)] border-b border-white/10">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="rounded border-white/20 bg-white/5 accent-blue-500 focus:ring-blue-500/40 focus:ring-offset-0"
                />
              </th>
              {COLUMNS.map((c) => (
                <SortHeader key={c.key} col={c} />
              ))}
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="py-16">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <PackageSearch size={26} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        No customers found
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Try adjusting your search or filters
                      </p>
                    </div>
                    <button
                      onClick={onAddFirst}
                      className="mt-1 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
                    >
                      + Add First Customer
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((c, i) => {
                const fu =
                  FOLLOWUP_STYLES[c.followUpStatus] || FOLLOWUP_STYLES.upcoming;
                return (
                  <tr
                    key={c._id}
                    className={`group hover:bg-blue-500/[0.06] transition-colors ${i % 2 === 1 ? "bg-white/[0.015]" : ""} ${selected.includes(c._id) ? "bg-blue-500/10" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(c._id)}
                        onChange={() => toggleOne(c._id)}
                        className="rounded border-white/20 bg-white/5 accent-blue-500 focus:ring-blue-500/40 focus:ring-offset-0"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {c.customerId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-[180px]">
                        <Avatar name={c.company} />
                        <div>
                          <button
                            onClick={() => onView(c)}
                            className="font-semibold text-slate-100 hover:text-blue-400 text-left leading-tight transition-colors"
                          >
                            {c.company}
                          </button>
                          <div className="mt-1">
                            <Badges badges={c.badges} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300 font-medium">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeChip type={c.type} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-500" />
                        {c.city}, {c.state}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {c.salesPerson?.name || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold font-mono ${c.outstanding > c.creditLimit ? "text-red-400" : c.outstanding > 0 ? "text-orange-400" : "text-slate-600"}`}
                      >
                        {inr(c.outstanding)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">
                      {inr(c.creditLimit)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {fmtDate(c.lastOrderDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${fu.cls}`}
                      >
                        <fu.icon size={11} />
                        {fu.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <ActionDropdown
                        customer={c}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onQuickFollowUp={onQuickFollowUp}
                        onNotes={onNotes}
                        onStatusChange={onStatusChange}
                        onAssignSalesPerson={onAssignSalesPerson}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   CUSTOMER CARDS — same data and actions as the table, laid out as
   a responsive card grid. Reuses ActionDropdown as-is (it's already
   portal-based, so it drops into a card with no changes) and shares
   `selected`/`setSelected` with the table so the BulkBar keeps
   working no matter which view is active.
──────────────────────────────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="rounded-xl bg-[var(--surface)] ring-1 ring-white/10 p-4 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-white/5 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-white/5 rounded w-2/3" />
        <div className="h-2.5 bg-white/5 rounded w-1/3" />
      </div>
    </div>
    <div className="h-2.5 bg-white/5 rounded w-full" />
    <div className="h-2.5 bg-white/5 rounded w-4/5" />
    <div className="grid grid-cols-2 gap-2 pt-1">
      <div className="h-10 bg-white/5 rounded-lg" />
      <div className="h-10 bg-white/5 rounded-lg" />
    </div>
  </div>
);

const CustomerCard = ({
  customer: c,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onQuickFollowUp,
  onNotes,
  onStatusChange,
  onAssignSalesPerson,
}) => {
  const fu = FOLLOWUP_STYLES[c.followUpStatus] || FOLLOWUP_STYLES.upcoming;
  return (
    <div
      className={`group relative rounded-xl p-4 flex flex-col gap-3 shadow-lg shadow-black/30 transition-all duration-200 ${
        selected
          ? "bg-blue-500/[0.06] ring-1 ring-blue-500/50"
          : "bg-[var(--surface)] ring-1 ring-white/10 hover:ring-white/20"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(c._id)}
          className="mt-2 rounded border-white/20 bg-white/5 accent-blue-500 focus:ring-blue-500/40 focus:ring-offset-0 shrink-0"
        />
        <Avatar name={c.company} />
        <div className="min-w-0 flex-1 pt-0.5">
          <button
            onClick={() => onView(c)}
            className="font-semibold text-slate-100 hover:text-blue-400 text-left leading-tight block w-full truncate transition-colors"
          >
            {c.company}
          </button>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            {c.customerId}
          </p>
        </div>
        <div className="shrink-0 -mr-1.5 -mt-1">
          <ActionDropdown
            customer={c}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onQuickFollowUp={onQuickFollowUp}
            onNotes={onNotes}
            onStatusChange={onStatusChange}
            onAssignSalesPerson={onAssignSalesPerson}
          />
        </div>
      </div>

      {c.badges?.length > 0 && <Badges badges={c.badges} />}

      <div className="flex items-center gap-1.5 flex-wrap">
        <TypeChip type={c.type} />
        <StatusBadge status={c.status} />
      </div>

      <div className="h-px bg-white/5" />

      {/* Contact + location */}
      <div className="space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-2 min-w-0">
          <User size={12} className="text-slate-500 shrink-0" />
          <span className="text-slate-300 font-medium truncate">{c.name}</span>
          <span className="text-slate-600 shrink-0">·</span>
          <span className="truncate">{c.phone}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={12} className="text-slate-500 shrink-0" />
          <span className="truncate">
            {c.city}, {c.state}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Factory size={12} className="text-slate-500 shrink-0" />
          <span className="truncate">
            {c.salesPerson?.name || "Unassigned"}
          </span>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Financials */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2.5 py-2">
          <p className="text-[9px] font-semibold text-slate-500 uppercase mb-0.5">
            Credit Limit
          </p>
          <p className="text-sm font-bold font-mono text-slate-200">
            {inr(c.creditLimit)}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2.5 py-2">
          <p className="text-[9px] font-semibold text-slate-500 uppercase mb-0.5">
            Outstanding
          </p>
          <p
            className={`text-sm font-bold font-mono ${c.outstanding > c.creditLimit ? "text-red-400" : c.outstanding > 0 ? "text-orange-400" : "text-slate-600"}`}
          >
            {inr(c.outstanding)}
          </p>
        </div>
      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shrink-0 ${fu.cls}`}
        >
          <fu.icon size={11} />
          {fu.label}
        </span>
        <span className="text-[10px] text-slate-500 truncate">
          Last order {fmtDate(c.lastOrderDate)}
        </span>
      </div>
    </div>
  );
};

const CustomerCardGrid = ({
  rows,
  loading,
  selected,
  setSelected,
  onView,
  onEdit,
  onDelete,
  onQuickFollowUp,
  onNotes,
  onStatusChange,
  onAssignSalesPerson,
  onAddFirst,
}) => {
  const toggleOne = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl bg-[var(--surface)] ring-1 ring-white/10 shadow-lg shadow-black/30 py-16">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
            <PackageSearch size={26} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              No customers found
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Try adjusting your search or filters
            </p>
          </div>
          <button
            onClick={onAddFirst}
            className="mt-1 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
          >
            + Add First Customer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rows.map((c) => (
        <CustomerCard
          key={c._id}
          customer={c}
          selected={selected.includes(c._id)}
          onToggleSelect={toggleOne}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onQuickFollowUp={onQuickFollowUp}
          onNotes={onNotes}
          onStatusChange={onStatusChange}
          onAssignSalesPerson={onAssignSalesPerson}
        />
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   PAGINATION
──────────────────────────────────────────────────────────────── */
const Pagination = ({ page, setPage, totalPages, total, pageSize }) => (
  <div className="flex items-center justify-between px-1 py-3 text-sm text-slate-500">
    <span>
      Showing{" "}
      <span className="font-semibold text-slate-300 font-mono">
        {Math.min((page - 1) * pageSize + 1, total)}–
        {Math.min(page * pageSize, total)}
      </span>{" "}
      of <span className="font-semibold text-slate-300 font-mono">{total}</span>{" "}
      customers
    </span>
    <div className="flex items-center gap-1">
      <button
        disabled={page === 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5 transition-colors"
      >
        <ChevronLeft size={15} />
      </button>
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          onClick={() => setPage(i + 1)}
          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${page === i + 1 ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "border border-white/10 text-slate-400 hover:bg-white/5"}`}
        >
          {i + 1}
        </button>
      ))}
      <button
        disabled={page === totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5 transition-colors"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────
   QUICK VIEW DRAWER (fetches fresh detail incl. timeline)
──────────────────────────────────────────────────────────────── */
const QuickViewDrawer = ({ customerId, onClose, onFollowUpAdded }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    fetchCustomerById(customerId)
      .then((res) => setCustomer(res.customer))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, [customerId]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res = await addTimelineEntry(customerId, {
        type: "Note",
        note: noteText.trim(),
      });
      setCustomer(res.customer);
      setNoteText("");
      onFollowUpAdded?.();
    } finally {
      setSaving(false);
    }
  };

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[420px] bg-[var(--surface)] h-full shadow-2xl shadow-black/60 flex flex-col animate-[slideIn_.25s_ease-out]">
        {loading || !customer ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden bg-gradient-to-br from-[#182036] to-[#0F1420] px-5 pt-5 pb-6 text-white">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3">
                <Avatar name={customer.company} size={52} />
                <div>
                  <p className="font-bold text-lg leading-tight">
                    {customer.company}
                  </p>
                  <p className="text-blue-300/80 text-xs mt-1">
                    {customer.name} · {customer.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <StatusBadge status={customer.status} />
                <Badges badges={customer.badges} />
              </div>
            </div>

            <div className="flex gap-2 px-5 py-3 border-b border-white/10">
              {[
                { icon: Phone, label: "Call", href: `tel:${customer.phone}` },
                {
                  icon: MessageCircle,
                  label: "WhatsApp",
                  href: `https://wa.me/${(customer.phone || "").replace(/\D/g, "")}`,
                },
                {
                  icon: Mail,
                  label: "Email",
                  href: `mailto:${customer.email || ""}`,
                },
              ].map((b) => (
                <a
                  key={b.label}
                  href={b.href}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                >
                  <b.icon size={16} />
                  <span className="text-[10px] font-semibold">{b.label}</span>
                </a>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Credit Limit",
                    value: inr(customer.creditLimit),
                    icon: CreditCard,
                    color: "text-blue-400",
                  },
                  {
                    label: "Outstanding",
                    value: inr(customer.outstanding),
                    icon: Wallet,
                    color:
                      customer.outstanding > customer.creditLimit
                        ? "text-red-400"
                        : "text-orange-400",
                  },
                  {
                    label: "Last Order",
                    value: fmtDate(customer.lastOrderDate),
                    icon: ShoppingCart,
                    color: "text-slate-200",
                  },
                  {
                    label: "Next Follow-up",
                    value: fmtDate(customer.nextFollowUpDate),
                    icon: CalendarClock,
                    color: "text-slate-200",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg bg-white/5 ring-1 ring-white/10 p-3"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      <s.icon size={11} /> {s.label}
                    </div>
                    <div className={`text-sm font-bold font-mono ${s.color}`}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Company Details
                </p>
                <div className="space-y-2 text-sm">
                  {[
                    {
                      icon: Building2,
                      label: "GST",
                      value: customer.gst || "—",
                      mono: true,
                    },
                    {
                      icon: FileText,
                      label: "PAN",
                      value: customer.pan || "—",
                      mono: true,
                    },
                    {
                      icon: MapPin,
                      label: "Address",
                      value: `${customer.city}, ${customer.state}`,
                    },
                    {
                      icon: Phone,
                      label: "Phone",
                      value: customer.phone,
                      mono: true,
                    },
                    {
                      icon: Mail,
                      label: "Email",
                      value: customer.email || "—",
                    },
                    {
                      icon: Beaker,
                      label: "Category",
                      value: customer.category,
                    },
                    {
                      icon: Factory,
                      label: "Sales Person",
                      value: customer.salesPerson?.name || "Unassigned",
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center gap-2.5 text-slate-400"
                    >
                      <r.icon size={13} className="text-slate-500 shrink-0" />
                      <span className="text-slate-500 w-20 shrink-0">
                        {r.label}
                      </span>
                      <span
                        className={`font-medium text-slate-200 truncate ${r.mono ? "font-mono text-xs" : ""}`}
                      >
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Recent Activity ({customer.timeline?.length || 0})
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a quick note…"
                    className="flex-1 h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={saving}
                    className="h-9 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
                <div className="relative pl-5 space-y-4">
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />
                  {(customer.timeline || []).map((t, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/15" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">
                          {t.type}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {fmtDate(t.date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{t.note}</p>
                    </div>
                  ))}
                  {(!customer.timeline || customer.timeline.length === 0) && (
                    <p className="text-xs text-slate-500">
                      No activity logged yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   CUSTOMER NOTES MODAL
   Dedicated notes log per customer. Reuses the exact same
   fetchCustomerById + addTimelineEntry({ type: "Note" }) contract
   that already works inside QuickViewDrawer, so notes save through
   the existing backend with zero new API endpoints required.
──────────────────────────────────────────────────────────────── */
const CustomerNotesModal = ({ customerId, onClose, onNoteAdded }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    setError("");
    fetchCustomerById(customerId)
      .then((res) => setCustomer(res.customer))
      .catch(() => setError("Could not load notes for this customer."))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (!customerId) return null;

  const notes = (customer?.timeline || [])
    .filter((t) => t.type === "Note")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAdd = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await addTimelineEntry(customerId, {
        type: "Note",
        note: noteText.trim(),
      });
      setCustomer(res.customer);
      setNoteText("");
      onNoteAdded?.();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not save note. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[var(--surface)] ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 max-h-[85vh] overflow-hidden flex flex-col animate-[popIn_.2s_ease-out]">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#182036] to-[#0F1420] px-6 py-5 text-white shrink-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
              <StickyNote size={18} className="text-blue-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg leading-tight">Notes</h2>
              <p className="text-blue-300/80 text-xs mt-0.5 truncate">
                {customer?.company || "Loading…"}
              </p>
            </div>
          </div>
        </div>

        {/* Add note box */}
        <div className="px-6 pt-5 pb-4 border-b border-white/10 shrink-0">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a note about this customer…"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-600 text-sm resize-none transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/[0.07]"
          />
          {error && (
            <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
              <AlertTriangle size={11} /> {error}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-500">
              ⌘ / Ctrl + Enter to save
            </span>
            <button
              onClick={handleAdd}
              disabled={saving || !noteText.trim()}
              className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1.5 transition-colors shrink-0"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              Add Note
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-500" size={22} />
            </div>
          ) : !customer ? (
            <div className="text-center py-10">
              <AlertTriangle
                size={22}
                className="mx-auto text-red-400/70 mb-2"
              />
              <p className="text-sm text-slate-500">
                {error || "Could not load notes."}
              </p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-10">
              <StickyNote size={26} className="mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">
                No notes yet for this customer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((n, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                      Note
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {fmtDate(n.date)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {n.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   FOLLOW-UP MODAL — pro-level quick call/visit logging
   Lets a sales rep log a follow-up outcome in a couple of taps
   (type + outcome chips + optional note), schedule the next
   reminder, and see the last few follow-ups for context — all
   without leaving the modal. Reuses the same
   fetchCustomerById + addTimelineEntry({ type: "Follow-up" })
   contract, plus updateCustomer for scheduling the next date.
──────────────────────────────────────────────────────────────── */
const FOLLOWUP_CHANNELS = [
  { id: "Call", icon: Phone },
  { id: "WhatsApp", icon: MessageCircle },
  { id: "Email", icon: Mail },
  { id: "Meeting", icon: Users },
  { id: "Visit", icon: MapPin },
];

const OUTCOME_OPTIONS = [
  {
    label: "Interested",
    icon: CheckCircle2,
    idle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    active:
      "bg-emerald-400 text-emerald-950 border-emerald-400 shadow-md shadow-emerald-500/30",
  },
  {
    label: "Order Placed",
    icon: ShoppingCart,
    idle: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    active:
      "bg-blue-400 text-blue-950 border-blue-400 shadow-md shadow-blue-500/30",
  },
  {
    label: "Callback Later",
    icon: Clock,
    idle: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    active:
      "bg-amber-400 text-amber-950 border-amber-400 shadow-md shadow-amber-500/30",
  },
  {
    label: "Not Reachable",
    icon: Ban,
    idle: "bg-white/5 text-slate-400 border-white/10",
    active:
      "bg-slate-400 text-slate-950 border-slate-400 shadow-md shadow-slate-500/30",
  },
  {
    label: "Not Interested",
    icon: X,
    idle: "bg-red-500/10 text-red-400 border-red-500/20",
    active:
      "bg-red-400 text-red-950 border-red-400 shadow-md shadow-red-500/30",
  },
];

const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const QUICK_SCHEDULE = [
  { label: "Tomorrow", value: () => addDaysISO(1) },
  { label: "3 days", value: () => addDaysISO(3) },
  { label: "1 week", value: () => addDaysISO(7) },
];

const FollowUpModal = ({ customer, open, onClose, onSaved }) => {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [channel, setChannel] = useState("Call");
  const [outcome, setOutcome] = useState(null);
  const [note, setNote] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !customer?._id) return;
    setChannel("Call");
    setOutcome(null);
    setNote("");
    setNextDate("");
    setError("");
    setLoadingDetail(true);
    fetchCustomerById(customer._id)
      .then((res) => setDetail(res.customer))
      .catch(() => setDetail(customer))
      .finally(() => setLoadingDetail(false));
  }, [open, customer]);

  if (!open || !customer) return null;

  const history = (detail?.timeline || [])
    .filter((t) => t.type === "Follow-up")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  const handleSubmit = async () => {
    if (!outcome && !note.trim()) {
      setError("Pick an outcome or add a note before logging.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const summary = [outcome, note.trim()].filter(Boolean).join(" — ");
      const res = await addTimelineEntry(customer._id, {
        type: "Follow-up",
        note: `[${channel}] ${summary}`,
      });
      let updatedCustomer = res.customer;
      if (nextDate) {
        // Partial update — assumes the backend's update route merges
        // fields via findByIdAndUpdate rather than requiring a full payload.
        const res2 = await updateCustomer(customer._id, {
          nextFollowUpDate: nextDate,
        });
        updatedCustomer = res2.customer || updatedCustomer;
      }
      onSaved(updatedCustomer);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save the follow-up. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[var(--surface)] ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 max-h-[92vh] overflow-hidden flex flex-col animate-[popIn_.2s_ease-out]">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#4A2E12] via-[#3A2410] to-[#241505] px-6 pt-6 pb-5 text-white shrink-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
                <PhoneCall size={18} className="text-amber-300" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg leading-tight truncate">
                  {customer.company}
                </h2>
                <p className="text-amber-200/70 text-xs mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono">{customer.customerId}</span>
                  <span>·</span>
                  <span>{customer.name}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick contact actions */}
          <div className="relative flex gap-2 mt-4">
            <a
              href={`tel:${customer.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              <Phone size={13} /> Call
            </a>
            <a
              href={`https://wa.me/${(customer.phone || "").replace(/\D/g, "")}`}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
            {detail?.nextFollowUpDate && (
              <div className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/5 text-xs font-medium">
                <CalendarClock size={13} /> Due{" "}
                {fmtDate(detail.nextFollowUpDate)}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-[var(--surface)]">
          {/* Channel */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              How did you connect?
            </p>
            <div className="flex gap-2">
              {FOLLOWUP_CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannel(c.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-semibold transition-all ${
                    channel === c.id
                      ? "bg-amber-400 border-amber-400 text-amber-950 shadow-md shadow-amber-500/30"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <c.icon size={15} />
                  {c.id}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              Outcome
            </p>
            <div className="flex flex-wrap gap-2">
              {OUTCOME_OPTIONS.map((o) => {
                const active = outcome === o.label;
                return (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => setOutcome(active ? null : o.label)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${active ? o.active : o.idle}`}
                  >
                    <o.icon size={13} />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              Notes{" "}
              <span className="font-normal normal-case text-slate-600">
                (optional)
              </span>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was discussed? Any details worth remembering…"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-600 text-sm resize-none transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50"
            />
          </div>

          {/* Schedule next follow-up */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              Schedule next follow-up{" "}
              <span className="font-normal normal-case text-slate-600">
                (optional)
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_SCHEDULE.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setNextDate(q.value())}
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                    nextDate === q.value()
                      ? "bg-amber-400 border-amber-400 text-amber-950"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {q.label}
                </button>
              ))}
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50"
              />
              {nextDate && (
                <button
                  type="button"
                  onClick={() => setNextDate("")}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Recent history */}
          {!loadingDetail && history.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                Recent follow-ups
              </p>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-2.5"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <PhoneCall size={11} className="text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400 leading-snug">
                        {h.note}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {fmtDate(h.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {error && (
          <p className="px-6 text-xs text-red-400 flex items-center gap-1.5 pb-1 pt-2 shrink-0">
            <AlertTriangle size={12} /> {error}
          </p>
        )}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-white/10 bg-[var(--surface)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-11 px-5 rounded-xl bg-amber-500 text-amber-950 text-sm font-bold hover:bg-amber-400 shadow-md shadow-amber-500/25 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Log Follow-up
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   ASSIGN SALES PERSON MODAL — used both for a single customer (from
   the action card) and for bulk assignment (from the selection bar),
   so it takes an array of customerIds either way and always calls
   the same bulkAssignSalesPerson(ids, salesPersonId) endpoint.
   There's no "list all sales persons" endpoint available, so the
   quick-pick list is built client-side from sales persons already
   seen on loaded customers this session — the manual ID field is the
   fallback for anyone not in that list yet.
──────────────────────────────────────────────────────────────── */
const AssignSalesPersonModal = ({
  open,
  onClose,
  onSaved,
  customerIds,
  title,
  subtitle,
  knownSalesPersons,
}) => {
  const [salesPersonId, setSalesPersonId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSalesPersonId("");
      setError("");
    }
  }, [open, customerIds]);

  if (!open || !customerIds?.length) return null;

  const handleSubmit = async () => {
    if (!salesPersonId.trim()) {
      setError("Pick or enter a sales person to assign.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await bulkAssignSalesPerson(customerIds, salesPersonId.trim());
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not assign the sales person. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[var(--surface)] ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 max-h-[85vh] overflow-hidden flex flex-col animate-[popIn_.2s_ease-out]">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#241b3d] via-[#1c1530] to-[#100c1c] px-6 py-5 text-white shrink-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
              <Users size={18} className="text-violet-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg leading-tight">
                Assign Sales Person
              </h2>
              <p className="text-violet-300/70 text-xs mt-0.5 truncate">
                {title}
                {subtitle ? ` · ${subtitle}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {knownSalesPersons?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                Recently seen
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {knownSalesPersons.map((sp) => {
                  const active = salesPersonId === sp._id;
                  return (
                    <button
                      key={sp._id}
                      type="button"
                      onClick={() => setSalesPersonId(sp._id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-left ${
                        active
                          ? "bg-violet-500/15 border-violet-500/40"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {initialsOf(sp.name)}
                      </div>
                      <span
                        className={`text-sm font-medium truncate ${active ? "text-violet-300" : "text-slate-300"}`}
                      >
                        {sp.name}
                      </span>
                      {active && (
                        <Check
                          size={14}
                          className="text-violet-400 ml-auto shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              {knownSalesPersons?.length > 0
                ? "Or enter Sales Person ID"
                : "Sales Person ID"}
            </p>
            <input
              value={salesPersonId}
              onChange={(e) => setSalesPersonId(e.target.value)}
              placeholder="Paste the sales person's user ID"
              className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-600 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/50"
            />
            {error && (
              <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={11} /> {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-white/10 bg-[var(--surface)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 shadow-md shadow-violet-600/25 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   ADD / EDIT CUSTOMER — PREMIUM 3-STEP WIZARD
──────────────────────────────────────────────────────────────── */
const emptyForm = {
  company: "",
  name: "",
  phone: "",
  email: "",
  gst: "",
  pan: "",
  city: "",
  state: STATES[0],
  type: TYPES[0],
  category: CATEGORIES[0],
  status: "Active",
  creditLimit: "",
  outstanding: "",
  nextFollowUpDate: "",
};

const WIZARD_STEPS = [
  { id: 1, label: "Basic Info", sub: "Who they are", icon: User },
  { id: 2, label: "Classification", sub: "Where & what", icon: Layers },
  { id: 3, label: "Financials", sub: "Money & compliance", icon: ShieldCheck },
];

const REQUIRED_BY_STEP = {
  1: ["company", "name", "phone"],
  2: ["city", "state", "type", "category"],
  3: [],
};

// Premium floating-icon input
const FloatField = ({
  label,
  k,
  value,
  onChange,
  icon: Icon,
  type = "text",
  required,
  error,
  placeholder,
  hint,
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 tracking-wide">
      {label}
      {required && <span className="text-blue-400"> *</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        style={type === "date" ? { colorScheme: "dark" } : undefined}
        className={`w-full h-11 ${Icon ? "pl-9" : "pl-3.5"} pr-3.5 rounded-xl border text-sm bg-white/5 text-slate-100 placeholder:text-slate-600 transition-all
          focus:outline-none focus:ring-4 focus:bg-white/[0.07]
          ${error ? "border-red-500/40 focus:ring-red-500/10 focus:border-red-500/60" : "border-white/10 focus:ring-blue-500/10 focus:border-blue-500/50"}`}
      />
    </div>
    {hint && !error && (
      <p className="text-[10px] text-slate-500 mt-1">{hint}</p>
    )}
    {error && (
      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
        <AlertTriangle size={10} /> {error}
      </p>
    )}
  </div>
);

const FloatSelect = ({
  label,
  k,
  value,
  onChange,
  icon: Icon,
  options,
  required,
  error,
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 tracking-wide">
      {label}
      {required && <span className="text-blue-400"> *</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10"
        />
      )}
      <select
        value={value}
        onChange={onChange}
        style={{ colorScheme: "dark" }}
        className={`w-full h-11 ${Icon ? "pl-9" : "pl-3.5"} pr-8 rounded-xl border text-sm bg-white/5 text-slate-100 appearance-none transition-all
          focus:outline-none focus:ring-4 focus:bg-white/[0.07]
          ${error ? "border-red-500/40 focus:ring-red-500/10" : "border-white/10 focus:ring-blue-500/10 focus:border-blue-500/50"}`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
      />
    </div>
  </div>
);

const AddCustomerModal = ({ open, onClose, onSaved }) => {
  const initial = null;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              ...emptyForm,
              ...initial,
              nextFollowUpDate: initial.nextFollowUpDate
                ? initial.nextFollowUpDate.slice(0, 10)
                : "",
            }
          : emptyForm,
      );
      setStep(1);
      setError("");
      setFieldErrors({});
    }
  }, [open, initial]);

  if (!open) return null;

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (fieldErrors[k]) setFieldErrors((fe) => ({ ...fe, [k]: null }));
  };

  const validateStep = (s) => {
    const missing = {};
    REQUIRED_BY_STEP[s].forEach((k) => {
      if (!String(form[k] || "").trim()) missing[k] = "Required";
    });
    if (s === 1 && form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      missing.email = "Invalid email format";
    if (s === 1 && form.phone && form.phone.replace(/\D/g, "").length < 10)
      missing.phone = "Enter a valid phone number";
    setFieldErrors(missing);
    return Object.keys(missing).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setDirection("forward");
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => {
    setDirection("back");
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        creditLimit: Number(form.creditLimit) || 0,
        outstanding: Number(form.outstanding) || 0,
      };
      if (initial?._id) await updateCustomer(initial._id, payload);
      else await createCustomer(payload);
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const progressPct = ((step - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl bg-[var(--surface)] ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 max-h-[92vh] overflow-hidden flex flex-col animate-[popIn_.2s_ease-out]"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#182036] via-[#131a2c] to-[#0F1420] px-6 pt-6 pb-8 text-white shrink-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="absolute top-8 right-16 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                {form.company ? (
                  <span className="font-bold text-sm">
                    {initialsOf(form.company)}
                  </span>
                ) : (
                  <Sparkles size={18} className="text-blue-300" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">
                  {initial ? "Edit Customer" : "Add New Customer"}
                </h2>
                <p className="text-blue-300/80 text-xs mt-0.5">
                  {WIZARD_STEPS[step - 1].sub}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="relative flex items-center gap-2 mt-6">
            {WIZARD_STEPS.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step > s.id
                        ? "bg-emerald-400 text-emerald-900"
                        : step === s.id
                          ? "bg-white text-blue-700 ring-4 ring-white/25"
                          : "bg-white/15 text-white/60"
                    }`}
                  >
                    {step > s.id ? <Check size={14} /> : <s.icon size={13} />}
                  </div>
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wide hidden sm:block ${step === s.id ? "text-white" : "text-blue-200"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className="flex-1 h-[2px] mx-1.5 rounded-full bg-white/15 overflow-hidden -mt-4">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500 ease-out"
                      style={{ width: step > s.id ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6" key={step}>
          <div className="animate-[fadeSlide_.25s_ease-out] space-y-4">
            {step === 1 && (
              <>
                <FloatField
                  label="Company Name"
                  k="company"
                  icon={Building2}
                  required
                  value={form.company}
                  onChange={set("company")}
                  error={fieldErrors.company}
                  placeholder="e.g. Rajesh Fabrics Pvt Ltd"
                />
                <div className="grid grid-cols-2 gap-3">
                  <FloatField
                    label="Contact Person"
                    k="name"
                    icon={User}
                    required
                    value={form.name}
                    onChange={set("name")}
                    error={fieldErrors.name}
                    placeholder="e.g. Rajesh Sharma"
                  />
                  <FloatField
                    label="Phone"
                    k="phone"
                    icon={Phone}
                    required
                    value={form.phone}
                    onChange={set("phone")}
                    error={fieldErrors.phone}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <FloatField
                  label="Email"
                  k="email"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  error={fieldErrors.email}
                  placeholder="name@company.com"
                  hint="Optional, used for quotations & invoices"
                />
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FloatField
                    label="City"
                    k="city"
                    icon={MapPin}
                    required
                    value={form.city}
                    onChange={set("city")}
                    error={fieldErrors.city}
                    placeholder="e.g. Surat"
                  />
                  <FloatSelect
                    label="State"
                    k="state"
                    icon={MapPin}
                    required
                    options={STATES}
                    value={form.state}
                    onChange={set("state")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FloatSelect
                    label="Customer Type"
                    k="type"
                    icon={Factory}
                    required
                    options={TYPES}
                    value={form.type}
                    onChange={set("type")}
                  />
                  <FloatSelect
                    label="Chemical Category"
                    k="category"
                    icon={Beaker}
                    required
                    options={CATEGORIES}
                    value={form.category}
                    onChange={set("category")}
                  />
                </div>
                <FloatSelect
                  label="Status"
                  k="status"
                  icon={CheckCircle2}
                  options={STATUSES}
                  value={form.status}
                  onChange={set("status")}
                />
              </>
            )}

            {step === 3 && (
              <>
                <div className="rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20 px-4 py-3 flex items-start gap-2.5">
                  <ShieldCheck
                    size={16}
                    className="text-blue-400 shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    GST & PAN are optional at creation but recommended before
                    the first invoice is raised.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FloatField
                    label="GST Number"
                    k="gst"
                    icon={Building2}
                    value={form.gst}
                    onChange={set("gst")}
                    placeholder="27ABCDE1234F1Z5"
                  />
                  <FloatField
                    label="PAN"
                    k="pan"
                    icon={FileText}
                    value={form.pan}
                    onChange={set("pan")}
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FloatField
                    label="Credit Limit (₹)"
                    k="creditLimit"
                    icon={CreditCard}
                    type="number"
                    value={form.creditLimit}
                    onChange={set("creditLimit")}
                    placeholder="0"
                  />
                  <FloatField
                    label="Outstanding (₹)"
                    k="outstanding"
                    icon={Wallet}
                    type="number"
                    value={form.outstanding}
                    onChange={set("outstanding")}
                    placeholder="0"
                  />
                </div>
                <FloatField
                  label="Next Follow-up Date"
                  k="nextFollowUpDate"
                  icon={CalendarClock}
                  type="date"
                  value={form.nextFollowUpDate}
                  onChange={set("nextFollowUpDate")}
                />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {error && (
          <p className="px-6 text-xs text-red-400 flex items-center gap-1.5 pb-1">
            <AlertTriangle size={12} /> {error}
          </p>
        )}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-white/10 bg-[var(--surface)] shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 hover:bg-white/10 flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft size={15} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          )}
          <div className="flex-1" />
          <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Step {step} of {WIZARD_STEPS.length}
          </span>
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-colors"
            >
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 shadow-md shadow-emerald-600/25 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              {initial ? "Save Changes" : "Create Customer"}
            </button>
          )}
        </div>
      </form>
      <style>{`
        @keyframes popIn { from { opacity: 0; transform: scale(.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   EDIT CUSTOMER — PREMIUM TABBED POPUP
   (unlike Add, editing jumps freely between sections instead of
   stepping linearly — all fields already exist, so tabs > wizard)
──────────────────────────────────────────────────────────────── */
const EDIT_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "location", label: "Location & Type", icon: MapPin },
  { id: "financials", label: "Financials", icon: ShieldCheck },
  { id: "badges", label: "Badges", icon: Tag },
];

const ALL_BADGES = [
  "VIP",
  "New Customer",
  "High Value",
  "Low Credit",
  "Blacklisted",
];

const EditCustomerModal = ({ open, customer, onClose, onSaved }) => {
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open && customer) {
      const shaped = {
        company: customer.company || "",
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        gst: customer.gst || "",
        pan: customer.pan || "",
        city: customer.city || "",
        state: customer.state || STATES[0],
        type: customer.type || TYPES[0],
        category: customer.category || CATEGORIES[0],
        status: customer.status || "Active",
        creditLimit: customer.creditLimit ?? "",
        outstanding: customer.outstanding ?? "",
        nextFollowUpDate: customer.nextFollowUpDate
          ? customer.nextFollowUpDate.slice(0, 10)
          : "",
        badges: customer.badges || [],
      };
      setForm(shaped);
      setInitialSnapshot(JSON.stringify(shaped));
      setTab("profile");
      setError("");
      setFieldErrors({});
    }
  }, [open, customer]);

  if (!open || !form) return null;

  const isDirty = JSON.stringify(form) !== initialSnapshot;

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (fieldErrors[k]) setFieldErrors((fe) => ({ ...fe, [k]: null }));
  };

  const toggleBadge = (b) =>
    setForm((f) => ({
      ...f,
      badges: f.badges.includes(b)
        ? f.badges.filter((x) => x !== b)
        : [...f.badges, b],
    }));

  const validate = () => {
    const missing = {};
    ["company", "name", "phone", "city", "state", "type", "category"].forEach(
      (k) => {
        if (!String(form[k] || "").trim()) missing[k] = "Required";
      },
    );
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      missing.email = "Invalid email format";
    if (form.phone && form.phone.replace(/\D/g, "").length < 10)
      missing.phone = "Enter a valid phone number";
    setFieldErrors(missing);
    if (Object.keys(missing).length) {
      // jump to the tab holding the first error
      if (missing.company || missing.name || missing.phone || missing.email)
        setTab("profile");
      else if (
        missing.city ||
        missing.state ||
        missing.type ||
        missing.category
      )
        setTab("location");
    }
    return Object.keys(missing).length === 0;
  };

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        creditLimit: Number(form.creditLimit) || 0,
        outstanding: Number(form.outstanding) || 0,
      };
      await updateCustomer(customer._id, payload);
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const ytdPct =
    form.creditLimit > 0
      ? Math.min(
          100,
          Math.round(
            (Number(form.outstanding) / Number(form.creditLimit)) * 100,
          ),
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl bg-[var(--surface)] ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/60 max-h-[92vh] overflow-hidden flex flex-col animate-[popIn_.2s_ease-out]"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#182036] via-[#131a2c] to-[#0F1420] px-6 pt-6 pb-5 text-white shrink-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
                <span className="font-bold text-sm">
                  {initialsOf(form.company)}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg leading-tight truncate">
                  {form.company || "Edit Customer"}
                </h2>
                <p className="text-blue-300/80 text-xs mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono">{customer.customerId}</span>
                  <span>·</span>
                  <span>{form.name}</span>
                  {isDirty && (
                    <span className="ml-1 inline-flex items-center gap-1 text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />{" "}
                      Unsaved
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick glance stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-2">
              <p className="text-[9px] text-blue-300/70 uppercase font-semibold">
                Credit Limit
              </p>
              <p className="text-sm font-bold font-mono">
                {inr(Number(form.creditLimit) || 0)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-2">
              <p className="text-[9px] text-blue-300/70 uppercase font-semibold">
                Outstanding
              </p>
              <p
                className={`text-sm font-bold font-mono ${ytdPct >= 90 ? "text-red-300" : "text-white"}`}
              >
                {inr(Number(form.outstanding) || 0)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-2">
              <p className="text-[9px] text-blue-300/70 uppercase font-semibold">
                Status
              </p>
              <p className="text-sm font-bold">{form.status}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-5 overflow-x-auto">
            {EDIT_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-[var(--surface)] text-blue-400"
                    : "bg-white/5 text-blue-200/70 hover:bg-white/10"
                }`}
              >
                <t.icon size={13} />
                {t.label}
                {t.id === "badges" && form.badges.length > 0 && (
                  <span
                    className={`ml-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center ${tab === t.id ? "bg-blue-500/20 text-blue-400" : "bg-white/15 text-white"}`}
                  >
                    {form.badges.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-[var(--surface)]">
          <div key={tab} className="animate-[fadeSlide_.2s_ease-out] space-y-4">
            {tab === "profile" && (
              <>
                <FloatField
                  label="Company Name"
                  k="company"
                  icon={Building2}
                  required
                  value={form.company}
                  onChange={set("company")}
                  error={fieldErrors.company}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FloatField
                    label="Contact Person"
                    k="name"
                    icon={User}
                    required
                    value={form.name}
                    onChange={set("name")}
                    error={fieldErrors.name}
                  />
                  <FloatField
                    label="Phone"
                    k="phone"
                    icon={Phone}
                    required
                    value={form.phone}
                    onChange={set("phone")}
                    error={fieldErrors.phone}
                  />
                </div>
                <FloatField
                  label="Email"
                  k="email"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  error={fieldErrors.email}
                  hint="Used for quotations & invoices"
                />
              </>
            )}

            {tab === "location" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FloatField
                    label="City"
                    k="city"
                    icon={MapPin}
                    required
                    value={form.city}
                    onChange={set("city")}
                    error={fieldErrors.city}
                  />
                  <FloatSelect
                    label="State"
                    k="state"
                    icon={MapPin}
                    required
                    options={STATES}
                    value={form.state}
                    onChange={set("state")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FloatSelect
                    label="Customer Type"
                    k="type"
                    icon={Factory}
                    required
                    options={TYPES}
                    value={form.type}
                    onChange={set("type")}
                  />
                  <FloatSelect
                    label="Chemical Category"
                    k="category"
                    icon={Beaker}
                    required
                    options={CATEGORIES}
                    value={form.category}
                    onChange={set("category")}
                  />
                </div>
                <FloatSelect
                  label="Status"
                  k="status"
                  icon={CheckCircle2}
                  options={STATUSES}
                  value={form.status}
                  onChange={set("status")}
                />
              </>
            )}

            {tab === "financials" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FloatField
                    label="GST Number"
                    k="gst"
                    icon={Building2}
                    value={form.gst}
                    onChange={set("gst")}
                    placeholder="27ABCDE1234F1Z5"
                  />
                  <FloatField
                    label="PAN"
                    k="pan"
                    icon={FileText}
                    value={form.pan}
                    onChange={set("pan")}
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FloatField
                    label="Credit Limit (₹)"
                    k="creditLimit"
                    icon={CreditCard}
                    type="number"
                    value={form.creditLimit}
                    onChange={set("creditLimit")}
                  />
                  <FloatField
                    label="Outstanding (₹)"
                    k="outstanding"
                    icon={Wallet}
                    type="number"
                    value={form.outstanding}
                    onChange={set("outstanding")}
                  />
                </div>
                {Number(form.creditLimit) > 0 && (
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Credit utilisation</span>
                      <span
                        className={`font-bold ${ytdPct >= 90 ? "text-red-400" : ytdPct >= 60 ? "text-orange-400" : "text-emerald-400"}`}
                      >
                        {ytdPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${ytdPct >= 90 ? "bg-red-500" : ytdPct >= 60 ? "bg-orange-400" : "bg-emerald-500"}`}
                        style={{ width: `${ytdPct}%` }}
                      />
                    </div>
                  </div>
                )}
                <FloatField
                  label="Next Follow-up Date"
                  k="nextFollowUpDate"
                  icon={CalendarClock}
                  type="date"
                  value={form.nextFollowUpDate}
                  onChange={set("nextFollowUpDate")}
                />
              </>
            )}

            {tab === "badges" && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-3">
                  Tap to toggle a badge on this customer
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_BADGES.map((b) => {
                    const active = form.badges.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBadge(b)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                          active
                            ? `${BADGE_STYLES[b]} border-transparent shadow-sm scale-100`
                            : "bg-white/5 text-slate-500 border-white/10 hover:border-white/20"
                        }`}
                      >
                        {b === "VIP" && (
                          <Star
                            size={11}
                            className={active ? "fill-current" : ""}
                          />
                        )}
                        {active && <Check size={11} />}
                        {b}
                      </button>
                    );
                  })}
                </div>
                {form.badges.length === 0 && (
                  <p className="text-xs text-slate-500 mt-4">
                    No badges applied yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {error && (
          <p className="px-6 text-xs text-red-400 flex items-center gap-1.5 pb-1 pt-2">
            <AlertTriangle size={12} /> {error}
          </p>
        )}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-white/10 bg-[var(--surface)] shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 hover:bg-white/10 flex items-center gap-1.5 transition-colors"
          >
            Cancel
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={() => setForm(JSON.parse(initialSnapshot))}
              className="h-11 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 shadow-md shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   HEADER + BULK BAR
──────────────────────────────────────────────────────────────── */
const Header = ({
  onRefresh,
  refreshing,
  onAdd,
  onImportClick,
  importing,
  importProgress,
  onExport,
  exporting,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
        Customer Management
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Manage all chemical industry customers efficiently.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onImportClick}
        disabled={importing}
        className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {importing ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            {importProgress?.total
              ? `Importing ${importProgress.done}/${importProgress.total}`
              : "Reading file…"}
          </>
        ) : (
          <>
            <Upload size={14} /> Import
          </>
        )}
      </button>
      <button
        onClick={onExport}
        disabled={exporting}
        className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        Export
      </button>
      <button
        onClick={onRefresh}
        className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 flex items-center justify-center transition-colors"
      >
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
      </button>
      <button
        onClick={onAdd}
        className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-colors"
      >
        <Plus size={15} /> Add Customer
      </button>
    </div>
  </div>
);

const BulkBar = ({ count, onClear, onBulkDelete, onBulkAssign }) => {
  if (!count) return null;
  return (
    <div className="flex items-center justify-between rounded-xl bg-blue-600 ring-1 ring-white/10 text-white px-4 py-2.5 shadow-lg shadow-blue-600/20">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onBulkAssign}
          className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Users size={12} /> Assign Sales Person
        </button>
        <button
          onClick={onBulkDelete}
          className="h-8 px-3 rounded-lg bg-red-500/90 hover:bg-red-500 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Trash2 size={12} /> Delete
        </button>
        <button
          onClick={onClear}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────────── */
export default function CustomerListPage() {
  const [filters, setFilters] = useState({
    search: "",
    type: "All",
    status: "All",
    category: "All",
    state: "All",
    followUpStatus: "All",
  });
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selected, setSelected] = useState([]);
  const [sortKey, setSortKey] = useState("company");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [viewCustomerId, setViewCustomerId] = useState(null);
  const [notesCustomerId, setNotesCustomerId] = useState(null);
  const [followUpCustomer, setFollowUpCustomer] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null); // { customerIds, title, subtitle }
  const [knownSalesPersons, setKnownSalesPersons] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [toast, setToast] = useState(null);

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

  const debounceRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCustomers({
        search: filters.search || undefined,
        type: filters.type,
        status: filters.status,
        category: filters.category,
        state: filters.state,
        followUpStatus: filters.followUpStatus,
        sortBy: sortKey,
        sortDir,
        page,
        limit: pageSize,
      });
      setRows(res.customers || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      // There's no dedicated "list sales persons" endpoint, so we
      // build a quick-pick list from whoever shows up on loaded
      // customers this session (dedup by _id, requires the backend
      // to populate salesPerson as { _id, name } rather than a bare
      // ObjectId string — falls back gracefully to manual ID entry
      // in the assign modal if it never gets populated).
      setKnownSalesPersons((prev) => {
        const map = new Map(prev.map((p) => [p._id, p]));
        (res.customers || []).forEach((c) => {
          if (c.salesPerson && c.salesPerson._id) {
            map.set(c.salesPerson._id, {
              _id: c.salesPerson._id,
              name: c.salesPerson.name || "Unnamed",
            });
          }
        });
        return Array.from(map.values());
      });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to load customers",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, sortKey, sortDir, page, pageSize]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetchCustomerStats();
      setStats(res.stats);
    } catch {
      // stats are non-critical, fail silently
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // debounced fetch whenever filters/sort/page change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(loadCustomers, 350);
    return () => clearTimeout(debounceRef.current);
  }, [loadCustomers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const resetFilters = () =>
    setFilters({
      search: "",
      type: "All",
      status: "All",
      category: "All",
      state: "All",
      followUpStatus: "All",
    });

  const refreshAll = () => {
    loadCustomers();
    loadStats();
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete ${customer.company}? This cannot be undone.`))
      return;
    try {
      await deleteCustomer(customer._id);
      showToast("Customer deleted");
      refreshAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const handleStatusChange = async (customer, newStatus) => {
    try {
      // Partial payload — assumes the update route merges fields via
      // findByIdAndUpdate rather than requiring the full customer body,
      // same assumption already made for follow-up date scheduling.
      await updateCustomer(customer._id, { status: newStatus });
      showToast(`${customer.company} marked ${newStatus}`);
      refreshAll();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Could not update status",
        "error",
      );
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} selected customer(s)?`))
      return;
    try {
      await bulkDeleteCustomers(selected);
      showToast(`${selected.length} customer(s) deleted`);
      setSelected([]);
      refreshAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Bulk delete failed", "error");
    }
  };

  const openSingleAssign = (customer) => {
    setAssignTarget({
      customerIds: [customer._id],
      title: customer.company,
      subtitle: `${customer.customerId} · ${customer.name}`,
    });
  };

  const openBulkAssign = () => {
    if (!selected.length) return;
    setAssignTarget({
      customerIds: selected,
      title: `${selected.length} customer${selected.length > 1 ? "s" : ""} selected`,
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Pulls every row matching the current filters, not just the
      // page on screen. Assumes the backend returns up to `limit`
      // rows rather than silently capping it lower — raise the cap
      // there too if your API enforces a smaller max page size.
      const res = await fetchCustomers({
        search: filters.search || undefined,
        type: filters.type,
        status: filters.status,
        category: filters.category,
        state: filters.state,
        followUpStatus: filters.followUpStatus,
        sortBy: sortKey,
        sortDir,
        page: 1,
        limit: 100000,
      });
      const data = res.customers || [];
      if (!data.length) {
        showToast("No customers to export", "error");
        return;
      }
      const csv = buildCSV(data);
      downloadCSV(
        `customers_${new Date().toISOString().slice(0, 10)}.csv`,
        csv,
      );
      showToast(`Exported ${data.length} customer(s)`);
    } catch (err) {
      showToast(err.response?.data?.message || "Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setImporting(true);
    setImportProgress({ done: 0, total: 0 });
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        showToast("No data rows found in that file", "error");
        return;
      }

      const header = rows[0].map((h) => h.trim().toLowerCase());
      const dataRows = rows.slice(1);

      const colIndex = {};
      header.forEach((h, i) => {
        const match = IMPORT_EXPORT_COLUMNS.find(
          (c) => c.label.toLowerCase() === h,
        );
        if (match) colIndex[match.key] = i;
      });

      if (colIndex.company === undefined || colIndex.name === undefined) {
        showToast(
          "Couldn't find Company/Contact Person columns — use the headers from an exported CSV",
          "error",
        );
        return;
      }

      setImportProgress({ done: 0, total: dataRows.length });
      let success = 0;
      let skipped = 0;
      const failed = [];

      for (let i = 0; i < dataRows.length; i++) {
        const r = dataRows[i];
        const get = (key) =>
          colIndex[key] !== undefined ? (r[colIndex[key]] || "").trim() : "";

        const company = get("company");
        const name = get("name");
        const phone = get("phone");
        const city = get("city");

        // company / contact / phone / city are the same fields the
        // Add Customer wizard requires — anything missing them gets
        // skipped rather than guessed at.
        if (!company || !name || !phone || !city) {
          skipped++;
          setImportProgress({ done: i + 1, total: dataRows.length });
          continue;
        }

        const payload = {
          company,
          name,
          phone,
          email: get("email"),
          gst: get("gst"),
          pan: get("pan"),
          city,
          state: STATES.includes(get("state")) ? get("state") : STATES[0],
          type: TYPES.includes(get("type")) ? get("type") : TYPES[0],
          category: CATEGORIES.includes(get("category"))
            ? get("category")
            : CATEGORIES[0],
          status: STATUSES.includes(get("status")) ? get("status") : "Active",
          creditLimit: Number(get("creditLimit")) || 0,
          outstanding: Number(get("outstanding")) || 0,
          nextFollowUpDate: get("nextFollowUpDate") || "",
        };

        try {
          // Sequential on purpose — createCustomer is the only write
          // endpoint available for this, so this stays gentle on the
          // API instead of firing dozens of requests at once. Every
          // row becomes a NEW customer; this doesn't try to match an
          // existing one by Customer ID.
          await createCustomer(payload);
          success++;
        } catch (err) {
          failed.push(company);
        }
        setImportProgress({ done: i + 1, total: dataRows.length });
      }

      refreshAll();
      const hasIssues = skipped > 0 || failed.length > 0;
      showToast(
        hasIssues
          ? `Imported ${success}, skipped ${skipped}, failed ${failed.length}`
          : `Imported ${success} customer(s)`,
        hasIssues ? "error" : "success",
      );
    } catch (err) {
      showToast("Could not read that file", "error");
    } finally {
      setImporting(false);
      setImportProgress({ done: 0, total: 0 });
    }
  };

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        background:
          "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(76,124,255,0.12), transparent 60%), var(--bg)",
      }}
    >
      <style>{`
        :root {
          --bg: #0A0D12;
          --surface: #12161D;
          --surface-2: #171C26;
          --brass: #CC9A4E;
          --brass-light: #E8C077;
        }
      `}</style>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <Header
          onRefresh={refreshAll}
          refreshing={loading}
          onAdd={() => setAddOpen(true)}
          onImportClick={handleImportClick}
          importing={importing}
          importProgress={importProgress}
          onExport={handleExport}
          exporting={exporting}
        />
        <StatsRow stats={stats} loading={statsLoading} />
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          expanded={expanded}
          setExpanded={setExpanded}
          onReset={resetFilters}
          resultCount={total}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <BulkBar
          count={selected.length}
          onClear={() => setSelected([])}
          onBulkDelete={handleBulkDelete}
          onBulkAssign={openBulkAssign}
        />
        {viewMode === "table" ? (
          <CustomerTable
            rows={rows}
            loading={loading}
            selected={selected}
            setSelected={setSelected}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onView={(c) => setViewCustomerId(c._id)}
            onEdit={(c) => setEditingCustomer(c)}
            onDelete={handleDelete}
            onQuickFollowUp={(c) => setFollowUpCustomer(c)}
            onNotes={(c) => setNotesCustomerId(c._id)}
            onStatusChange={handleStatusChange}
            onAssignSalesPerson={openSingleAssign}
            onAddFirst={() => setAddOpen(true)}
          />
        ) : (
          <CustomerCardGrid
            rows={rows}
            loading={loading}
            selected={selected}
            setSelected={setSelected}
            onView={(c) => setViewCustomerId(c._id)}
            onEdit={(c) => setEditingCustomer(c)}
            onDelete={handleDelete}
            onQuickFollowUp={(c) => setFollowUpCustomer(c)}
            onNotes={(c) => setNotesCustomerId(c._id)}
            onStatusChange={handleStatusChange}
            onAssignSalesPerson={openSingleAssign}
            onAddFirst={() => setAddOpen(true)}
          />
        )}
        {!loading && total > 0 && (
          <Pagination
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleImportFile}
        className="hidden"
      />

      <QuickViewDrawer
        customerId={viewCustomerId}
        onClose={() => setViewCustomerId(null)}
        onFollowUpAdded={refreshAll}
      />

      <CustomerNotesModal
        customerId={notesCustomerId}
        onClose={() => setNotesCustomerId(null)}
        onNoteAdded={() => showToast("Note saved")}
      />

      <FollowUpModal
        customer={followUpCustomer}
        open={!!followUpCustomer}
        onClose={() => setFollowUpCustomer(null)}
        onSaved={() => {
          setFollowUpCustomer(null);
          showToast("Follow-up logged");
          refreshAll();
        }}
      />

      <AssignSalesPersonModal
        open={!!assignTarget}
        customerIds={assignTarget?.customerIds}
        title={assignTarget?.title}
        subtitle={assignTarget?.subtitle}
        knownSalesPersons={knownSalesPersons}
        onClose={() => setAssignTarget(null)}
        onSaved={() => {
          showToast("Sales person assigned");
          setSelected([]);
          setAssignTarget(null);
          refreshAll();
        }}
      />

      <AddCustomerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          showToast("Customer created");
          refreshAll();
        }}
      />

      <EditCustomerModal
        open={!!editingCustomer}
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSaved={() => {
          setEditingCustomer(null);
          showToast("Customer updated");
          refreshAll();
        }}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
