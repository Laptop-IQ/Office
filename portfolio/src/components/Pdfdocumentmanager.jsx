import { useState, useRef, useCallback, useEffect } from "react";

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
const DB_NAME = "docvault_db";
const DB_VER = 1;
const STORE = "documents";

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
async function dbPut(doc) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(doc);
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
  "Invoices",
  "Contracts",
  "Reports",
  "Legal",
  "Personal",
  "Other",
];
const SORT_OPTIONS = [
  "Newest",
  "Oldest",
  "Name A–Z",
  "Name Z–A",
  "Largest",
  "Smallest",
];
const CAT_ICONS = {
  Invoices:
    "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
  Contracts:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  Reports:
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  Legal:
    "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  Personal:
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  Other:
    "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
};
const CAT_COLORS = {
  Invoices: "bg-blue-100 text-blue-700",
  Contracts: "bg-purple-100 text-purple-700",
  Reports: "bg-emerald-100 text-emerald-700",
  Legal: "bg-amber-100 text-amber-700",
  Personal: "bg-pink-100 text-pink-700",
  Other: "bg-gray-100 text-gray-600",
};

function fmtSize(b) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}
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
      ? "bg-red-50 text-red-700 border-red-200"
      : type === "warn"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <div
      className={`fixed top-4 right-4 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium border ${cls} animate-in`}
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? "bg-red-50" : "bg-indigo-50"}`}
        >
          <svg
            className={`w-6 h-6 ${danger ? "text-red-500" : "text-indigo-500"}`}
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
        <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────
function PDFViewer({ doc, onClose, onDelete, onToggleStar }) {
  const [zoom, setZoom] = useState(100);
  const blobUrl = useRef(null);

  useEffect(() => {
    if (doc?.fileData) {
      const blob = new Blob([doc.fileData], { type: "application/pdf" });
      blobUrl.current = URL.createObjectURL(blob);
    }
    return () => {
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    };
  }, [doc]);

  if (!doc) return null;
  const url = blobUrl.current;
  const zoomedUrl = url ? `${url}#zoom=${zoom}` : "";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900">
      {/* Viewer toolbar */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">
              {doc.name}
            </p>
            <p className="text-gray-400 text-xs">{fmtSize(doc.size)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-800 rounded-xl px-2 py-1 mr-1">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors text-lg font-bold"
            >
              −
            </button>
            <span className="text-xs text-gray-300 font-mono w-10 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors text-lg font-bold"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onToggleStar(doc.id)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${doc.starred ? "text-yellow-400 bg-yellow-400/10" : "text-gray-500 hover:text-yellow-400 hover:bg-gray-700"}`}
          >
            <svg
              className="w-4 h-4"
              fill={doc.starred ? "currentColor" : "none"}
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
          {url && (
            <a
              href={url}
              download={doc.name}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>
          )}
          <button
            onClick={() => {
              onClose();
              onDelete(doc.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
      {/* PDF iframe */}
      <div className="flex-1 overflow-hidden bg-gray-800">
        {url ? (
          <iframe
            src={zoomedUrl}
            title={doc.name}
            className="w-full h-full border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-700 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">
              Cannot preview this document
            </p>
          </div>
        )}
      </div>
      {/* Mobile zoom */}
      <div className="sm:hidden flex items-center justify-center gap-4 py-3 bg-gray-900 border-t border-gray-700 shrink-0">
        <button
          onClick={() => setZoom((z) => Math.max(50, z - 25))}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-xl text-xl font-bold"
        >
          −
        </button>
        <span className="text-sm text-gray-300 font-mono w-12 text-center">
          {zoom}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(200, z + 25))}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-xl text-xl font-bold"
        >
          +
        </button>
        {url && (
          <a
            href={url}
            download={doc.name}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Doc Details Sidebar ──────────────────────────────────────────────────────
function DetailsSidebar({
  doc,
  onClose,
  onDelete,
  onRename,
  onToggleStar,
  onUpdateNote,
  onUpdateCategory,
  onAddTag,
  onRemoveTag,
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(doc.name);
  const [note, setNote] = useState(doc.note || "");
  const [tagInput, setTagInput] = useState("");
  const blobUrl = useRef(null);

  useEffect(() => {
    setName(doc.name);
    setNote(doc.note || "");
  }, [doc]);

  const saveRename = () => {
    if (name.trim() && name !== doc.name) {
      onRename(doc.id, name.trim());
    }
    setEditing(false);
  };

  const handleTagKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      onAddTag(doc.id, tagInput.trim().replace(/,/g, ""));
      setTagInput("");
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[80] w-full sm:w-96 bg-white shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
        <h2 className="text-base font-bold text-gray-900">Document Details</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
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
        {/* Preview thumb */}
        <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-8 h-8 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">PDF Document</p>
          </div>
        </div>
        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Filename
          </label>
          {editing ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveRename()}
                className="flex-1 text-sm border border-indigo-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={saveRename}
                className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800 flex-1 break-all">
                {doc.name}
              </p>
              <button
                onClick={() => setEditing(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
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
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Size", value: fmtSize(doc.size) },
            { label: "Uploaded", value: fmtDate(doc.uploadedAt) },
            { label: "Category", value: doc.category },
            { label: "Starred", value: doc.starred ? "Yes" : "No" },
          ].map((m) => (
            <div key={m.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400 font-medium mb-0.5">
                {m.label}
              </p>
              <p className="text-sm font-semibold text-gray-800">{m.value}</p>
            </div>
          ))}
        </div>
        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c !== "All").map((c) => (
              <button
                key={c}
                onClick={() => onUpdateCategory(doc.id, c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${doc.category === c ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-500 hover:border-indigo-300"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Note
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onUpdateNote(doc.id, note)}
            placeholder="Add a note…"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
        </div>
        {/* Tags */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(doc.tags || []).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                #{t}
                <button
                  onClick={() => onRemoveTag(doc.id, t)}
                  className="text-indigo-400 hover:text-indigo-700 leading-none"
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
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
        </div>
        {/* Uploaded full date */}
        <div className="text-xs text-gray-400 text-center">
          {fmtDateFull(doc.uploadedAt)}
        </div>
      </div>
      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2 shrink-0">
        <button
          onClick={() => onToggleStar(doc.id)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${doc.starred ? "bg-amber-50 border-amber-200 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <svg
            className="w-4 h-4"
            fill={doc.starred ? "currentColor" : "none"}
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
          {doc.starred ? "Unstar document" : "Star document"}
        </button>
        <button
          onClick={() => {
            onDelete(doc.id);
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
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
          Delete document
        </button>
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [meta, setMeta] = useState({ category: "Other", tags: "", note: "" });
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf",
    );
    setFiles((p) => [...p, ...dropped]);
  }, []);

  const removeFile = (i) => setFiles((f) => f.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!files.length) return;
    await onUpload(files, meta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload PDFs</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Files are saved locally in your browser
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
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
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                setFiles((p) => [
                  ...p,
                  ...Array.from(e.target.files).filter(
                    (f) => f.type === "application/pdf",
                  ),
                ]);
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-7 h-7 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Drop PDFs here or <span className="text-indigo-600">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Multiple files supported · PDF only
            </p>
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {f.name}
                    </p>
                    <p className="text-xs text-gray-400">{fmtSize(f.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
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
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Category
              </label>
              <select
                value={meta.category}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, category: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Tags{" "}
                <span className="font-normal text-gray-400">
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. tax, 2024, important"
                value={meta.tags}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, tags: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Note
              </label>
              <textarea
                rows={2}
                placeholder="Add a short note…"
                value={meta.note}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, note: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!files.length}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
          >
            {files.length
              ? `Save ${files.length} File${files.length > 1 ? "s" : ""}...`
              : "Select files first"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────
function DocCard({
  doc,
  viewMode,
  onOpen,
  onOpenDetails,
  onDelete,
  onToggleStar,
  blobUrls,
}) {
  const blobUrl = blobUrls[doc.id];
  if (viewMode === "list") {
    return (
      <div
        onClick={() => onOpen(doc)}
        className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 bg-white border border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800 truncate text-sm group-hover:text-indigo-700 transition-colors">
              {doc.name}
            </p>
            {doc.starred && <span className="text-yellow-400 text-sm">★</span>}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[doc.category] || "bg-gray-100 text-gray-600"}`}
            >
              {doc.category}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400">{fmtSize(doc.size)}</span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400">
              {fmtDate(doc.uploadedAt)}
            </span>
            {doc.note && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400 truncate max-w-32 italic">
                  "{doc.note}"
                </span>
              </>
            )}
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleStar(doc.id)}
            className={`hidden sm:flex w-8 h-8 items-center justify-center rounded-lg transition-colors ${doc.starred ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
          >
            <svg
              className="w-4 h-4"
              fill={doc.starred ? "currentColor" : "none"}
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
            onClick={() => onOpenDetails(doc)}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Details
          </button>
          {blobUrl && (
            <a
              href={blobUrl}
              download={doc.name}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Save
            </a>
          )}
          <button
            onClick={() => onDelete(doc.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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
  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col overflow-hidden group cursor-pointer"
      onClick={() => onOpen(doc)}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-indigo-50/40 flex items-center justify-center relative border-b border-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
            <svg
              className="w-7 h-7 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-400 tracking-widest">PDF</p>
        </div>
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleStar(doc.id)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg backdrop-blur-sm bg-white/80 transition-colors ${doc.starred ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill={doc.starred ? "currentColor" : "none"}
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
            onClick={() => {
              onOpenDetails(doc);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg backdrop-blur-sm bg-white/80 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
        </div>
        {/* Click overlay hint */}
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors rounded-t-2xl flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            Click to open
          </div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors">
          {doc.name}
        </p>
        <div className="flex flex-wrap gap-1 mb-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[doc.category] || "bg-gray-100 text-gray-600"}`}
          >
            {doc.category}
          </span>
        </div>
        {doc.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {doc.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
              >
                #{t}
              </span>
            ))}
            {doc.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{doc.tags.length - 3}
              </span>
            )}
          </div>
        )}
        {doc.note && (
          <p className="text-xs text-gray-400 line-clamp-1 italic mb-2">
            "{doc.note}"
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">
              {fmtSize(doc.size)}
            </p>
            <p className="text-xs text-gray-300">{fmtDate(doc.uploadedAt)}</p>
          </div>
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {blobUrl && (
              <a
                href={blobUrl}
                download={doc.name}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
            )}
            <button
              onClick={() => onDelete(doc.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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
function EmptyState({ query, onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-indigo-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      {query ? (
        <>
          <h3 className="text-lg font-bold text-gray-700 mb-1">
            No results for "{query}"
          </h3>
          <p className="text-sm text-gray-400">
            Try a different keyword, tag, or category.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-gray-700 mb-1">
            No documents yet
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Upload your first PDF — it stays saved even after refresh.
          </p>
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl transition-colors shadow-lg shadow-indigo-200"
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload PDF
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function DocVault() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blobUrls, setBlobUrls] = useState({});
  const [viewDoc, setViewDoc] = useState(null);
  const [detailDoc, setDetailDoc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [layout, setLayout] = useState("grid");
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await dbGetAll();
        saved.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setDocs(saved);
        // Create blob URLs
        const urls = {};
        for (const d of saved) {
          if (d.fileData) {
            const blob = new Blob([d.fileData], { type: "application/pdf" });
            urls[d.id] = URL.createObjectURL(blob);
          }
        }
        setBlobUrls(urls);
      } catch (e) {
        console.error("DB load error", e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      Object.values(blobUrls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Upload handler — reads file as ArrayBuffer for IndexedDB storage
  const handleUpload = async (files, meta) => {
    setUploading(true);
    try {
      const newDocs = [];
      const newUrls = {};
      for (const f of files) {
        const buf = await f.arrayBuffer();
        const id = Date.now() + Math.random();
        const doc = {
          id,
          name: f.name,
          size: f.size,
          category: meta.category,
          note: meta.note,
          tags: meta.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          uploadedAt: new Date().toISOString(),
          starred: false,
          fileData: buf,
        };
        await dbPut(doc);
        const blob = new Blob([buf], { type: "application/pdf" });
        newUrls[id] = URL.createObjectURL(blob);
        newDocs.push(doc);
      }
      setDocs((p) => [...newDocs, ...p]);
      setBlobUrls((u) => ({ ...u, ...newUrls }));
      showToast(
        `${files.length} file${files.length > 1 ? "s" : ""} saved successfully!`,
      );
    } catch (e) {
      console.error(e);
      showToast("Upload failed. Try a smaller file.", "error");
    } finally {
      setUploading(false);
    }
  };

  const doDelete = async (id) => {
    try {
      await dbDelete(id);
      if (blobUrls[id]) URL.revokeObjectURL(blobUrls[id]);
      setBlobUrls((u) => {
        const n = { ...u };
        delete n[id];
        return n;
      });
      setDocs((p) => p.filter((d) => d.id !== id));
      if (viewDoc?.id === id) setViewDoc(null);
      if (detailDoc?.id === id) setDetailDoc(null);
      showToast("Document deleted", "error");
    } catch (e) {
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
      Object.values(blobUrls).forEach((u) => URL.revokeObjectURL(u));
      setBlobUrls({});
      setDocs([]);
      setViewDoc(null);
      setDetailDoc(null);
      showToast("All documents cleared", "warn");
    } catch (e) {
      showToast("Clear failed", "error");
    }
    setConfirmClear(false);
  };

  const updateDoc = async (id, changes) => {
    setDocs((p) => p.map((d) => (d.id === id ? { ...d, ...changes } : d)));
    if (detailDoc?.id === id) setDetailDoc((d) => ({ ...d, ...changes }));
    if (viewDoc?.id === id) setViewDoc((d) => ({ ...d, ...changes }));
    const doc = docs.find((d) => d.id === id);
    if (doc) {
      await dbPut({ ...doc, ...changes });
    }
  };

  const handleToggleStar = (id) =>
    updateDoc(id, { starred: !docs.find((d) => d.id === id)?.starred });
  const handleRename = (id, name) => updateDoc(id, { name });
  const handleUpdateNote = (id, note) => updateDoc(id, { note });
  const handleUpdateCategory = (id, category) => updateDoc(id, { category });
  const handleAddTag = (id, tag) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc || doc.tags?.includes(tag)) return;
    updateDoc(id, { tags: [...(doc.tags || []), tag] });
  };
  const handleRemoveTag = (id, tag) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    updateDoc(id, { tags: (doc.tags || []).filter((t) => t !== tag) });
  };

  const filtered = docs
    .filter((d) => {
      const q = search.toLowerCase();
      const ms =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.tags?.some((t) => t.toLowerCase().includes(q)) ||
        d.note?.toLowerCase().includes(q);
      const mc = category === "All" || d.category === category;
      const mst = !onlyStarred || d.starred;
      return ms && mc && mst;
    })
    .sort((a, b) => {
      if (sort === "Newest")
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      if (sort === "Oldest")
        return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      if (sort === "Name A–Z") return a.name.localeCompare(b.name);
      if (sort === "Name Z–A") return b.name.localeCompare(a.name);
      if (sort === "Largest") return b.size - a.size;
      if (sort === "Smallest") return a.size - b.size;
      return 0;
    });

  const totalSize = docs.reduce((s, d) => s + d.size, 0);
  const starredCount = docs.filter((d) => d.starred).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-indigo-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">
            Loading your documents…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/10">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete document?"
          message="This will permanently remove the file from your browser storage. This cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmClear && (
        <ConfirmDialog
          title="Clear all documents?"
          message="All saved documents will be permanently deleted from this browser. This cannot be undone."
          onConfirm={handleClearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      {viewDoc && (
        <PDFViewer
          doc={viewDoc}
          onClose={() => setViewDoc(null)}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
        />
      )}

      {detailDoc && (
        <>
          <div
            className="fixed inset-0 z-[75] bg-black/20 backdrop-blur-sm"
            onClick={() => setDetailDoc(null)}
          />
          <DetailsSidebar
            doc={detailDoc}
            onClose={() => setDetailDoc(null)}
            onDelete={(id) => {
              setDetailDoc(null);
              handleDelete(id);
            }}
            onRename={handleRename}
            onToggleStar={handleToggleStar}
            onUpdateNote={handleUpdateNote}
            onUpdateCategory={handleUpdateCategory}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  DocVault
                </h1>
                <p className="text-xs text-gray-400 -mt-0.5">
                  Saved locally · works offline
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {docs.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="px-3 py-2.5 border border-red-100 text-red-400 text-xs font-medium rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="hidden xs:inline">Upload PDF</span>
              <span className="xs:hidden">Upload</span>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            {
              label: "Documents",
              value: docs.length,
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              col: "indigo",
            },
            {
              label: "Storage used",
              value: fmtSize(totalSize),
              icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
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
              className="bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:border-gray-200 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-xl bg-${s.col}-50 flex items-center justify-center mb-3`}
              >
                <svg
                  className={`w-4 h-4 text-${s.col}-500`}
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
              <p className="text-2xl font-black text-gray-800 tracking-tight">
                {s.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Search & controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
              placeholder="Search by name, tag, or note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
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
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 shrink-0"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <button
              onClick={() => setOnlyStarred((s) => !s)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all shrink-0 ${onlyStarred ? "bg-amber-50 border-amber-300 text-amber-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              ★ Starred
            </button>
            <div className="flex items-center shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
              {["grid", "list"].map((v) => (
                <button
                  key={v}
                  onClick={() => setLayout(v)}
                  className={`px-3 py-2.5 transition-all ${layout === v ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-700"}`}
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
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${category === c ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Count */}
        {docs.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium">
              {filtered.length} of {docs.length} document
              {docs.length !== 1 ? "s" : ""}
            </p>
            {uploading && (
              <p className="text-xs text-indigo-500 font-semibold animate-pulse">
                Saving…
              </p>
            )}
          </div>
        )}

        {/* Grid / List */}
        {filtered.length === 0 ? (
          <EmptyState query={search} onUpload={() => setShowUpload(true)} />
        ) : layout === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                viewMode="grid"
                blobUrls={blobUrls}
                onOpen={setViewDoc}
                onOpenDetails={setDetailDoc}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                viewMode="list"
                blobUrls={blobUrls}
                onOpen={setViewDoc}
                onOpenDetails={setDetailDoc}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        )}
        {/* Bottom padding */}
        <div className="h-10" />
      </div>

      <style>{`
        @keyframes animate-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .animate-in{animation:animate-in 0.2s ease-out;}
        [data-scrollbar-none]::-webkit-scrollbar{display:none;}
      `}</style>
    </div>
  );
}
