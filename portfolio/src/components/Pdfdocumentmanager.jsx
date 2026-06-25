import { useState, useRef, useEffect } from "react";

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
const DB_NAME = "linkvault_db";
const DB_VER = 1;
const STORE = "links";

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => res(e.target.result);
    req.onerror = () => rej(req.error);
  });
}
async function dbGetAll() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function dbPut(link) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(link);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}
async function dbDelete(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}
async function dbClear() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "All",
  "Work",
  "Personal",
  "Reading List",
  "Inspiration",
  "Other",
];
const SORT_OPTIONS = [
  "Newest",
  "Oldest",
  "Name A–Z",
  "Name Z–A",
  "Most visited",
];

const CAT_COLORS = {
  Work: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  Personal: "bg-pink-500/15 text-pink-300 border border-pink-500/20",
  "Reading List":
    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  Inspiration: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  Other: "bg-slate-500/15 text-slate-400 border border-slate-600/20",
};

function fmtDate(s) {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtDateFull(s) {
  return new Date(s).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function normalizeUrl(raw) {
  let u = raw.trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    return new URL(u).toString();
  } catch {
    return "";
  }
}
function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
function getFaviconUrl(url) {
  const domain = getDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
function guessTitleFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    const last = path.split("/").filter(Boolean).pop();
    if (last)
      return last
        .replace(/[-_]+/g, " ")
        .replace(/\.\w+$/, "")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    return getDomain(url).replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}
function openInNewTab(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// ─── Banner palette (domain-derived) ──────────────────────────────────────────
const BANNER_PALETTES = [
  {
    from: "#1e1b4b",
    via: "#3730a3",
    to: "#0f172a",
    accent: "#818cf8",
    glow: "99,102,241",
  },
  {
    from: "#082f49",
    via: "#0369a1",
    to: "#0f172a",
    accent: "#38bdf8",
    glow: "56,189,248",
  },
  {
    from: "#3b0764",
    via: "#7e22ce",
    to: "#0f172a",
    accent: "#c084fc",
    glow: "192,132,252",
  },
  {
    from: "#052e16",
    via: "#15803d",
    to: "#0f172a",
    accent: "#4ade80",
    glow: "74,222,128",
  },
  {
    from: "#431407",
    via: "#c2410c",
    to: "#0f172a",
    accent: "#fb923c",
    glow: "251,146,60",
  },
  {
    from: "#4c0519",
    via: "#be123c",
    to: "#0f172a",
    accent: "#fb7185",
    glow: "251,113,133",
  },
  {
    from: "#422006",
    via: "#a16207",
    to: "#0f172a",
    accent: "#facc15",
    glow: "250,204,21",
  },
  {
    from: "#042f2e",
    via: "#0f766e",
    to: "#0f172a",
    accent: "#2dd4bf",
    glow: "45,212,191",
  },
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function getBannerPalette(url) {
  const domain = getDomain(url);
  return BANNER_PALETTES[hashString(domain) % BANNER_PALETTES.length];
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const ico =
    type === "error"
      ? "M6 18L18 6M6 6l12 12"
      : type === "warn"
        ? "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        : "M5 13l4 4L19 7";
  const cls =
    type === "error"
      ? "bg-red-950/80 text-red-300 border-red-800/60"
      : type === "warn"
        ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
        : "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";
  return (
    <div
      className={`fixed top-4 right-4 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl shadow-black/40 text-sm font-medium border backdrop-blur-md ${cls} animate-in`}
    >
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={ico}
        />
      </svg>
      {msg}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-sm p-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? "bg-red-500/10" : "bg-indigo-500/10"}`}
        >
          <svg
            className={`w-6 h-6 ${danger ? "text-red-400" : "text-indigo-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d={
                danger
                  ? "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  : "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${danger ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
          >
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Details Sidebar ──────────────────────────────────────────────────────────
function DetailsSidebar({
  link,
  onClose,
  onDelete,
  onRename,
  onToggleStar,
  onUpdateNote,
  onUpdateCategory,
  onAddTag,
  onRemoveTag,
  onVisit,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [note, setNote] = useState(link.note || "");
  const [tagInput, setTagInput] = useState("");
  const [faviconOk, setFaviconOk] = useState(true);

  useEffect(() => {
    setTitle(link.title);
    setNote(link.note || "");
  }, [link]);

  const saveRename = () => {
    if (title.trim() && title !== link.title) onRename(link.id, title.trim());
    setEditing(false);
  };
  const handleTagKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      onAddTag(link.id, tagInput.trim().replace(/,/g, ""));
      setTagInput("");
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[80] w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl shadow-black/50 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800 shrink-0">
        <h2 className="text-base font-bold text-slate-100">Link Details</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <button
          onClick={() => {
            onVisit(link.id);
            openInNewTab(link.url);
          }}
          className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-slate-800 hover:border-indigo-500/40 transition-colors group"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 shadow-sm flex items-center justify-center mx-auto mb-2 p-3">
              {faviconOk ? (
                <img
                  src={getFaviconUrl(link.url)}
                  alt=""
                  className="w-full h-full object-contain"
                  onError={() => setFaviconOk(false)}
                />
              ) : (
                <svg
                  className="w-7 h-7 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {getDomain(link.url)}
            </p>
            <p className="text-xs text-indigo-400 font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Open in new tab →
            </p>
          </div>
        </button>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Title
          </label>
          {editing ? (
            <div className="flex gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveRename()}
                className="flex-1 text-sm bg-slate-800 border border-indigo-500/50 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                onClick={saveRename}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-100 flex-1 break-all">
                {link.title}
              </p>
              <button
                onClick={() => setEditing(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            URL
          </label>
          <button
            onClick={() => {
              onVisit(link.id);
              openInNewTab(link.url);
            }}
            className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline break-all text-left"
          >
            {link.url}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Visits", value: link.visits || 0 },
            { label: "Saved", value: fmtDate(link.savedAt) },
            { label: "Category", value: link.category },
            { label: "Starred", value: link.starred ? "Yes" : "No" },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-slate-800/60 rounded-xl px-3 py-2.5"
            >
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                {m.label}
              </p>
              <p className="text-sm font-semibold text-slate-100">{m.value}</p>
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c !== "All").map((c) => (
              <button
                key={c}
                onClick={() => onUpdateCategory(link.id, c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${link.category === c ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-slate-200"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Note
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onUpdateNote(link.id, note)}
            placeholder="Add a note…"
            className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 resize-none text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(link.tags || []).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                #{t}
                <button
                  onClick={() => onRemoveTag(link.id, t)}
                  className="text-indigo-400/70 hover:text-indigo-200 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKey}
            placeholder="Type tag + Enter"
            className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent"
          />
        </div>
        <div className="text-xs text-slate-500 text-center">
          {fmtDateFull(link.savedAt)}
        </div>
      </div>
      <div className="px-5 py-4 border-t border-slate-800 space-y-2 shrink-0">
        <button
          onClick={() => onToggleStar(link.id)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${link.starred ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}
        >
          <svg
            className="w-4 h-4"
            fill={link.starred ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          {link.starred ? "Unstar link" : "Star link"}
        </button>
        <button
          onClick={() => {
            onDelete(link.id);
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete link
        </button>
      </div>
    </div>
  );
}

// ─── Add Link Modal ────────────────────────────────────────────────────────────
function AddLinkModal({ onClose, onSave }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [faviconOk, setFaviconOk] = useState(true);
  const [meta, setMeta] = useState({ category: "Other", tags: "", note: "" });
  const debounceRef = useRef(null);
  const normalized = normalizeUrl(url);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!normalized) {
      setFaviconOk(true);
      return;
    }
    setFetching(true);
    debounceRef.current = setTimeout(() => {
      if (!touched || title.trim() === "")
        setTitle(guessTitleFromUrl(normalized));
      setFetching(false);
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [normalized]);

  const handleSubmit = async () => {
    if (!normalized) return;
    const finalTitle = title.trim() || guessTitleFromUrl(normalized);
    await onSave({ url: normalized, title: finalTitle, ...meta });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/50 w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Save a link</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved locally in your browser
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              URL
            </label>
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="paste any link — example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent"
              />
            </div>
            {url && !normalized && (
              <p className="text-xs text-red-400 mt-1.5">
                That doesn't look like a valid link.
              </p>
            )}
          </div>
          {normalized && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/40 border border-slate-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-slate-800 shadow-sm flex items-center justify-center shrink-0 p-1.5">
                {faviconOk ? (
                  <img
                    src={getFaviconUrl(normalized)}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={() => setFaviconOk(false)}
                  />
                ) : (
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {fetching ? "Looking up site…" : getDomain(normalized)}
                </p>
                <p className="text-xs text-slate-500 truncate">{normalized}</p>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Title{" "}
              <span className="font-normal text-slate-600">
                (auto-filled, edit freely)
              </span>
            </label>
            <input
              type="text"
              placeholder="Link title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTouched(true);
              }}
              className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Category
              </label>
              <select
                value={meta.category}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, category: e.target.value }))
                }
                className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} className="bg-slate-800">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Tags{" "}
                <span className="font-normal text-slate-600">
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. design, read-later, react"
                value={meta.tags}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, tags: e.target.value }))
                }
                className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Note
              </label>
              <textarea
                rows={2}
                placeholder="Add a short note…"
                value={meta.note}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, note: e.target.value }))
                }
                className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 resize-none text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!normalized}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
          >
            {normalized ? "Save link" : "Paste a link to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PRO LINK CARD ─────────────────────────────────────────────────────────────
function LinkCard({
  link,
  viewMode,
  onVisit,
  onOpenDetails,
  onDelete,
  onToggleStar,
}) {
  const [faviconOk, setFaviconOk] = useState(true);
  const [hovered, setHovered] = useState(false);
  const domain = getDomain(link.url);
  const palette = getBannerPalette(link.url);

  const openLink = (e) => {
    e?.stopPropagation();
    onVisit(link.id);
    openInNewTab(link.url);
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div
        className="group flex items-center gap-3 sm:gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 ease-out"
        style={{
          background: hovered
            ? `linear-gradient(135deg, rgba(${palette.glow},0.06) 0%, #0f1623 100%)`
            : "#0f172a",
          border: hovered
            ? `1px solid rgba(${palette.glow},0.3)`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: hovered
            ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(${palette.glow},0.15), 0 0 20px rgba(${palette.glow},0.08)`
            : "0 1px 3px rgba(0,0,0,0.3)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={openLink}
      >
        {/* Favicon */}
        <div
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-2 transition-all duration-300"
          style={{
            boxShadow: hovered
              ? `0 4px 16px rgba(${palette.glow},0.3)`
              : "0 2px 8px rgba(0,0,0,0.3)",
            transform: hovered
              ? "scale(1.08) rotate(-3deg)"
              : "scale(1) rotate(0deg)",
          }}
        >
          {faviconOk ? (
            <img
              src={getFaviconUrl(link.url)}
              alt=""
              className="w-full h-full object-contain"
              onError={() => setFaviconOk(false)}
            />
          ) : (
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="font-bold text-sm truncate transition-colors duration-200"
              style={{ color: hovered ? palette.accent : "#e2e8f0" }}
            >
              {link.title}
            </p>
            {link.starred && <span className="text-amber-400 text-sm">★</span>}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[link.category] || "bg-slate-500/15 text-slate-300"}`}
            >
              {link.category}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-500">{domain}</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">
              {fmtDate(link.savedAt)}
            </span>
            {link.note && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500 truncate max-w-[8rem] italic">
                  "{link.note}"
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleStar(link.id)}
            className={`hidden sm:flex w-8 h-8 items-center justify-center rounded-lg transition-colors ${link.starred ? "text-amber-400" : "text-slate-600 hover:text-amber-400"}`}
          >
            <svg
              className="w-4 h-4"
              fill={link.starred ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
          <button
            onClick={() => onOpenDetails(link)}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-medium"
          >
            Details
          </button>
          <button
            onClick={openLink}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200"
            style={{
              background: `rgba(${palette.glow},0.12)`,
              color: palette.accent,
              border: `1px solid rgba(${palette.glow},0.2)`,
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Visit
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── GRID VIEW ──────────────────────────────────────────────────────────────
  return (
    <div
      className="group relative cursor-pointer overflow-hidden"
      style={{
        borderRadius: "20px",
        background: "#0f1623",
        border: hovered
          ? `1px solid rgba(${palette.glow},0.35)`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: hovered
          ? `0 24px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(${palette.glow},0.2), 0 0 40px rgba(${palette.glow},0.1)`
          : "0 2px 8px rgba(0,0,0,0.4)",
        transform: hovered
          ? "translateY(-8px) scale(1.02)"
          : "translateY(0) scale(1)",
        transition:
          "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, border-color 0.35s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={openLink}
    >
      {/* ── Banner ── */}
      <div
        className="relative h-32 sm:h-36 overflow-hidden"
        style={{ borderRadius: "20px 20px 0 0" }}
      >
        {/* Gradient BG */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.via} 55%, ${palette.to} 100%)`,
          }}
        />

        {/* Dot texture */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            opacity: hovered ? 0.9 : 0.5,
          }}
        />

        {/* Shine sweep on hover */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)",
            opacity: hovered ? 1 : 0,
          }}
        />

        {/* Bottom fade into card body */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: "linear-gradient(to top, #0f1623 0%, transparent 100%)",
          }}
        />

        {/* Hover actions — top right */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1.5 transition-all duration-200"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(-6px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleStar(link.id)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              background: "rgba(8,12,20,0.7)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: link.starred ? "#f59e0b" : "rgba(255,255,255,0.75)",
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill={link.starred ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
          <button
            onClick={() => onOpenDetails(link)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              background: "rgba(8,12,20,0.7)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              background: "rgba(8,12,20,0.7)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(252,165,165,0.9)",
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Starred badge — top left, always visible */}
        {link.starred && (
          <div
            className="absolute top-2.5 left-2.5 w-7 h-7 flex items-center justify-center rounded-full text-amber-400"
            style={{
              background: "rgba(8,12,20,0.7)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(245,158,11,0.35)",
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        )}

        {/* Centered "Open" pill on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <div
            className="flex items-center gap-1.5 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full"
            style={{
              background: `rgba(${palette.glow},0.75)`,
              backdropFilter: "blur(8px)",
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Open
          </div>
        </div>
      </div>

      {/* ── Favicon badge (overlaps banner/body seam) ── */}
      <div className="relative px-4 h-5" style={{ background: "#0f1623" }}>
        <div
          className="absolute -top-5 left-4 w-11 h-11 rounded-xl bg-white flex items-center justify-center p-2 transition-all duration-300"
          style={{
            border: "3px solid #0f1623",
            boxShadow: hovered
              ? `0 8px 24px rgba(${palette.glow},0.35), 0 2px 8px rgba(0,0,0,0.5)`
              : "0 4px 12px rgba(0,0,0,0.4)",
            transform: hovered
              ? "scale(1.14) rotate(-4deg)"
              : "scale(1) rotate(0deg)",
            borderRadius: "12px",
          }}
        >
          {faviconOk ? (
            <img
              src={getFaviconUrl(link.url)}
              alt=""
              className="w-full h-full object-contain"
              onError={() => setFaviconOk(false)}
            />
          ) : (
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          )}
        </div>
      </div>

      {/* ── Card Body ── */}
      <div
        className="pt-2 pb-4 px-4"
        style={{ background: "#0f1623", borderRadius: "0 0 20px 20px" }}
      >
        {/* Domain row */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: "rgba(148,163,184,0.5)" }}
          >
            {domain}
          </p>
          <span style={{ color: "rgba(148,163,184,0.2)" }}>·</span>
          <div
            className="flex items-center gap-1"
            style={{ color: "rgba(148,163,184,0.4)", fontSize: "10px" }}
          >
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {link.visits || 0}
          </div>
        </div>

        {/* Title */}
        <p
          className="font-bold text-sm leading-snug line-clamp-2 mb-2.5 transition-colors duration-200"
          style={{ color: hovered ? palette.accent : "#e2e8f0" }}
        >
          {link.title}
        </p>

        {/* Category + tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[link.category] || "bg-slate-500/15 text-slate-300"}`}
          >
            {link.category}
          </span>
        </div>
        {link.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {link.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: `rgba(${palette.glow},0.1)`,
                  color: palette.accent,
                  border: `1px solid rgba(${palette.glow},0.18)`,
                }}
              >
                #{t}
              </span>
            ))}
            {link.tags.length > 3 && (
              <span className="text-[10px] text-slate-500">
                +{link.tags.length - 3}
              </span>
            )}
          </div>
        )}
        {link.note && (
          <p
            className="text-[11px] italic line-clamp-1 mb-2"
            style={{ color: "rgba(148,163,184,0.4)" }}
          >
            "{link.note}"
          </p>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2.5"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            marginTop: "4px",
          }}
        >
          <span
            className="text-[10px]"
            style={{ color: "rgba(148,163,184,0.4)" }}
          >
            {fmtDate(link.savedAt)}
          </span>

          {/* Inline accent progress bar (visit depth indicator) */}
          <div
            className="flex-1 mx-3 h-[2px] rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: hovered
                  ? `${Math.min(100, ((link.visits || 0) / 20) * 100 + 15)}%`
                  : "0%",
                background: `linear-gradient(to right, rgba(${palette.glow},0.5), ${palette.accent})`,
              }}
            />
          </div>

          <div
            className="flex items-center gap-1 transition-all duration-200"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateX(0)" : "translateX(4px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={openLink}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "rgba(148,163,184,0.5)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${palette.glow},0.12)`;
                e.currentTarget.style.color = palette.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(148,163,184,0.5)";
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(link.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "rgba(148,163,184,0.5)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                e.currentTarget.style.color = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(148,163,184,0.5)";
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ query, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-indigo-400/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      </div>
      {query ? (
        <>
          <h3 className="text-lg font-bold text-slate-200 mb-1">
            No results for "{query}"
          </h3>
          <p className="text-sm text-slate-500">
            Try a different keyword, tag, or category.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-slate-200 mb-1">
            No links yet
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Save your first link — it stays saved even after refresh.
          </p>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl transition-colors shadow-lg shadow-indigo-950/50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Save a link
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function LinkVault() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLink, setDetailLink] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [layout, setLayout] = useState("grid");
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await dbGetAll();
        saved.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        setLinks(saved);
      } catch (e) {
        console.error("DB load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSave = async ({ url, title, category, tags, note }) => {
    setSaving(true);
    try {
      const id = Date.now() + Math.random();
      const link = {
        id,
        url,
        title,
        category,
        note,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        savedAt: new Date().toISOString(),
        starred: false,
        visits: 0,
      };
      await dbPut(link);
      setLinks((p) => [link, ...p]);
      showToast("Link saved!");
    } catch (e) {
      console.error(e);
      showToast("Could not save link.", "error");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id) => {
    try {
      await dbDelete(id);
      setLinks((p) => p.filter((l) => l.id !== id));
      if (detailLink?.id === id) setDetailLink(null);
      showToast("Link deleted", "error");
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleDelete = (id) => setConfirmDelete(id);
  const handleConfirmDelete = async () => {
    await doDelete(confirmDelete);
    setConfirmDelete(null);
  };

  const handleClearAll = async () => {
    try {
      await dbClear();
      setLinks([]);
      setDetailLink(null);
      showToast("All links cleared", "warn");
    } catch {
      showToast("Clear failed", "error");
    }
    setConfirmClear(false);
  };

  const updateLink = async (id, changes) => {
    setLinks((p) => p.map((l) => (l.id === id ? { ...l, ...changes } : l)));
    if (detailLink?.id === id) setDetailLink((l) => ({ ...l, ...changes }));
    const link = links.find((l) => l.id === id);
    if (link) await dbPut({ ...link, ...changes });
  };

  const handleToggleStar = (id) =>
    updateLink(id, { starred: !links.find((l) => l.id === id)?.starred });
  const handleRename = (id, title) => updateLink(id, { title });
  const handleUpdateNote = (id, note) => updateLink(id, { note });
  const handleUpdateCategory = (id, category) => updateLink(id, { category });
  const handleAddTag = (id, tag) => {
    const link = links.find((l) => l.id === id);
    if (!link || link.tags?.includes(tag)) return;
    updateLink(id, { tags: [...(link.tags || []), tag] });
  };
  const handleRemoveTag = (id, tag) => {
    const link = links.find((l) => l.id === id);
    if (!link) return;
    updateLink(id, { tags: (link.tags || []).filter((t) => t !== tag) });
  };
  const handleVisit = (id) => {
    const link = links.find((l) => l.id === id);
    if (!link) return;
    updateLink(id, { visits: (link.visits || 0) + 1 });
  };

  const filtered = links
    .filter((l) => {
      const q = search.toLowerCase();
      const ms =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        l.tags?.some((t) => t.toLowerCase().includes(q)) ||
        l.note?.toLowerCase().includes(q);
      const mc = category === "All" || l.category === category;
      const mst = !onlyStarred || l.starred;
      return ms && mc && mst;
    })
    .sort((a, b) => {
      if (sort === "Newest") return new Date(b.savedAt) - new Date(a.savedAt);
      if (sort === "Oldest") return new Date(a.savedAt) - new Date(b.savedAt);
      if (sort === "Name A–Z") return a.title.localeCompare(b.title);
      if (sort === "Name Z–A") return b.title.localeCompare(a.title);
      if (sort === "Most visited") return (b.visits || 0) - (a.visits || 0);
      return 0;
    });

  const starredCount = links.filter((l) => l.starred).length;
  const totalVisits = links.reduce((s, l) => s + (l.visits || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Loading your links…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete link?"
          message="This will permanently remove the link from your browser storage. This cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmClear && (
        <ConfirmDialog
          title="Clear all links?"
          message="All saved links will be permanently deleted from this browser. This cannot be undone."
          onConfirm={handleClearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      {detailLink && (
        <>
          <div
            className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailLink(null)}
          />
          <DetailsSidebar
            link={detailLink}
            onClose={() => setDetailLink(null)}
            onDelete={(id) => {
              setDetailLink(null);
              handleDelete(id);
            }}
            onRename={handleRename}
            onToggleStar={handleToggleStar}
            onUpdateNote={handleUpdateNote}
            onUpdateCategory={handleUpdateCategory}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onVisit={handleVisit}
          />
        </>
      )}

      {showAdd && (
        <AddLinkModal onClose={() => setShowAdd(false)} onSave={handleSave} />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950/60">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">
                LinkVault
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                Saved locally · works offline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {links.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="px-3 py-2.5 border border-red-500/20 text-red-400/80 text-xs font-medium rounded-xl hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-950/60"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Save Link
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            {
              label: "Links saved",
              value: links.length,
              icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
              col: "indigo",
            },
            {
              label: "Total visits",
              value: totalVisits,
              icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
              col: "purple",
            },
            {
              label: "Starred",
              value: starredCount,
              icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
              col: "amber",
            },
            {
              label: "Filtered",
              value: filtered.length,
              icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
              col: "emerald",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`relative bg-slate-900 border border-slate-800 rounded-2xl px-4 py-5 hover:border-slate-700 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col items-center gap-2.5`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-${s.col}-500 rounded-t-2xl`}
              />
              <div className="flex items-center justify-center gap-2.5">
                <p className="text-3xl font-black text-slate-100 tracking-tight leading-none">
                  {s.value}
                </p>
                <div
                  className={`w-10 h-10 rounded-xl bg-${s.col}-500/10 flex items-center justify-center shrink-0`}
                >
                  <svg
                    className={`w-5 h-5 text-${s.col}-400`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={s.icon}
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-center">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Search & controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by title, URL, tag, or note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shrink-0"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o} className="bg-slate-900">
                  {o}
                </option>
              ))}
            </select>
            <button
              onClick={() => setOnlyStarred((s) => !s)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all shrink-0 ${onlyStarred ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "border-slate-800 text-slate-400 hover:bg-slate-900"}`}
            >
              ★ Starred
            </button>
            <div className="flex items-center shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {["grid", "list"].map((v) => (
                <button
                  key={v}
                  onClick={() => setLayout(v)}
                  className={`px-3 py-2.5 transition-all ${layout === v ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-200"}`}
                >
                  {v === "grid" ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div
          className="flex items-center gap-2 mb-5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${category === c ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-950/50" : "bg-slate-900 text-slate-400 border-slate-800 hover:border-indigo-500/40 hover:text-indigo-300"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Count */}
        {links.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 font-medium">
              {filtered.length} of {links.length} link
              {links.length !== 1 ? "s" : ""}
            </p>
            {saving && (
              <p className="text-xs text-indigo-400 font-semibold animate-pulse">
                Saving…
              </p>
            )}
          </div>
        )}

        {/* Grid / List */}
        {filtered.length === 0 ? (
          <EmptyState query={search} onAdd={() => setShowAdd(true)} />
        ) : layout === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                viewMode="grid"
                onVisit={handleVisit}
                onOpenDetails={setDetailLink}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                viewMode="list"
                onVisit={handleVisit}
                onOpenDetails={setDetailLink}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        )}
        <div className="h-10" />
      </div>

      <style>{`
        @keyframes animate-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: animate-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
