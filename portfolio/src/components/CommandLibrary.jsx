/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
import { useState, useEffect, useCallback } from "react";

// ── Config ─────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:4000/api/commands";

// ── Icons ──────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const CopyIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const PlusIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const XIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const SpinnerIcon = () => (
  <svg
    className="animate-spin"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Constants ──────────────────────────────────────────────────────────────
const TAG_COLORS = {
  bash: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  git: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  docker: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  npm: "bg-red-500/15 text-red-400 border-red-500/30",
  python: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  other: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

// ── API Helper ─────────────────────────────────────────────────────────────
const api = {
  get: (url) => fetch(url).then((r) => r.json()),
  post: (url, body) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  put: (url, body) =>
    fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  delete: (url) => fetch(url, { method: "DELETE" }).then((r) => r.json()),
};

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl border transition-all
            ${
              t.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
        >
          {t.type === "error" ? <XIcon /> : <CheckIcon />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── CopyButton ─────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all border
        ${
          copied
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : "bg-[#21262d] text-[#8b949e] border-transparent hover:bg-[#30363d] hover:text-[#e6edf3]"
        }`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}

// ── CommandCard ────────────────────────────────────────────────────────────
function CommandCard({ item, onDelete, onEdit }) {
  const tagClass = TAG_COLORS[item.tag] || TAG_COLORS.other;

  return (
    <div className="group bg-[#0d1117] border border-[#21262d] rounded-xl overflow-hidden hover:border-[#30363d] transition-all duration-200">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 border ${tagClass}`}
          >
            {item.tag}
          </span>
          <h3 className="text-sm font-semibold text-[#e6edf3] truncate">
            {item.title}
          </h3>
          <span className="shrink-0 text-[10px] text-[#484f58] bg-[#161b22] border border-[#21262d] px-1.5 py-0.5 rounded-full">
            {item.commands.length} cmd{item.commands.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-md text-[#484f58] hover:text-[#58a6ff] hover:bg-[#161b22] transition-colors"
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className="p-1.5 rounded-md text-[#484f58] hover:text-red-400 hover:bg-[#161b22] transition-colors"
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className="px-3 pb-3 space-y-1.5">
        {item.commands.map((c, idx) => (
          <div
            key={c._id}
            className="bg-[#161b22] border border-[#21262d] rounded-lg px-3 py-2 flex items-center gap-2"
          >
            <span className="shrink-0 w-4 h-4 rounded-full bg-[#21262d] text-[#484f58] text-[9px] font-bold flex items-center justify-center">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              {c.label && (
                <div className="text-[10px] text-[#484f58] mb-0.5 truncate">
                  {c.label}
                </div>
              )}
              <code className="text-[12px] text-[#79c0ff] font-mono block overflow-x-auto whitespace-nowrap">
                <span className="text-[#3fb950] select-none mr-1.5">$</span>
                {c.cmd}
              </code>
            </div>
            <CopyButton text={c.cmd} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CommandInput row inside modal ──────────────────────────────────────────
function CommandInput({ cmd, onChange, onRemove, canRemove, index }) {
  return (
    <div className="flex flex-col gap-1.5 bg-[#161b22] border border-[#21262d] rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className="shrink-0 w-5 h-5 rounded-full bg-[#21262d] text-[#484f58] text-[10px] font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <input
          type="text"
          value={cmd.label}
          onChange={(e) => onChange({ ...cmd, label: e.target.value })}
          placeholder="Label (optional)"
          className="flex-1 bg-transparent text-[#8b949e] text-xs focus:outline-none placeholder-[#3d444d]"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="shrink-0 text-[#484f58] hover:text-red-400 transition-colors"
          >
            <XIcon />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-md px-2.5 py-2 focus-within:border-[#58a6ff] transition-colors">
        <span className="text-[#3fb950] font-mono text-sm select-none">$</span>
        <input
          type="text"
          value={cmd.cmd}
          onChange={(e) => onChange({ ...cmd, cmd: e.target.value })}
          placeholder="your command here..."
          className="flex-1 bg-transparent text-[#79c0ff] font-mono text-[13px] focus:outline-none placeholder-[#3d444d]"
        />
      </div>
    </div>
  );
}

// ── Modal (Add / Edit) ─────────────────────────────────────────────────────
function CommandModal({ editItem, onClose, onSave, loading }) {
  const isEdit = !!editItem;
  const [title, setTitle] = useState(editItem?.title || "");
  const [tag, setTag] = useState(editItem?.tag || "bash");
  const [cmds, setCmds] = useState(
    editItem?.commands?.length
      ? editItem.commands.map((c) => ({ ...c }))
      : [{ id: Date.now(), label: "", cmd: "" }],
  );

  const addCmd = () =>
    setCmds((p) => [...p, { id: Date.now(), label: "", cmd: "" }]);
  const updateCmd = (idx, val) =>
    setCmds((p) => p.map((c, i) => (i === idx ? val : c)));
  const removeCmd = (idx) => setCmds((p) => p.filter((_, i) => i !== idx));

  const canSave = title.trim() && cmds.some((c) => c.cmd.trim());

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: editItem?._id,
      title: title.trim(),
      tag,
      commands: cmds.filter((c) => c.cmd.trim()),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d] shrink-0">
          <h2 className="text-sm font-semibold text-[#e6edf3]">
            {isEdit ? "Edit Command Group" : "Add New Command Group"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#484f58] hover:text-[#e6edf3] transition-colors"
          >
            <XIcon />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-widest">
              Group Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Git Essentials"
              className="w-full bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-sm rounded-lg px-3 py-2.5 placeholder-[#3d444d] focus:outline-none focus:border-[#58a6ff] transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-widest">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(TAG_COLORS).map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border
                    ${tag === t ? TAG_COLORS[t] : "bg-[#161b22] text-[#484f58] border-[#21262d] hover:border-[#30363d] hover:text-[#8b949e]"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Commands */}
          <div>
            <label className="block text-[10px] font-semibold text-[#8b949e] mb-2 uppercase tracking-widest">
              Commands ({cmds.length})
            </label>
            <div className="space-y-2">
              {cmds.map((c, idx) => (
                <CommandInput
                  key={c._id || c.id}
                  cmd={c}
                  index={idx}
                  onChange={(val) => updateCmd(idx, val)}
                  onRemove={() => removeCmd(idx)}
                  canRemove={cmds.length > 1}
                />
              ))}
            </div>
            <button
              onClick={addCmd}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] text-[#484f58] text-xs font-medium rounded-lg transition-colors"
            >
              <PlusIcon size={13} /> Add another command
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[#21262d] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <SpinnerIcon />
            ) : isEdit ? (
              <CheckIcon />
            ) : (
              <PlusIcon size={14} />
            )}
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [toasts, setToasts] = useState([]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  // ── Fetch all groups ──────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params = new URLSearchParams();
      if (filterTag !== "all") params.append("tag", filterTag);
      if (search) params.append("search", search);

      const res = await api.get(`${API_BASE}?${params}`);
      if (res.success) setGroups(res.data);
      else setApiError(res.message);
    } catch {
      setApiError(
        "Cannot connect to backend. Make sure the server is running on port 5000.",
      );
    } finally {
      setLoading(false);
    }
  }, [filterTag, search]);

  useEffect(() => {
    const timer = setTimeout(fetchGroups, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchGroups]);

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async ({ id, title, tag, commands }) => {
    setSaving(true);
    try {
      const res = id
        ? await api.put(`${API_BASE}/${id}`, { title, tag, commands })
        : await api.post(API_BASE, { title, tag, commands });

      if (res.success) {
        addToast(
          id ? "Group updated successfully" : "Group created successfully",
        );
        setShowModal(false);
        setEditItem(null);
        fetchGroups();
      } else {
        addToast(res.message, "error");
      }
    } catch {
      addToast("Failed to save. Check server connection.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Delete this command group?")) return;
    try {
      const res = await api.delete(`${API_BASE}/${id}`);
      if (res.success) {
        addToast("Group deleted");
        setGroups((p) => p.filter((g) => g._id !== id));
      } else {
        addToast(res.message, "error");
      }
    } catch {
      addToast("Failed to delete. Check server connection.", "error");
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };
  const openAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
  };

  const totalCmds = groups.reduce((s, g) => s + g.commands.length, 0);
  const allTags = ["all", ...Object.keys(TAG_COLORS)];

  return (
    <div className="min-h-screen bg-[#010409] text-[#e6edf3] font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[#21262d] bg-[#010409]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-[#58a6ff] to-[#bc8cff] rounded-md flex items-center justify-center shrink-0">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight">CmdKit</span>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon size={15} /> New Group
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight">Command Library</h1>
          <p className="text-sm text-[#484f58] mt-1">
            {loading
              ? "Loading from MongoDB..."
              : `${groups.length} group${groups.length !== 1 ? "s" : ""} · ${totalCmds} command${totalCmds !== 1 ? "s" : ""} · saved permanently in MongoDB`}
          </p>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm">
            <svg
              className="shrink-0 mt-0.5"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-medium">Backend Connection Error</p>
              <p className="text-red-400/70 text-xs mt-0.5">{apiError}</p>
              <button
                onClick={fetchGroups}
                className="mt-1.5 text-xs underline hover:text-red-300"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484f58]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, label or command..."
              className="w-full bg-[#0d1117] border border-[#21262d] text-[#e6edf3] text-sm rounded-lg pl-9 pr-3 py-2 placeholder-[#3d444d] focus:outline-none focus:border-[#58a6ff] transition-colors"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setFilterTag(t)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize
                  ${
                    filterTag === t
                      ? "bg-[#21262d] text-[#e6edf3] border border-[#58a6ff]"
                      : "bg-[#0d1117] text-[#484f58] border border-[#21262d] hover:border-[#30363d] hover:text-[#8b949e]"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cards / States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <SpinnerIcon />
            <p className="text-[#484f58] text-sm">Loading from MongoDB...</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((item) => (
              <CommandCard
                key={item._id}
                item={item}
                onDelete={handleDelete}
                onEdit={openEdit}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-[#0d1117] border border-[#21262d] rounded-xl flex items-center justify-center mb-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#484f58"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-[#484f58] text-sm">
              {search || filterTag !== "all"
                ? "No groups match your filter."
                : "No commands yet. Add your first group!"}
            </p>
            {(search || filterTag !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterTag("all");
                }}
                className="mt-2 text-[#58a6ff] text-xs hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <CommandModal
          editItem={editItem}
          onClose={closeModal}
          onSave={handleSave}
          loading={saving}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
