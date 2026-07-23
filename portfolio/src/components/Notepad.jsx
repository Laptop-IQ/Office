import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Search,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Star,
  StarOff,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Undo2,
  Redo2,
  Download,
  Tag,
  X,
  Moon,
  Sun,
  Archive,
  ArchiveRestore,
  CheckSquare,
  FileText,
  Menu,
  Loader2,
  WifiOff,
  ArrowLeft,
  MoreVertical,
  Type,
  Sparkles,
  Clock,
  Hash,
  Save,
  Check,
} from "lucide-react";
import { notesApi } from "./api";

/* ----------------------------------------------------------------
   Utility helpers
---------------------------------------------------------------- */

const formatRelative = (ts) => {
  const date = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const diff = Date.now() - date;
  const min = 60 * 1000,
    hr = 60 * min,
    day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

function stripHtml(html) {
  if (typeof document === "undefined")
    return (html || "").replace(/<[^>]*>/g, "");
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return tmp.textContent || tmp.innerText || "";
}

const wordCount = (html) => {
  const text = stripHtml(html).trim();
  return text ? text.split(/\s+/).length : 0;
};

// Pin / card palette — pastel fill + saturated pin color, cycling per note
const PIN_PALETTE = [
  { pin: "#3B6FD4", fill: "#E8EEF7", border: "#D3DFF0" }, // sky
  { pin: "#2F9E5C", fill: "#E3F1E8", border: "#CFE8D9" }, // mint
  { pin: "#7C5CC4", fill: "#EEEAF7", border: "#DFD8F0" }, // lavender
  { pin: "#E0883C", fill: "#FBEDE0", border: "#F3DCC2" }, // peach
  { pin: "#C45B6B", fill: "#F7E9EA", border: "#EED4D6" }, // blush
];

const cardTheme = (note) => {
  if (note.color) {
    const found = PIN_PALETTE.find(
      (p) => p.pin.toLowerCase() === note.color.toLowerCase(),
    );
    if (found) return found;
  }
  let hash = 0;
  for (let i = 0; i < (note.id || "").length; i++)
    hash = note.id.charCodeAt(i) + ((hash << 5) - hash);
  return PIN_PALETTE[Math.abs(hash) % PIN_PALETTE.length];
};

// Deterministic small tilt per note, like cards pinned by hand
const cardTilt = (id) => {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const angle = (Math.abs(hash) % 7) - 3; // -3..3 deg
  return angle;
};

const TAG_PALETTE = ["#3B6FD4", "#2F9E5C", "#7C5CC4", "#E0883C", "#C45B6B"];
const tagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++)
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
};

const MQ_DESKTOP = "(min-width: 1024px)";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/* ----------------------------------------------------------------
   Pushpin icon — the signature element
---------------------------------------------------------------- */
function PushpinIcon({ color = "#3B6FD4", size = 22, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="21.5" rx="4" ry="1.1" fill="#000" opacity="0.12" />
      <path
        d="M12 2.5c-3 0-5.2 2.2-5.2 5 0 2.1 1.3 3.5 2.6 4.4L7 16.5c-.2.5.2 1 .7.8l3.7-1.4v5.6a.6.6 0 0 0 1.2 0v-5.6l3.7 1.4c.5.2.9-.3.7-.8l-2.4-4.6c1.3-.9 2.6-2.3 2.6-4.4 0-2.8-2.2-5-5.2-5z"
        fill={color}
      />
      <ellipse cx="10" cy="6.5" rx="1.6" ry="1.1" fill="#fff" opacity="0.45" />
    </svg>
  );
}

/* ----------------------------------------------------------------
   Main component
---------------------------------------------------------------- */

export default function Notepad() {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [filter, setFilter] = useState("all");
  const [dark, setDark] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mobilePane, setMobilePane] = useState("list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileFormatOpen, setMobileFormatOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const editorRef = useRef(null);
  const searchRef = useRef(null);
  const saveTimer = useRef(null);
  const titleSaveTimer = useRef(null);
  const searchDebounce = useRef("__never_run__");
  const moreMenuRef = useRef(null);

  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const isDesktop = useMediaQuery(MQ_DESKTOP);
  const active = notes.find((n) => n.id === activeId) || null;

  const showToast = useCallback((msg, type = "info") => {
    setToast(msg);
    setToastType(type);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const loadRequestId = useRef(0);
  const loadNotes = useCallback(async (params = {}) => {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await notesApi.getAll(params);
      if (requestId !== loadRequestId.current) return;
      setNotes(data);
      setActiveId((prev) =>
        prev && data.some((n) => n.id === prev) ? prev : data[0]?.id || null,
      );
    } catch (err) {
      if (requestId !== loadRequestId.current) return;
      setError(err.message || "Could not load notes. Is the backend running?");
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isMountRun = searchDebounce.current === "__never_run__";
    window.clearTimeout(searchDebounce.current);
    const fire = () => {
      loadNotes({
        filter: filter === "all" ? undefined : filter,
        tag: activeTag || undefined,
        search: query || undefined,
      });
    };
    if (isMountRun || query === "") {
      fire();
    } else {
      searchDebounce.current = window.setTimeout(fire, 350);
    }
    return () => window.clearTimeout(searchDebounce.current);
  }, [filter, activeTag, query]); // eslint-disable-line

  useEffect(() => {
    if (!moreMenuOpen) return;
    const onDown = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target))
        setMoreMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMoreMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreMenuOpen]);

  useEffect(() => {
    if (drawerOpen && !isDesktop) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen, isDesktop]);

  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  const allTags = useMemo(() => {
    const s = new Set();
    notes.forEach((n) => n.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [notes]);

  const createNote = async () => {
    try {
      const n = await notesApi.create({
        title: "Untitled note",
        content: "<p></p>",
        tags: [],
      });
      setNotes((prev) => [n, ...prev]);
      setActiveId(n.id);
      if (filter === "archived") setFilter("all");
      showToast("New note pinned to the board", "success");
      setDrawerOpen(false);
      if (!isDesktop) setMobilePane("editor");
      setTimeout(() => editorRef.current?.focus(), 80);
    } catch (err) {
      showToast(err.message || "Could not create note", "error");
    }
  };

  const selectNote = (id) => {
    setActiveId(id);
    setDrawerOpen(false);
    if (!isDesktop) setMobilePane("editor");
  };

  const backToList = () => setMobilePane("list");

  const updateNoteLocal = (id, patch) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...patch, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
  };

  // ── FIX: persistNote used to replace the entire note with the server
  // response. This caused a race condition: if the user started typing
  // a title while a background content-save (700 ms debounce) was still
  // in-flight, the server response would arrive with the OLD title and
  // silently wipe out whatever the user had just typed — the "auto-delete"
  // effect.
  //
  // The fix: start from the full server response (so we pick up any
  // server-computed fields such as updatedAt), then restore the current
  // LOCAL value for every field that was NOT part of this specific patch.
  // That way a content-save never touches the title, and a title-save
  // never touches the content.
  const persistNote = async (id, patch) => {
    try {
      const updated = await notesApi.update(id, patch);
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n;
          const merged = { ...updated };
          Object.keys(n).forEach((k) => {
            if (!(k in patch)) merged[k] = n[k];
          });
          return merged;
        })
      );
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    }
  };

  const updateNote = (id, patch) => {
    updateNoteLocal(id, patch);
    persistNote(id, patch);
  };

  const deleteNote = async (id) => {
    const n = notes.find((x) => x.id === id);
    try {
      await notesApi.remove(id);
      const remaining = notes.filter((x) => x.id !== id);
      setNotes(remaining);
      if (activeId === id) {
        setActiveId(remaining[0]?.id || null);
        if (!isDesktop) setMobilePane("list");
      }
      showToast(`Deleted "${n?.title || "note"}"`, "info");
    } catch (err) {
      showToast(err.message || "Could not delete note", "error");
    }
    setDeleteConfirm(null);
  };

  const togglePin = async (id) => {
    try {
      const updated = await notesApi.togglePin(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      showToast(updated.pinned ? "Note pinned" : "Note unpinned", "success");
    } catch (err) {
      showToast(err.message || "Could not update note", "error");
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const updated = await notesApi.toggleFavorite(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      showToast(
        updated.favorite ? "Added to starred" : "Removed from starred",
        "success",
      );
    } catch (err) {
      showToast(err.message || "Could not update note", "error");
    }
  };

  const toggleArchive = async (id) => {
    const wasArchived = notes.find((n) => n.id === id)?.archived;
    try {
      const updated = await notesApi.toggleArchive(id);
      const shouldRemoveFromView =
        filter !== "all" || updated.archived !== false;
      if (shouldRemoveFromView) {
        setNotes((prev) => {
          const remaining = prev.filter((n) => n.id !== id);
          if (activeIdRef.current === id) {
            setActiveId(remaining[0]?.id || null);
            if (!isDesktop) setMobilePane("list");
          }
          return remaining;
        });
      } else {
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      }
      showToast(wasArchived ? "Note restored" : "Note archived", "success");
    } catch (err) {
      showToast(err.message || "Could not update note", "error");
    }
  };

  const exec = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncContent();
  };

  const syncContent = useCallback(() => {
    const id = activeIdRef.current;
    if (!id || !editorRef.current) return;
    updateNoteLocal(id, { content: editorRef.current.innerHTML });
  }, []);

  const unsavedRef = useRef(false);

  const flushPending = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    window.clearTimeout(titleSaveTimer.current);
    const id = activeIdRef.current;
    if (id && editorRef.current && unsavedRef.current) {
      persistNote(id, { content: editorRef.current.innerHTML });
      unsavedRef.current = false;
      setSaving(false);
    }
  }, []);

  const onEditorInput = useCallback(() => {
    setSaving(true);
    unsavedRef.current = true;
    syncContent();
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const id = activeIdRef.current;
      if (id && editorRef.current) {
        persistNote(id, { content: editorRef.current.innerHTML });
      }
      unsavedRef.current = false;
      setSaving(false);
    }, 700);
  }, [syncContent]);

  useEffect(() => {
    const onBeforeUnload = () => {
      const id = activeIdRef.current;
      if (id && editorRef.current && unsavedRef.current) {
        const token = (() => {
          try {
            return localStorage.getItem("token");
          } catch {
            return null;
          }
        })();
        const base =
          (typeof import.meta !== "undefined" &&
            import.meta.env?.VITE_API_URL) ||
          "";
        if (!base) return;
        fetch(`${base}/notes/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: editorRef.current.innerHTML }),
          keepalive: true,
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushPending();
    });
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flushPending]);

  useEffect(() => {
    return () => {
      flushPending();
    };
  }, [activeId]); // eslint-disable-line

  useEffect(() => {
    if (!editorRef.current || !active) return;
    const isUserTypingHere = document.activeElement === editorRef.current;
    const incoming = active.content ?? "";
    if (!isUserTypingHere && editorRef.current.innerHTML !== incoming) {
      editorRef.current.innerHTML = incoming;
    }
  }, [activeId, active?.content]); // eslint-disable-line

  const onTitleChange = (e) => {
    const value = e.target.value;
    const id = activeIdRef.current;
    if (!id) return;
    updateNoteLocal(id, { title: value });
    window.clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = window.setTimeout(() => {
      persistNote(activeIdRef.current, { title: value });
    }, 600);
  };

  const addTag = (e) => {
    e.preventDefault();
    if (!active || !tagDraft.trim()) return;
    const tg = tagDraft.trim().toLowerCase().replace(/\s+/g, "-");
    if (!active.tags.includes(tg))
      updateNote(active.id, { tags: [...active.tags, tg] });
    setTagDraft("");
  };
  const removeTag = (tg) => {
    if (!active) return;
    updateNote(active.id, { tags: active.tags.filter((x) => x !== tg) });
  };

  const exportNote = () => {
    if (!active) return;
    const text = `${active.title}\n${"=".repeat(active.title.length)}\n\n${stripHtml(active.content)}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title.replace(/[^\w\-]+/g, "_") || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Note exported", "success");
    setMoreMenuOpen(false);
  };

  const [justSaved, setJustSaved] = useState(false);
  const justSavedTimer = useRef(null);

  const manualSave = useCallback(() => {
    const id = activeIdRef.current;
    if (!id || !editorRef.current) return;
    window.clearTimeout(saveTimer.current);
    window.clearTimeout(titleSaveTimer.current);
    persistNote(id, {
      title: active?.title,
      content: editorRef.current.innerHTML,
    });
    unsavedRef.current = false;
    setSaving(false);
    setJustSaved(true);
    window.clearTimeout(justSavedTimer.current);
    justSavedTimer.current = window.setTimeout(() => setJustSaved(false), 1600);
    showToast("Saved", "success");
  }, [active?.title, showToast]);

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        createNote();
      } else if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (!isDesktop) {
          setMobilePane("list");
          setDrawerOpen(true);
        }
        searchRef.current?.focus();
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        manualSave();
      } else if (
        mod &&
        e.key.toLowerCase() === "b" &&
        document.activeElement === editorRef.current
      ) {
        e.preventDefault();
        exec("bold");
      } else if (
        mod &&
        e.key.toLowerCase() === "i" &&
        document.activeElement === editorRef.current
      ) {
        e.preventDefault();
        exec("italic");
      } else if (e.key === "Escape") {
        if (drawerOpen) setDrawerOpen(false);
        if (moreMenuOpen) setMoreMenuOpen(false);
        if (mobileFormatOpen) setMobileFormatOpen(false);
        if (deleteConfirm) setDeleteConfirm(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    active,
    notes,
    isDesktop,
    drawerOpen,
    moreMenuOpen,
    mobileFormatOpen,
    deleteConfirm,
  ]); // eslint-disable-line

  const words = active ? wordCount(active.content) : 0;
  const chars = active ? stripHtml(active.content).length : 0;

  const touchStart = useRef(null);
  const onTouchStart = (e) => {
    if (isDesktop) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    if (isDesktop || !touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (touchStart.current.x < 36 && dx > 70 && Math.abs(dy) < 60) backToList();
    touchStart.current = null;
  };

  const showEditorPane = isDesktop || mobilePane === "editor";

  /* ── theme tokens — corkboard / pinned-card system ─────────────── */
  const t = dark
    ? {
        bg: "#16181C",
        board: "#1B1E23",
        boardDot: "#272B31",
        surface: "#21242A",
        surfaceHover: "#272B31",
        surfaceActive: "#2D3138",
        sidebar: "#1B1E23",
        border: "#2C2F36",
        borderLight: "#272A30",
        text: "#F1F0ED",
        textMuted: "#9498A1",
        textFaint: "#565B64",
        accent: "#5C8AE6",
        accentHover: "#4A78D6",
        accentFaint: "#5C8AE61c",
        danger: "#E2727E",
        dangerBg: "#3A2228",
        inputBg: "#181A1F",
        scrollbar: "#2C2F36",
        cardShadow: "0 10px 24px rgba(0,0,0,0.45)",
      }
    : {
        bg: "#EFEEEA",
        board: "#F2F1ED",
        boardDot: "#E1DFD8",
        surface: "#FFFFFF",
        surfaceHover: "#F7F6F2",
        surfaceActive: "#F0EFEA",
        sidebar: "#F2F1ED",
        border: "#E3E1DA",
        borderLight: "#ECEAE3",
        text: "#1C2026",
        textMuted: "#75798370",
        textFaint: "#A6A89F",
        accent: "#3B6FD4",
        accentHover: "#2F5FC0",
        accentFaint: "#3B6FD414",
        danger: "#C45B6B",
        dangerBg: "#FAEAEC",
        inputBg: "#FFFFFF",
        scrollbar: "#E3E1DA",
        cardShadow: "0 10px 22px rgba(28,32,38,0.10)",
      };
  t.textMuted = dark ? "#9498A1" : "#75798A";

  const headingFont =
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const bodyFont =
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div
      style={{
        fontFamily: bodyFont,
        background: t.bg,
        color: t.text,
        height: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollbar}; border-radius: 10px; }
        .np-btn { border: none; cursor: pointer; background: none; transition: background 0.15s, color 0.15s, transform 0.1s; font-family: ${bodyFont}; }
        .np-btn:active { transform: scale(0.96); }
        .np-input { border: none; outline: none; background: none; font-family: inherit; }
        .np-fade { animation: npFadeIn 0.18s ease; }
        .np-slide-up { animation: npSlideUp 0.22s cubic-bezier(0.2,0.8,0.2,1); }
        .np-spin { animation: npSpin 0.9s linear infinite; }
        @keyframes npFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes npSlideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes npSpin { to { transform: rotate(360deg); } }
        @keyframes npPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .np-saving { animation: npPulse 1.2s ease-in-out infinite; }
        .np-editor:empty::before { content: attr(data-placeholder); color: ${t.textFaint}; pointer-events: none; }
        .np-editor h2 { font-size: 1.3rem; font-weight: 700; margin: 1.4rem 0 0.5rem; line-height: 1.3; font-family: ${headingFont}; }
        .np-editor blockquote { border-left: 3px solid ${t.accent}; padding: 0.2rem 0 0.2rem 1rem; margin: 0.8rem 0; color: ${t.textMuted}; font-style: italic; }
        .np-editor ul { list-style: disc; padding-left: 1.4rem; margin: 0.5rem 0; }
        .np-editor ol { list-style: decimal; padding-left: 1.4rem; margin: 0.5rem 0; }
        .np-editor li { margin: 0.2rem 0; }
        .np-editor p { margin: 0.5rem 0; }
        .np-editor strong { font-weight: 700; }
        .np-editor em { font-style: italic; }
        .np-tag-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 3px 8px 3px 9px; border-radius: 7px; font-weight: 600; }
        .np-note-card { border: none; text-align: left; width: 100%; cursor: pointer; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .np-card-hover { transition: transform 0.18s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.18s ease; }
        .np-card-hover:hover { transform: translateY(-3px) rotate(0deg) !important; box-shadow: 0 16px 30px rgba(28,32,38,0.16); z-index: 5; }
        @media (max-width:1023px) { button, [role=button] { -webkit-tap-highlight-color: transparent; } }
        @media (prefers-reduced-motion: reduce) { .np-fade, .np-slide-up, .np-spin, .np-saving, .np-card-hover { animation: none !important; transition: none !important; } }
      `}</style>

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {!isDesktop && drawerOpen && (
          <div
            className="np-fade"
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 30,
            }}
          />
        )}

        {/* ════════════════════════════════════════════════════════
            SIDEBAR — the "corkboard"
        ════════════════════════════════════════════════════════ */}
        <aside
          style={{
            width: isDesktop ? 304 : undefined,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            background: `radial-gradient(${t.boardDot} 1px, transparent 1px) 0 0/14px 14px, ${t.board}`,
            borderRight: `1px solid ${t.border}`,
            position: isDesktop ? "relative" : "fixed",
            inset: isDesktop ? undefined : "0 auto 0 0",
            zIndex: isDesktop ? undefined : 40,
            maxWidth: isDesktop ? undefined : 320,
            width: isDesktop ? undefined : "88vw",
            transform: isDesktop
              ? undefined
              : drawerOpen
                ? "translateX(0)"
                : "translateX(-100%)",
            transition: isDesktop
              ? undefined
              : "transform 0.28s cubic-bezier(0.2,0.8,0.2,1)",
            boxShadow:
              !isDesktop && drawerOpen
                ? "4px 0 32px rgba(0,0,0,0.18)"
                : undefined,
            paddingTop: !isDesktop ? "env(safe-area-inset-top)" : undefined,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 18px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: t.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 3px 8px ${t.accent}55`,
                  }}
                >
                  <FileText size={15} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    letterSpacing: "-0.4px",
                    color: t.text,
                    fontFamily: headingFont,
                  }}
                >
                  Notepad
                </span>
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                <SidebarIconBtn
                  t={t}
                  onClick={() => setDark((d) => !d)}
                  title="Toggle theme"
                >
                  {dark ? <Sun size={15} /> : <Moon size={15} />}
                </SidebarIconBtn>
                {!isDesktop && (
                  <SidebarIconBtn
                    t={t}
                    onClick={() => setDrawerOpen(false)}
                    title="Close"
                  >
                    <X size={15} />
                  </SidebarIconBtn>
                )}
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: t.textFaint,
                  pointerEvents: "none",
                }}
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes…"
                className="np-input"
                style={{
                  width: "100%",
                  paddingLeft: 33,
                  paddingRight: 10,
                  paddingTop: 10,
                  paddingBottom: 10,
                  fontSize: 13,
                  borderRadius: 10,
                  border: `1px solid ${t.border}`,
                  background: t.inputBg,
                  color: t.text,
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = t.accent)}
                onBlur={(e) => (e.target.style.borderColor = t.border)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="np-btn"
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: t.textFaint,
                    display: "flex",
                    padding: 2,
                    borderRadius: 4,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* New note button */}
            <button
              onClick={createNote}
              className="np-btn"
              style={{
                background: t.accent,
                color: "#fff",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 42,
                boxShadow: `0 4px 12px ${t.accent}40`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = t.accentHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = t.accent)
              }
            >
              <Plus size={15} /> New note
            </button>

            {/* Filter tabs */}
            <div
              className="no-scrollbar"
              style={{
                display: "flex",
                gap: 4,
                overflowX: "auto",
                margin: "0 -2px",
                padding: "0 2px",
              }}
            >
              {[
                { id: "all", label: "All" },
                { id: "pinned", label: "Pinned" },
                { id: "favorite", label: "Starred" },
                { id: "archived", label: "Archive" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="np-btn"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    flexShrink: 0,
                    fontWeight: 600,
                    background: filter === f.id ? t.accent : t.surface,
                    color: filter === f.id ? "#fff" : t.textMuted,
                    border: `1px solid ${filter === f.id ? t.accent : t.border}`,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {allTags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {allTags.map((tg) => (
                  <button
                    key={tg}
                    onClick={() => setActiveTag(activeTag === tg ? null : tg)}
                    className="np-btn"
                    style={{
                      padding: "3px 9px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 600,
                      border: `1px solid ${tagColor(tg)}55`,
                      color: activeTag === tg ? "#fff" : tagColor(tg),
                      background:
                        activeTag === tg ? tagColor(tg) : `${tagColor(tg)}15`,
                    }}
                  >
                    #{tg}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note "board" — pinned cards */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 14px 16px" }}>
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: 48,
                  color: t.textFaint,
                }}
              >
                <Loader2
                  size={18}
                  className="np-spin"
                  style={{ display: "block", margin: "0 auto 8px" }}
                />
                <span style={{ fontSize: 13 }}>Loading…</span>
              </div>
            )}
            {!loading && error && (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: 48,
                  color: t.danger,
                  padding: "48px 16px 0",
                }}
              >
                <WifiOff
                  size={22}
                  style={{
                    display: "block",
                    margin: "0 auto 8px",
                    opacity: 0.6,
                  }}
                />
                <p style={{ fontSize: 13, margin: "0 0 10px" }}>{error}</p>
                <button
                  onClick={() =>
                    loadNotes({
                      filter: filter === "all" ? undefined : filter,
                      tag: activeTag || undefined,
                      search: query || undefined,
                    })
                  }
                  className="np-btn"
                  style={{
                    fontSize: 12,
                    color: t.accent,
                    textDecoration: "underline",
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && filteredNotes.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: 48,
                  color: t.textFaint,
                  padding: "48px 16px 0",
                }}
              >
                <FileText
                  size={26}
                  style={{
                    display: "block",
                    margin: "0 auto 8px",
                    opacity: 0.35,
                  }}
                />
                <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                  {query
                    ? "No notes match your search."
                    : "Board's empty. Pin something."}
                </p>
              </div>
            )}
            {!loading && !error && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  paddingTop: 8,
                }}
              >
                {filteredNotes.map((n) => {
                  const isActive = n.id === activeId && isDesktop;
                  const theme = cardTheme(n);
                  const tilt = isActive ? 0 : cardTilt(n.id);
                  return (
                    <div
                      key={n.id}
                      className="np-card-hover"
                      style={{
                        position: "relative",
                        transform: `rotate(${tilt}deg)`,
                      }}
                    >
                      <PushpinIcon
                        color={theme.pin}
                        size={20}
                        style={{
                          position: "absolute",
                          top: -10,
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 2,
                          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
                        }}
                      />
                      <button
                        onClick={() => selectNote(n.id)}
                        className="np-btn np-note-card"
                        style={{
                          padding: "16px 14px 13px",
                          borderRadius: 12,
                          background: dark ? t.surface : theme.fill,
                          border: `1px solid ${isActive ? theme.pin : dark ? t.border : theme.border}`,
                          boxShadow: isActive
                            ? `0 0 0 2px ${theme.pin}55, ${t.cardShadow}`
                            : t.cardShadow,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginBottom: 4,
                          }}
                        >
                          {n.pinned && (
                            <Pin size={11} color={theme.pin} fill={theme.pin} />
                          )}
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: t.text,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              fontFamily: headingFont,
                            }}
                          >
                            {n.title || "Untitled note"}
                          </span>
                          {n.favorite && (
                            <Star
                              size={11}
                              fill={theme.pin}
                              stroke={theme.pin}
                            />
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 12.5,
                            color: t.textMuted,
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.4,
                          }}
                        >
                          {stripHtml(n.content).slice(0, 64) || "No content"}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10.5,
                              color: t.textFaint,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              fontWeight: 600,
                            }}
                          >
                            <Clock size={9} /> {formatRelative(n.updatedAt)}
                          </span>
                          {n.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: 10.5,
                                color: tagColor(tag),
                                fontWeight: 700,
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "10px 16px",
              paddingBottom: !isDesktop
                ? "calc(10px + env(safe-area-inset-bottom))"
                : undefined,
              borderTop: `1px solid ${t.border}`,
              fontSize: 11,
              color: t.textFaint,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              {filteredNotes.length} note{filteredNotes.length === 1 ? "" : "s"}{" "}
              on the board
            </span>
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="np-btn"
                style={{
                  fontSize: 11,
                  color: t.accent,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontWeight: 700,
                }}
              >
                <Hash size={10} /> {activeTag} <X size={9} />
              </button>
            )}
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════
            MAIN EDITOR AREA — note opened as a large pinned card
        ════════════════════════════════════════════════════════ */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            position: "relative",
            background: t.bg,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "0 14px",
              paddingTop: !isDesktop
                ? "calc(10px + env(safe-area-inset-top))"
                : "0",
              height: !isDesktop ? undefined : 54,
              paddingBottom: !isDesktop ? 10 : 0,
              borderBottom: `1px solid ${t.border}`,
              flexShrink: 0,
              background: t.surface,
            }}
          >
            {!isDesktop && mobilePane === "editor" ? (
              <TopBarBtn t={t} onClick={backToList} title="Back">
                <ArrowLeft size={17} />
              </TopBarBtn>
            ) : (
              <TopBarBtn
                t={t}
                onClick={() => setDrawerOpen(true)}
                title="Open notes"
              >
                <Menu size={17} />
              </TopBarBtn>
            )}

            {active && showEditorPane && (
              <>
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: t.border,
                    margin: "0 2px",
                  }}
                />

                {isDesktop && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    {[
                      {
                        cmd: "bold",
                        icon: <Bold size={14} />,
                        title: "Bold (Ctrl+B)",
                      },
                      {
                        cmd: "italic",
                        icon: <Italic size={14} />,
                        title: "Italic (Ctrl+I)",
                      },
                    ].map(({ cmd, icon, title }) => (
                      <TopBarBtn
                        key={cmd}
                        t={t}
                        onClick={() => exec(cmd)}
                        title={title}
                      >
                        {icon}
                      </TopBarBtn>
                    ))}
                    <div
                      style={{
                        width: 1,
                        height: 16,
                        background: t.border,
                        margin: "0 2px",
                      }}
                    />
                    <TopBarBtn
                      t={t}
                      onClick={() => exec("formatBlock", "<h2>")}
                      title="Heading"
                    >
                      <Heading2 size={14} />
                    </TopBarBtn>
                    <TopBarBtn
                      t={t}
                      onClick={() => exec("insertUnorderedList")}
                      title="Bullet list"
                    >
                      <List size={14} />
                    </TopBarBtn>
                    <TopBarBtn
                      t={t}
                      onClick={() => exec("insertOrderedList")}
                      title="Numbered list"
                    >
                      <ListOrdered size={14} />
                    </TopBarBtn>
                    <TopBarBtn
                      t={t}
                      onClick={() => exec("formatBlock", "<blockquote>")}
                      title="Quote"
                    >
                      <Quote size={14} />
                    </TopBarBtn>
                    <TopBarBtn
                      t={t}
                      onClick={() =>
                        exec(
                          "insertHTML",
                          '<ul style="list-style:none;padding-left:0;"><li><input type="checkbox" style="margin-right:6px;" />Task item</li></ul>',
                        )
                      }
                      title="Checklist"
                    >
                      <CheckSquare size={14} />
                    </TopBarBtn>
                    <div
                      style={{
                        width: 1,
                        height: 16,
                        background: t.border,
                        margin: "0 2px",
                      }}
                    />
                    <TopBarBtn t={t} onClick={() => exec("undo")} title="Undo">
                      <Undo2 size={14} />
                    </TopBarBtn>
                    <TopBarBtn t={t} onClick={() => exec("redo")} title="Redo">
                      <Redo2 size={14} />
                    </TopBarBtn>
                  </div>
                )}

                {!isDesktop && (
                  <TopBarBtn
                    t={t}
                    onClick={() => setMobileFormatOpen(true)}
                    title="Formatting"
                    active={mobileFormatOpen}
                  >
                    <Type size={15} />
                  </TopBarBtn>
                )}

                <div style={{ flex: 1 }} />

                {saving && (
                  <span
                    className="np-saving"
                    style={{
                      fontSize: 11,
                      color: t.textFaint,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginRight: 4,
                    }}
                  >
                    <Loader2 size={10} className="np-spin" /> saving…
                  </span>
                )}

                {isDesktop ? (
                  <div
                    style={{ display: "flex", gap: 1, alignItems: "center" }}
                  >
                    <button
                      onClick={manualSave}
                      className="np-btn"
                      title="Save (Ctrl+S)"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        height: 34,
                        padding: "0 12px",
                        marginRight: 6,
                        borderRadius: 7,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: justSaved ? "#fff" : t.accent,
                        background: justSaved ? "#2F9E5C" : t.accentFaint,
                        border: `1px solid ${justSaved ? "#2F9E5C" : t.accent}40`,
                        transition: "background 0.2s, color 0.2s",
                      }}
                    >
                      {justSaved ? <Check size={13} /> : <Save size={13} />}
                      {justSaved ? "Saved" : "Save"}
                    </button>
                    <TopBarBtn
                      t={t}
                      onClick={() => togglePin(active.id)}
                      title={active.pinned ? "Unpin" : "Pin"}
                      active={active.pinned}
                    >
                      {active.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </TopBarBtn>
                    <TopBarBtn
                      t={t}
                      onClick={() => toggleFavorite(active.id)}
                      title={active.favorite ? "Unstar" : "Star"}
                      active={active.favorite}
                    >
                      {active.favorite ? (
                        <Star size={14} fill="currentColor" />
                      ) : (
                        <StarOff size={14} />
                      )}
                    </TopBarBtn>
                    <TopBarBtn
                      t={t}
                      onClick={() => toggleArchive(active.id)}
                      title={active.archived ? "Restore" : "Archive"}
                    >
                      {active.archived ? (
                        <ArchiveRestore size={14} />
                      ) : (
                        <Archive size={14} />
                      )}
                    </TopBarBtn>
                    <TopBarBtn t={t} onClick={exportNote} title="Export .txt">
                      <Download size={14} />
                    </TopBarBtn>
                    <TopBarBtn
                      t={t}
                      onClick={() => setDeleteConfirm(active.id)}
                      title="Delete"
                      danger
                    >
                      <Trash2 size={14} />
                    </TopBarBtn>
                  </div>
                ) : (
                  <div style={{ position: "relative" }} ref={moreMenuRef}>
                    <TopBarBtn
                      t={t}
                      onClick={() => setMoreMenuOpen((o) => !o)}
                      title="More"
                      active={moreMenuOpen}
                    >
                      <MoreVertical size={15} />
                    </TopBarBtn>
                    {moreMenuOpen && (
                      <div
                        className="np-fade"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 6px)",
                          width: 196,
                          borderRadius: 12,
                          border: `1px solid ${t.border}`,
                          background: t.surface,
                          boxShadow: `0 8px 32px rgba(0,0,0,${dark ? 0.35 : 0.12})`,
                          zIndex: 20,
                          padding: "4px 0",
                          overflow: "hidden",
                        }}
                      >
                        {[
                          {
                            label: "Save now",
                            icon: <Save size={14} />,
                            action: () => {
                              manualSave();
                              setMoreMenuOpen(false);
                            },
                          },
                          {
                            label: active.pinned ? "Unpin" : "Pin note",
                            icon: active.pinned ? (
                              <PinOff size={14} />
                            ) : (
                              <Pin size={14} />
                            ),
                            action: () => {
                              togglePin(active.id);
                              setMoreMenuOpen(false);
                            },
                          },
                          {
                            label: active.favorite ? "Unstar" : "Star note",
                            icon: active.favorite ? (
                              <StarOff size={14} />
                            ) : (
                              <Star size={14} />
                            ),
                            action: () => {
                              toggleFavorite(active.id);
                              setMoreMenuOpen(false);
                            },
                          },
                          {
                            label: active.archived ? "Restore" : "Archive",
                            icon: active.archived ? (
                              <ArchiveRestore size={14} />
                            ) : (
                              <Archive size={14} />
                            ),
                            action: () => {
                              toggleArchive(active.id);
                              setMoreMenuOpen(false);
                            },
                          },
                          {
                            label: "Export as .txt",
                            icon: <Download size={14} />,
                            action: exportNote,
                          },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={item.action}
                            className="np-btn"
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "10px 14px",
                              fontSize: 14,
                              color: t.text,
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                t.surfaceHover)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <span style={{ color: t.textMuted }}>
                              {item.icon}
                            </span>
                            {item.label}
                          </button>
                        ))}
                        <div
                          style={{
                            height: 1,
                            background: t.border,
                            margin: "4px 0",
                          }}
                        />
                        <button
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setDeleteConfirm(active.id);
                          }}
                          className="np-btn"
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            fontSize: 14,
                            color: t.danger,
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = t.dangerBg)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <Trash2 size={14} /> Delete note
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Editor surface */}
          {loading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader2 size={22} className="np-spin" style={{ opacity: 0.3 }} />
            </div>
          ) : active && showEditorPane ? (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: `radial-gradient(${t.boardDot} 1px, transparent 1px) 0 0/16px 16px, ${t.board}`,
              }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div
                style={{
                  maxWidth: 760,
                  margin: "0 auto",
                  padding: "44px 20px 96px",
                }}
              >
                {/* The note, rendered as a single large pinned card */}
                <div style={{ position: "relative" }}>
                  <PushpinIcon
                    color={cardTheme(active).pin}
                    size={30}
                    style={{
                      position: "absolute",
                      top: -15,
                      left: "50%",
                      transform: "translateX(-50%)",
                      zIndex: 2,
                      filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.3))",
                    }}
                  />
                  <div
                    style={{
                      background: dark ? t.surface : cardTheme(active).fill,
                      border: `1px solid ${dark ? t.border : cardTheme(active).border}`,
                      borderRadius: 18,
                      boxShadow: t.cardShadow,
                      padding: "36px 36px 44px",
                    }}
                  >
                    {/* Color label swatches */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 20,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: t.textFaint,
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                        }}
                      >
                        LABEL
                      </span>
                      <button
                        onClick={() => updateNote(active.id, { color: null })}
                        className="np-btn"
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${!active.color ? t.accent : t.border}`,
                          background: t.surface,
                          boxShadow: !active.color
                            ? `0 0 0 2px ${t.accentFaint}`
                            : "none",
                        }}
                        title="No label"
                      />
                      {PIN_PALETTE.map((p) => (
                        <button
                          key={p.pin}
                          onClick={() =>
                            updateNote(active.id, { color: p.pin })
                          }
                          className="np-btn"
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: p.pin,
                            outline:
                              active.color === p.pin
                                ? `2px solid ${t.text}`
                                : "none",
                            outlineOffset: 2,
                          }}
                          title={`Label: ${p.pin}`}
                        />
                      ))}
                    </div>

                    {/* Title */}
                    <input
                      value={active.title}
                      onChange={onTitleChange}
                      placeholder="Untitled note"
                      className="np-input"
                      style={{
                        width: "100%",
                        fontSize: 30,
                        fontWeight: 800,
                        lineHeight: 1.25,
                        color: t.text,
                        letterSpacing: "-0.6px",
                        marginBottom: 10,
                        fontFamily: headingFont,
                      }}
                    />

                    {/* Meta row */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "4px 14px",
                        fontSize: 12,
                        color: t.textMuted,
                        fontWeight: 600,
                        paddingBottom: 16,
                        marginBottom: 16,
                        borderBottom: `1px solid ${dark ? t.border : cardTheme(active).border}`,
                      }}
                    >
                      <span>{words} words</span>
                      <span style={{ color: t.textFaint }}>·</span>
                      <span>{chars} chars</span>
                      <span style={{ color: t.textFaint }}>·</span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={10} /> edited{" "}
                        {formatRelative(active.updatedAt)}
                      </span>
                      {active.pinned && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            color: cardTheme(active).pin,
                          }}
                        >
                          <Pin size={10} /> pinned
                        </span>
                      )}
                      {active.favorite && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            color: cardTheme(active).pin,
                          }}
                        >
                          <Star size={10} fill="currentColor" /> starred
                        </span>
                      )}
                      {active.archived && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            color: t.textMuted,
                          }}
                        >
                          <Archive size={10} /> archived
                        </span>
                      )}
                    </div>

                    {/* Tags row */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 24,
                      }}
                    >
                      <Tag size={11} color={t.textFaint} />
                      {active.tags.map((tag) => (
                        <span
                          key={tag}
                          className="np-tag-pill"
                          style={{
                            background: `${tagColor(tag)}18`,
                            color: tagColor(tag),
                            border: `1px solid ${tagColor(tag)}35`,
                          }}
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="np-btn"
                            style={{
                              color: tagColor(tag),
                              opacity: 0.7,
                              padding: 1,
                              display: "flex",
                              lineHeight: 1,
                            }}
                            title={`Remove #${tag}`}
                          >
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                      <form
                        onSubmit={addTag}
                        style={{ display: "inline-flex" }}
                      >
                        <input
                          value={tagDraft}
                          onChange={(e) => setTagDraft(e.target.value)}
                          placeholder="+ tag"
                          className="np-input"
                          style={{
                            fontSize: 11,
                            width: tagDraft ? "auto" : 44,
                            minWidth: 44,
                            maxWidth: 100,
                            color: t.textMuted,
                            fontWeight: 600,
                          }}
                        />
                      </form>
                    </div>

                    {/* Rich text editor */}
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={onEditorInput}
                      className="np-editor"
                      data-placeholder="Start writing…"
                      style={{
                        outline: "none",
                        minHeight: "40vh",
                        paddingBottom: 10,
                        fontSize: 16,
                        lineHeight: 1.75,
                        color: t.text,
                        fontFamily: bodyFont,
                        caretColor: t.accent,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                textAlign: "center",
                padding: 32,
                background: `radial-gradient(${t.boardDot} 1px, transparent 1px) 0 0/16px 16px, ${t.board}`,
              }}
            >
              <div style={{ position: "relative" }}>
                <PushpinIcon
                  color={t.accent}
                  size={26}
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.25))",
                  }}
                />
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: t.accentFaint,
                    border: `1px solid ${t.accent}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={26} color={t.accent} />
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: t.text,
                    margin: "0 0 4px",
                    fontFamily: headingFont,
                  }}
                >
                  No note selected
                </p>
                <p style={{ fontSize: 13, color: t.textMuted, margin: 0 }}>
                  Pick a card from the board or pin a new one.
                </p>
              </div>
              <button
                onClick={createNote}
                className="np-btn"
                style={{
                  background: t.accent,
                  color: "#fff",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: `0 4px 12px ${t.accent}40`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = t.accentHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = t.accent)
                }
              >
                <Plus size={14} /> New note
              </button>
            </div>
          )}

          {!isDesktop && mobilePane === "list" && !loading && (
            <button
              onClick={createNote}
              className="np-btn"
              style={{
                position: "fixed",
                right: "max(20px, env(safe-area-inset-right))",
                bottom: "calc(20px + env(safe-area-inset-bottom))",
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: t.accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 22px rgba(0,0,0,0.28)",
                zIndex: 25,
              }}
              aria-label="New note"
            >
              <Plus size={23} />
            </button>
          )}
        </main>
      </div>

      {/* ════════ MOBILE LIST PANE (full-screen board overlay) ════════ */}
      {!isDesktop && mobilePane === "list" && (
        <div
          className="np-fade"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20,
            background: `radial-gradient(${t.boardDot} 1px, transparent 1px) 0 0/14px 14px, ${t.board}`,
            color: t.text,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "18px 18px 12px",
              paddingTop: "calc(18px + env(safe-area-inset-top))",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: t.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={15} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    fontFamily: headingFont,
                  }}
                >
                  Notepad
                </span>
              </div>
              <SidebarIconBtn
                t={t}
                onClick={() => setDark((d) => !d)}
                title="Toggle theme"
              >
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </SidebarIconBtn>
            </div>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: t.textFaint,
                  pointerEvents: "none",
                }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes…"
                className="np-input"
                style={{
                  width: "100%",
                  paddingLeft: 33,
                  paddingRight: 10,
                  paddingTop: 11,
                  paddingBottom: 11,
                  fontSize: 14,
                  borderRadius: 10,
                  border: `1px solid ${t.border}`,
                  background: t.inputBg,
                  color: t.text,
                }}
              />
            </div>
            <div
              className="no-scrollbar"
              style={{ display: "flex", gap: 4, overflowX: "auto" }}
            >
              {[
                { id: "all", label: "All" },
                { id: "pinned", label: "Pinned" },
                { id: "favorite", label: "Starred" },
                { id: "archived", label: "Archive" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="np-btn"
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    fontSize: 13,
                    flexShrink: 0,
                    fontWeight: 600,
                    background: filter === f.id ? t.accent : t.surface,
                    color: filter === f.id ? "#fff" : t.textMuted,
                    border: `1px solid ${filter === f.id ? t.accent : t.border}`,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {allTags.map((tg) => (
                  <button
                    key={tg}
                    onClick={() => setActiveTag(activeTag === tg ? null : tg)}
                    className="np-btn"
                    style={{
                      padding: "4px 10px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 700,
                      border: `1px solid ${tagColor(tg)}55`,
                      color: activeTag === tg ? "#fff" : tagColor(tg),
                      background:
                        activeTag === tg ? tagColor(tg) : `${tagColor(tg)}15`,
                    }}
                  >
                    #{tg}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 16px",
              paddingBottom: "calc(90px + env(safe-area-inset-bottom))",
            }}
          >
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: 48,
                  color: t.textFaint,
                }}
              >
                <Loader2
                  size={18}
                  className="np-spin"
                  style={{ display: "block", margin: "0 auto 8px" }}
                />
                <span style={{ fontSize: 13 }}>Loading…</span>
              </div>
            )}
            {!loading && error && (
              <div
                style={{ textAlign: "center", paddingTop: 48, color: t.danger }}
              >
                <WifiOff
                  size={22}
                  style={{ display: "block", margin: "0 auto 8px" }}
                />
                <p style={{ fontSize: 13, margin: "0 0 10px" }}>{error}</p>
                <button
                  onClick={() =>
                    loadNotes({
                      filter: filter === "all" ? undefined : filter,
                      tag: activeTag || undefined,
                      search: query || undefined,
                    })
                  }
                  className="np-btn"
                  style={{
                    fontSize: 13,
                    color: t.accent,
                    textDecoration: "underline",
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && filteredNotes.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: 48,
                  color: t.textFaint,
                }}
              >
                <FileText
                  size={26}
                  style={{
                    display: "block",
                    margin: "0 auto 8px",
                    opacity: 0.35,
                  }}
                />
                <p style={{ fontSize: 13 }}>
                  Nothing yet. Tap + to pin a note.
                </p>
              </div>
            )}
            {!loading && !error && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  paddingTop: 6,
                }}
              >
                {filteredNotes.map((n) => {
                  const theme = cardTheme(n);
                  const tilt = cardTilt(n.id);
                  return (
                    <div
                      key={n.id}
                      style={{
                        position: "relative",
                        transform: `rotate(${tilt}deg)`,
                      }}
                    >
                      <PushpinIcon
                        color={theme.pin}
                        size={22}
                        style={{
                          position: "absolute",
                          top: -11,
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 2,
                          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
                        }}
                      />
                      <button
                        onClick={() => selectNote(n.id)}
                        className="np-btn np-note-card"
                        style={{
                          padding: "18px 16px 15px",
                          borderRadius: 13,
                          background: dark ? t.surface : theme.fill,
                          border: `1px solid ${dark ? t.border : theme.border}`,
                          boxShadow: t.cardShadow,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          {n.pinned && (
                            <Pin size={12} color={theme.pin} fill={theme.pin} />
                          )}
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: t.text,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              fontFamily: headingFont,
                            }}
                          >
                            {n.title || "Untitled note"}
                          </span>
                          {n.favorite && (
                            <Star
                              size={12}
                              fill={theme.pin}
                              stroke={theme.pin}
                            />
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: t.textMuted,
                            margin: "0 0 8px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {stripHtml(n.content).slice(0, 70) || "No content"}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: t.textFaint,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Clock size={10} /> {formatRelative(n.updatedAt)}
                          </span>
                          {n.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: 11,
                                color: tagColor(tag),
                                fontWeight: 700,
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={createNote}
            className="np-btn"
            style={{
              position: "absolute",
              right: "max(20px, env(safe-area-inset-right))",
              bottom: "calc(20px + env(safe-area-inset-bottom))",
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: t.accent,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 22px rgba(0,0,0,0.28)",
              zIndex: 25,
            }}
            aria-label="New note"
          >
            <Plus size={23} />
          </button>
        </div>
      )}

      {/* ════════ MOBILE FORMAT SHEET ════════ */}
      {!isDesktop && mobileFormatOpen && active && (
        <>
          <div
            className="np-fade"
            onClick={() => setMobileFormatOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 40,
            }}
          />
          <div
            className="np-slide-up"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              borderRadius: "18px 18px 0 0",
              background: t.surface,
              border: `1px solid ${t.border}`,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
              paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px 0 8px",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: t.border,
                }}
              />
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 12,
                color: t.textFaint,
                margin: "0 0 12px",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              FORMATTING
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
                padding: "0 12px",
              }}
            >
              {[
                {
                  label: "Bold",
                  icon: <Bold size={20} />,
                  action: () => exec("bold"),
                },
                {
                  label: "Italic",
                  icon: <Italic size={20} />,
                  action: () => exec("italic"),
                },
                {
                  label: "Heading",
                  icon: <Heading2 size={20} />,
                  action: () => exec("formatBlock", "<h2>"),
                },
                {
                  label: "Quote",
                  icon: <Quote size={20} />,
                  action: () => exec("formatBlock", "<blockquote>"),
                },
                {
                  label: "Bullets",
                  icon: <List size={20} />,
                  action: () => exec("insertUnorderedList"),
                },
                {
                  label: "Numbered",
                  icon: <ListOrdered size={20} />,
                  action: () => exec("insertOrderedList"),
                },
                {
                  label: "Checklist",
                  icon: <CheckSquare size={20} />,
                  action: () =>
                    exec(
                      "insertHTML",
                      '<ul style="list-style:none;padding-left:0;"><li><input type="checkbox" style="margin-right:6px;" />Task item</li></ul>',
                    ),
                },
                {
                  label: "Undo",
                  icon: <Undo2 size={20} />,
                  action: () => exec("undo"),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="np-btn"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "14px 4px",
                    borderRadius: 12,
                    color: t.text,
                    background: t.surfaceHover,
                  }}
                >
                  {item.icon}
                  <span
                    style={{
                      fontSize: 10,
                      color: t.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMobileFormatOpen(false)}
              className="np-btn"
              style={{
                width: "100%",
                padding: "14px 0",
                marginTop: 12,
                borderTop: `1px solid ${t.border}`,
                fontSize: 14,
                fontWeight: 700,
                color: t.accent,
                textAlign: "center",
              }}
            >
              Done
            </button>
          </div>
        </>
      )}

      {/* ════════ DELETE CONFIRM DIALOG ════════ */}
      {deleteConfirm && (
        <>
          <div
            className="np-fade"
            onClick={() => setDeleteConfirm(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 60,
            }}
          />
          <div
            className="np-fade"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(340px, 90vw)",
              borderRadius: 16,
              background: t.surface,
              border: `1px solid ${t.border}`,
              boxShadow: "0 16px 64px rgba(0,0,0,0.22)",
              padding: "24px 24px 20px",
              zIndex: 61,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: t.dangerBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Trash2 size={20} color={t.danger} />
            </div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: t.text,
                margin: "0 0 6px",
                fontFamily: headingFont,
              }}
            >
              Delete this note?
            </p>
            <p
              style={{
                fontSize: 13,
                color: t.textMuted,
                margin: "0 0 20px",
                lineHeight: 1.5,
              }}
            >
              "
              {notes.find((n) => n.id === deleteConfirm)?.title ||
                "Untitled note"}
              " will be permanently deleted.
            </p>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setDeleteConfirm(null)}
                className="np-btn"
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${t.border}`,
                  color: t.textMuted,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteNote(deleteConfirm)}
                className="np-btn"
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  background: t.danger,
                  color: "#fff",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════ TOAST ════════ */}
      {toast && (
        <div
          className="np-fade"
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: isDesktop ? 20 : "calc(82px + env(safe-area-inset-bottom))",
            padding: "10px 18px",
            borderRadius: 24,
            background: toastType === "error" ? t.danger : t.text,
            color: dark ? "#16181C" : "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            maxWidth: "90vw",
            textAlign: "center",
            zIndex: 70,
            display: "flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
          }}
        >
          {toastType === "success" && <Sparkles size={13} />}
          {toastType === "error" && <WifiOff size={13} />}
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── Small reusable buttons ───────────────────────────────────── */
function SidebarIconBtn({ children, onClick, title, t }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="np-btn"
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: t.textMuted,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.surfaceActive;
        e.currentTarget.style.color = t.text;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = t.textMuted;
      }}
    >
      {children}
    </button>
  );
}

function TopBarBtn({ children, onClick, title, t, active, danger }) {
  const baseColor = danger ? t.danger : active ? "#fff" : t.textMuted;
  const baseBg = active ? t.accent : "transparent";
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="np-btn"
      style={{
        width: 34,
        height: 34,
        borderRadius: 7,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: baseColor,
        background: baseBg,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = danger
            ? t.dangerBg
            : t.surfaceHover;
          e.currentTarget.style.color = danger ? t.danger : t.text;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = baseBg;
        e.currentTarget.style.color = baseColor;
      }}
    >
      {children}
    </button>
  );
}