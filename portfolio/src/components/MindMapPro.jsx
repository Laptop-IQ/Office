/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  getEdgeAnimationStyle,
  EdgeAnimationKeyframes,
  AnimatedDotOverlay,
} from "./MindMapPro/EdgeAnimations";
import Icon from "./MindMapPro/Icon";
import Toolbar from "./MindMapPro/Toolbar";
import RightPanel from "./MindMapPro/RightPanel";

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = `${import.meta.env.VITE_API_URL}/mindmap`;
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const api = {
  createMap: (title) =>
    fetch(API_BASE, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title }),
    }).then((r) => r.json()),
  getMap: (mapId) =>
    fetch(`${API_BASE}/${mapId}`, { headers: authHeaders() }).then((r) =>
      r.json(),
    ),
  syncMap: (mapId, nodes, edges) =>
    fetch(`${API_BASE}/${mapId}/sync`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ nodes, edges }),
    }).then((r) => r.json()),
  addNode: (mapId, payload) =>
    fetch(`${API_BASE}/${mapId}/node`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
  updateNode: (mapId, nodeId, updates) =>
    fetch(`${API_BASE}/${mapId}/node/${nodeId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    }).then((r) => r.json()),
  deleteNode: (mapId, nodeId) =>
    fetch(`${API_BASE}/${mapId}/node/${nodeId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then((r) => r.json()),
  addEdge: (mapId, payload) =>
    fetch(`${API_BASE}/${mapId}/edge`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
  deleteEdge: (mapId, edgeId) =>
    fetch(`${API_BASE}/${mapId}/edge/${edgeId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then((r) => r.json()),
};

// ─── Utilities & constants ────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

const PAGE_EMOJIS = [
  "📄",
  "🧠",
  "⚡",
  "🎯",
  "🗂️",
  "📅",
  "🔬",
  "🚀",
  "💡",
  "🌟",
  "🔥",
  "📊",
  "🎨",
  "🏆",
  "💎",
  "🌈",
];
const PAGE_COLORS = [
  "#7c3aed",
  "#1d4ed8",
  "#0d9488",
  "#d97706",
  "#e11d48",
  "#4d7c0f",
  "#c026d3",
  "#0e7490",
  "#ea580c",
  "#64748b",
];

// PALETTES is used in addChild() to pick new-node colours
const PALETTES = {
  Violet: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd"],
  Coral: ["#e11d48", "#f43f5e", "#fb7185", "#fda4af"],
  Teal: ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"],
  Amber: ["#d97706", "#f59e0b", "#fbbf24", "#fcd34d"],
  Indigo: ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd"],
  Lime: ["#4d7c0f", "#65a30d", "#84cc16", "#a3e635"],
  Rose: ["#9f1239", "#be123c", "#e11d48", "#fb7185"],
  Cyan: ["#0e7490", "#0891b2", "#06b6d4", "#22d3ee"],
};

// THEMES drives CT (current theme) inside MapCanvas and T inside MindMapPro
const THEMES = {
  Obsidian: {
    bg: "#0a0a0f",
    surface: "#111118",
    panel: "#13131c",
    border: "#1e1e30",
    text: "#e2e8f0",
    muted: "#64748b",
    accent: "#7c3aed",
    grid: "#1a1a28",
  },
  Midnight: {
    bg: "#000814",
    surface: "#001233",
    panel: "#001845",
    border: "#0a2463",
    text: "#caf0f8",
    muted: "#4895ef",
    accent: "#4361ee",
    grid: "#001028",
  },
  Graphite: {
    bg: "#111111",
    surface: "#1a1a1a",
    panel: "#222222",
    border: "#333333",
    text: "#f5f5f5",
    muted: "#888888",
    accent: "#ff4757",
    grid: "#181818",
  },
  Forest: {
    bg: "#0a1628",
    surface: "#0f2033",
    panel: "#122440",
    border: "#1a3a5c",
    text: "#e2f0fb",
    muted: "#5b9fd6",
    accent: "#00b4d8",
    grid: "#0d1e30",
  },
  Abyss: {
    bg: "#060612",
    surface: "#0d0d2b",
    panel: "#10103a",
    border: "#1c1c50",
    text: "#e0e7ff",
    muted: "#6366f1",
    accent: "#818cf8",
    grid: "#0e0e22",
  },
  Dawn: {
    bg: "#faf7f2",
    surface: "#f2ede4",
    panel: "#ede7db",
    border: "#d4c9b8",
    text: "#1a1208",
    muted: "#7c6e5a",
    accent: "#b45309",
    grid: "#e8e0d4",
  },
  Ocean: {
    bg: "#020b18",
    surface: "#041426",
    panel: "#061c36",
    border: "#0d2d50",
    text: "#e0f2fe",
    muted: "#38bdf8",
    accent: "#0ea5e9",
    grid: "#051a2e",
  },
  Neon: {
    bg: "#050508",
    surface: "#0a0a14",
    panel: "#0f0f1e",
    border: "#1a1a35",
    text: "#f0fdf4",
    muted: "#4ade80",
    accent: "#22c55e",
    grid: "#0d0d1a",
  },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "info") => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  };
  return { toasts, add };
}

function ToastStack({ toasts, T }) {
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 64,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              t.type === "success"
                ? "#166534"
                : t.type === "error"
                  ? "#7f1d1d"
                  : T.panel,
            border: `1px solid ${t.type === "success" ? "#22c55e" : t.type === "error" ? "#ef4444" : T.border}`,
            color: T.text,
            padding: "8px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            animation: "fadeUp 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, T, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  });
  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 9000,
        minWidth: 190,
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: "4px 0",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {items.map((item, i) =>
        item === "---" ? (
          <div
            key={i}
            style={{ height: 1, background: T.border, margin: "4px 0" }}
          />
        ) : (
          <button
            key={i}
            onClick={() => {
              item.action();
              onClose();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "8px 14px",
              background: "transparent",
              border: "none",
              color: item.danger ? "#ef4444" : T.text,
              fontSize: 13,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.surface)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {item.icon && <Icon name={item.icon} size={13} />}
            <span>{item.label}</span>
            {item.shortcut && (
              <span style={{ marginLeft: "auto", opacity: 0.4, fontSize: 11 }}>
                {item.shortcut}
              </span>
            )}
          </button>
        ),
      )}
    </div>
  );
}

// ─── Sync Badge ───────────────────────────────────────────────────────────────
function SyncBadge({ status, T }) {
  const cfg = {
    idle: { label: "Saved", color: "#22c55e" },
    saving: { label: "Saving…", color: T.muted },
    error: { label: "Sync err", color: "#ef4444" },
  };
  const c = cfg[status] || cfg.idle;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "0 12px",
        fontSize: 11,
        color: c.color,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.color,
          opacity: status === "saving" ? 0.6 : 1,
        }}
      />
      {c.label}
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen({ T, message }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: T.bg,
        color: T.text,
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: `3px solid ${T.border}`,
          borderTop: `3px solid ${T.accent}`,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: 14, color: T.muted }}>{message}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────
function HistoryPanel({
  history,
  redoStack,
  T,
  onUndo,
  onRedo,
  onClose,
  panelOpen = false,
}) {
  const PANEL_W = 268;
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: panelOpen ? PANEL_W + 12 : 12,
        width: 220,
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 500,
        overflow: "hidden",
        transition: "right 0.2s ease",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
          History
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: T.muted,
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icon name="x" size={12} />
        </button>
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto", padding: "6px 0" }}>
        {redoStack.length > 0 &&
          [...redoStack]
            .map((_, i) => (
              <div
                key={`redo-${i}`}
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  color: T.muted,
                  opacity: 0.4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
                onClick={() => {
                  for (let j = 0; j <= i; j++) onRedo();
                }}
              >
                <Icon name="redo" size={11} /> Step{" "}
                {history.length + redoStack.length - i} (redo)
              </div>
            ))
            .reverse()}
        {history.length === 0 && redoStack.length === 0 && (
          <div
            style={{
              padding: "16px 14px",
              fontSize: 12,
              color: T.muted,
              textAlign: "center",
            }}
          >
            No history yet
          </div>
        )}
        {[...history]
          .map((_, i) => (
            <div
              key={`hist-${i}`}
              style={{
                padding: "6px 14px",
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                background:
                  i === history.length - 1 ? T.surface : "transparent",
                color: i === history.length - 1 ? T.accent : T.text,
              }}
              onClick={() => {
                const steps = history.length - 1 - i;
                for (let j = 0; j < steps; j++) onUndo();
              }}
              onMouseEnter={(e) => {
                if (i !== history.length - 1)
                  e.currentTarget.style.background = T.surface + "60";
              }}
              onMouseLeave={(e) => {
                if (i !== history.length - 1)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {i === history.length - 1 ? (
                <Icon name="eye" size={11} />
              ) : (
                <Icon name="history" size={11} />
              )}
              Step {i + 1} {i === history.length - 1 ? "(current)" : ""}
            </div>
          ))
          .reverse()}
      </div>
    </div>
  );
}

// ─── Page Templates ───────────────────────────────────────────────────────────
const makeRootNode = (title = "Central Idea") => ({
  id: "root",
  text: title,
  x: 2000,
  y: 2000,
  color: "#7c3aed",
  shape: "rounded",
  fontSize: 16,
  bold: true,
  italic: false,
  note: "",
  tag: "",
  emoji: "",
  collapsed: false,
  locked: false,
  image: "",
  fontFamily: "Inter",
  groupId: null,
});

const PAGE_TEMPLATES = [
  {
    id: "blank",
    label: "Blank page",
    emoji: "📄",
    desc: "Empty canvas, start fresh",
    nodes: (title) => [makeRootNode(title)],
    edges: () => [],
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    emoji: "⚡",
    desc: "Central idea with 4 branches",
    nodes: (title) => {
      const cx = 2000,
        cy = 2000;
      const branches = ["Ideas", "Problems", "Solutions", "Next Steps"];
      const colors = ["#7c3aed", "#0d9488", "#d97706", "#e11d48"];
      const angles = [-120, -60, 60, 120];
      return [
        makeRootNode(title),
        ...branches.map((b, i) => ({
          id: `b${i}`,
          text: b,
          color: colors[i],
          shape: "rounded",
          fontSize: 14,
          bold: false,
          italic: false,
          x: cx + Math.cos((angles[i] * Math.PI) / 180) * 220,
          y: cy + Math.sin((angles[i] * Math.PI) / 180) * 220,
          note: "",
          tag: "",
          emoji: "",
          collapsed: false,
          locked: false,
          image: "",
          fontFamily: "Inter",
          groupId: null,
        })),
      ];
    },
    edges: () =>
      ["b0", "b1", "b2", "b3"].map((to, i) => ({
        id: `e${i}`,
        from: "root",
        to,
        label: "",
        style: "curve",
      })),
  },
  {
    id: "project",
    label: "Project Plan",
    emoji: "🗂️",
    desc: "Goals, tasks, timeline, risks",
    nodes: (title) => {
      const cx = 2000,
        cy = 2000;
      const sections = [
        { text: "Goals", color: "#1d4ed8", a: -130 },
        { text: "Tasks", color: "#0d9488", a: -50 },
        { text: "Timeline", color: "#d97706", a: 50 },
        { text: "Risks", color: "#e11d48", a: 130 },
      ];
      return [
        makeRootNode(title),
        ...sections.map((s, i) => ({
          id: `p${i}`,
          text: s.text,
          color: s.color,
          shape: "rounded",
          fontSize: 14,
          bold: true,
          italic: false,
          x: cx + Math.cos((s.a * Math.PI) / 180) * 230,
          y: cy + Math.sin((s.a * Math.PI) / 180) * 230,
          note: "",
          tag: "",
          emoji: "",
          collapsed: false,
          locked: false,
          image: "",
          fontFamily: "Inter",
          groupId: null,
        })),
      ];
    },
    edges: () =>
      ["p0", "p1", "p2", "p3"].map((to, i) => ({
        id: `e${i}`,
        from: "root",
        to,
        label: "",
        style: "curve",
      })),
  },
  {
    id: "weekly",
    label: "Weekly Review",
    emoji: "📅",
    desc: "Mon–Sun with a review node",
    nodes: (title) => {
      const cx = 2000,
        cy = 2000;
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayColors = [
        "#7c3aed",
        "#1d4ed8",
        "#0d9488",
        "#d97706",
        "#e11d48",
        "#9f1239",
        "#4d7c0f",
      ];
      return [
        makeRootNode(title),
        ...days.map((d, i) => {
          const angle = (((i / 7) * 360 - 90) * Math.PI) / 180;
          return {
            id: `d${i}`,
            text: d,
            color: dayColors[i],
            shape: "pill",
            fontSize: 13,
            bold: false,
            italic: false,
            x: cx + Math.cos(angle) * 240,
            y: cy + Math.sin(angle) * 240,
            note: "",
            tag: "",
            emoji: "",
            collapsed: false,
            locked: false,
            image: "",
            fontFamily: "Inter",
            groupId: null,
          };
        }),
        {
          id: "review",
          text: "Review & Reflect",
          color: "#c026d3",
          shape: "rounded",
          fontSize: 14,
          bold: true,
          italic: false,
          x: cx,
          y: cy + 320,
          note: "",
          tag: "",
          emoji: "✨",
          collapsed: false,
          locked: false,
          image: "",
          fontFamily: "Inter",
          groupId: null,
        },
      ];
    },
    edges: () => [
      ...Array.from({ length: 7 }, (_, i) => ({
        id: `ew${i}`,
        from: "root",
        to: `d${i}`,
        label: "",
        style: "straight",
      })),
      { id: "er", from: "root", to: "review", label: "", style: "curve" },
    ],
  },
  {
    id: "swot",
    label: "SWOT Analysis",
    emoji: "🔬",
    desc: "Strengths, weaknesses, opportunities, threats",
    nodes: (title) => {
      const cx = 2000,
        cy = 2000;
      const q = [
        { text: "Strengths 💪", color: "#0d9488", x: cx - 220, y: cy - 160 },
        { text: "Weaknesses ⚠️", color: "#d97706", x: cx + 220, y: cy - 160 },
        {
          text: "Opportunities 🚀",
          color: "#1d4ed8",
          x: cx - 220,
          y: cy + 160,
        },
        { text: "Threats 🔥", color: "#e11d48", x: cx + 220, y: cy + 160 },
      ];
      return [
        makeRootNode(title),
        ...q.map((s, i) => ({
          id: `q${i}`,
          text: s.text,
          color: s.color,
          shape: "rounded",
          fontSize: 14,
          bold: true,
          italic: false,
          x: s.x,
          y: s.y,
          note: "",
          tag: "",
          emoji: "",
          collapsed: false,
          locked: false,
          image: "",
          fontFamily: "Inter",
          groupId: null,
        })),
      ];
    },
    edges: () =>
      ["q0", "q1", "q2", "q3"].map((to, i) => ({
        id: `eq${i}`,
        from: "root",
        to,
        label: "",
        style: "elbow",
      })),
  },
];

// ─── Add Page Popup ───────────────────────────────────────────────────────────
function AddPagePopup({ T, onAdd, onClose, pageCount }) {
  const [step, setStep] = useState("pick");
  const [chosen, setChosen] = useState(null);
  const [name, setName] = useState("");
  const [pageEmoji, setPageEmoji] = useState("📄");
  const [pageColor, setPageColor] = useState(PAGE_COLORS[0]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const nameRef = useRef(),
    popupRef = useRef();

  useEffect(() => {
    const h = (e) => {
      if (!popupRef.current?.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  useEffect(() => {
    if (step === "name") setTimeout(() => nameRef.current?.focus(), 60);
  }, [step]);

  const pickTemplate = (tpl) => {
    setChosen(tpl);
    setName(tpl.id === "blank" ? `Page ${pageCount + 1}` : tpl.label);
    setPageEmoji(tpl.emoji);
    setStep("name");
  };
  const confirm = () => {
    if (!chosen) return;
    onAdd(chosen, name.trim() || chosen.label, pageEmoji, pageColor);
    onClose();
  };

  return (
    <div
      ref={popupRef}
      style={{
        position: "absolute",
        bottom: 48,
        left: 0,
        width: 360,
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        boxShadow: "0 -4px 32px rgba(0,0,0,0.5)",
        zIndex: 200,
        overflow: "hidden",
        animation: "popupSlideUp 0.18s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {step === "pick" && (
        <>
          <div
            style={{
              padding: "12px 16px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: T.muted,
              }}
            >
              New page
            </span>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: T.muted,
                cursor: "pointer",
                display: "flex",
                padding: 2,
              }}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
          <div style={{ padding: "8px 8px 10px" }}>
            {PAGE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => pickTemplate(tpl)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "10px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.surface)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {tpl.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                      marginBottom: 2,
                    }}
                  >
                    {tpl.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tpl.desc}
                  </div>
                </div>
                <Icon name="chevronR" size={12} />
              </button>
            ))}
          </div>
        </>
      )}

      {step === "name" && chosen && (
        <>
          <div
            style={{
              padding: "12px 16px 8px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <button
              onClick={() => setStep("pick")}
              style={{
                background: "transparent",
                border: "none",
                color: T.muted,
                cursor: "pointer",
                display: "flex",
                padding: 2,
              }}
            >
              <Icon name="chevronL" size={14} />
            </button>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: T.muted,
              }}
            >
              {chosen.emoji} {chosen.label}
            </span>
          </div>
          <div style={{ padding: "14px 16px 16px" }}>
            <label
              style={{
                fontSize: 11,
                color: T.muted,
                display: "block",
                marginBottom: 6,
              }}
            >
              Page icon & color
            </label>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                alignItems: "flex-start",
              }}
            >
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    border: `2px solid ${T.border}`,
                    background: T.surface,
                    fontSize: 22,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pageEmoji}
                </button>
                {showEmojiPicker && (
                  <div
                    style={{
                      position: "absolute",
                      top: 54,
                      left: 0,
                      background: T.panel,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      padding: 8,
                      zIndex: 300,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      width: 200,
                    }}
                  >
                    {PAGE_EMOJIS.map((em) => (
                      <button
                        key={em}
                        onClick={() => {
                          setPageEmoji(em);
                          setShowEmojiPicker(false);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          border: "none",
                          background:
                            em === pageEmoji ? T.surface : "transparent",
                          borderRadius: 6,
                          fontSize: 18,
                          cursor: "pointer",
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 5, flex: 1 }}
              >
                {PAGE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPageColor(c)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: "none",
                      background: c,
                      cursor: "pointer",
                      outline:
                        pageColor === c
                          ? "2px solid white"
                          : "2px solid transparent",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
            <label
              style={{
                fontSize: 11,
                color: T.muted,
                display: "block",
                marginBottom: 6,
              }}
            >
              Page name
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirm();
                if (e.key === "Escape") onClose();
              }}
              placeholder={chosen.label}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: `1px solid ${T.accent}`,
                background: T.surface,
                color: T.text,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                boxShadow: `0 0 0 2px ${T.accent}30`,
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 7,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.muted,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                style={{
                  flex: 2,
                  padding: "8px",
                  borderRadius: 7,
                  border: "none",
                  background: T.accent,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Icon name="plus" size={13} /> Create page
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page Tab Context Menu ────────────────────────────────────────────────────
function PageTabContextMenu({
  x,
  y,
  page,
  pages,
  T,
  onRename,
  onDelete,
  onDuplicate,
  onChangeColor,
  onChangeEmoji,
  onClose,
}) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  });
  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 9100,
        minWidth: 200,
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: "4px 0",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          padding: "8px 14px 4px",
          fontSize: 11,
          color: T.muted,
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}
      >
        PAGE OPTIONS
      </div>
      {[
        {
          label: "Rename",
          icon: "pencil",
          action: () => {
            onRename(page.id);
            onClose();
          },
        },
        {
          label: "Duplicate",
          icon: "copy",
          action: () => {
            onDuplicate(page.id);
            onClose();
          },
        },
      ].map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 14px",
            background: "transparent",
            border: "none",
            color: T.text,
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.surface)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Icon name={item.icon} size={13} />
          <span>{item.label}</span>
        </button>
      ))}
      <div style={{ padding: "6px 14px 4px", fontSize: 10, color: T.muted }}>
        Icon
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          padding: "0 10px 8px",
        }}
      >
        {PAGE_EMOJIS.map((em) => (
          <button
            key={em}
            onClick={() => {
              onChangeEmoji(page.id, em);
              onClose();
            }}
            style={{
              width: 28,
              height: 28,
              border: "none",
              background: em === page.emoji ? T.surface : "transparent",
              borderRadius: 6,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            {em}
          </button>
        ))}
      </div>
      <div style={{ padding: "4px 14px 4px", fontSize: 10, color: T.muted }}>
        Color
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          padding: "0 10px 10px",
        }}
      >
        {PAGE_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              onChangeColor(page.id, c);
              onClose();
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              border: "none",
              background: c,
              cursor: "pointer",
              outline:
                page.color === c ? "2px solid white" : "2px solid transparent",
              outlineOffset: 2,
            }}
          />
        ))}
      </div>
      {pages.length > 1 && (
        <>
          <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
          <button
            onClick={() => {
              onDelete(page.id);
              onClose();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "8px 14px",
              background: "transparent",
              border: "none",
              color: "#ef4444",
              fontSize: 13,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.surface)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Icon name="trash" size={13} />
            <span>Delete page</span>
          </button>
        </>
      )}
    </div>
  );
}

// ─── Page Tab Bar ─────────────────────────────────────────────────────────────
function PageTabBar({
  pages,
  activePageId,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
  onDuplicate,
  onChangeColor,
  onChangeEmoji,
  T,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [tabCtxMenu, setTabCtxMenu] = useState(null);
  const editRef = useRef();

  const startEdit = (page, e) => {
    e.stopPropagation();
    setEditingId(page.id);
    setEditName(page.title);
    setTimeout(() => editRef.current?.focus(), 30);
  };
  const commitEdit = () => {
    if (editingId && editName.trim()) onRename(editingId, editName.trim());
    setEditingId(null);
  };
  const handleContextMenu = (e, page) => {
    e.preventDefault();
    e.stopPropagation();
    setTabCtxMenu({ x: e.clientX, y: e.clientY - 180, page });
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        display: "flex",
        alignItems: "stretch",
        background: T.panel,
        borderTop: `1px solid ${T.border}`,
        zIndex: 50,
      }}
    >
      {pages.map((page) => {
        const isActive = page.id === activePageId;
        const accentColor = page.color || T.accent;
        return (
          <div
            key={page.id}
            onClick={() => onSwitch(page.id)}
            onContextMenu={(e) => handleContextMenu(e, page)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              borderRight: `1px solid ${T.border}`,
              background: isActive ? T.surface : "transparent",
              borderTop: isActive
                ? `2px solid ${accentColor}`
                : "2px solid transparent",
              position: "relative",
              minWidth: 90,
              maxWidth: 190,
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.background = T.surface + "80";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = "transparent";
            }}
          >
            <span
              style={{
                fontSize: 14,
                flexShrink: 0,
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {page.emoji || "📄"}
            </span>
            {editingId === page.id ? (
              <input
                ref={editRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: T.text,
                  fontSize: 12,
                  width: 70,
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <span
                onDoubleClick={(e) => startEdit(page, e)}
                style={{
                  fontSize: 12,
                  color: isActive ? T.text : T.muted,
                  fontWeight: isActive ? 600 : 400,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title="Double-click to rename"
              >
                {page.title}
              </span>
            )}
            {pages.length > 1 && isActive && editingId !== page.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(page.id);
                }}
                className="tab-close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.muted,
                  cursor: "pointer",
                  padding: "2px",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  opacity: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.muted;
                  e.currentTarget.style.opacity = "0";
                }}
              >
                <Icon name="x" size={11} />
              </button>
            )}
          </div>
        );
      })}

      {/* New page button */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setShowPopup((v) => !v)}
          title="Add new page"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: "100%",
            padding: "0 14px",
            background: showPopup ? T.surface : "transparent",
            border: "none",
            borderRight: `1px solid ${T.border}`,
            color: showPopup ? T.accent : T.muted,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            transition: "background 0.12s,color 0.12s",
          }}
          onMouseEnter={(e) => {
            if (!showPopup) {
              e.currentTarget.style.background = T.surface;
              e.currentTarget.style.color = T.text;
            }
          }}
          onMouseLeave={(e) => {
            if (!showPopup) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = T.muted;
            }
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: showPopup ? T.accent : "transparent",
              border: `1.5px solid ${showPopup ? T.accent : T.muted}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.12s,border-color 0.12s",
              flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24">
              <path
                d="M12 5v14M5 12h14"
                stroke={showPopup ? "#fff" : "currentColor"}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 12 }}>New page</span>
        </button>
        {showPopup && (
          <AddPagePopup
            T={T}
            onAdd={(tpl, name, emoji, color) => {
              onAdd(tpl, name, emoji, color);
              setShowPopup(false);
            }}
            onClose={() => setShowPopup(false)}
            pageCount={pages.length}
          />
        )}
      </div>

      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontSize: 11,
          color: T.muted,
          flexShrink: 0,
          borderLeft: `1px solid ${T.border}`,
        }}
      >
        {pages.length} {pages.length === 1 ? "page" : "pages"}
      </div>

      {tabCtxMenu && (
        <PageTabContextMenu
          x={tabCtxMenu.x}
          y={tabCtxMenu.y}
          page={tabCtxMenu.page}
          pages={pages}
          T={T}
          onRename={(id) => {
            const p = pages.find((x) => x.id === id);
            if (p) {
              setEditingId(id);
              setEditName(p.title);
              setTimeout(() => editRef.current?.focus(), 80);
            }
          }}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onChangeColor={onChangeColor}
          onChangeEmoji={onChangeEmoji}
          onClose={() => setTabCtxMenu(null)}
        />
      )}
      <style>{`div[style*="minWidth:90"]:hover .tab-close { opacity: 0.5 !important; }`}</style>
    </div>
  );
}

// ─── Map Canvas ───────────────────────────────────────────────────────────────
function MapCanvas({
  mapId,
  pageId,
  initialNodes,
  initialEdges,
  initialGroups,
  theme,
  T,
  onThemeChange, // ← saves theme to localStorage via MindMapPro
  presentMode,
  setPresentMode,
  onSyncNodes,
  onSyncEdges,
  onSyncGroups,
}) {
  const CANVAS = 4000;
  const SVG_W = 900,
    SVG_H = 600;

  const [nodes, setNodes] = useState(initialNodes ?? []);
  const [edges, setEdges] = useState(initialEdges ?? []);
  const [groups, setGroups] = useState(initialGroups ?? []);
  const [selected, setSelected] = useState("root");
  const [multiSel, setMultiSel] = useState(new Set(["root"]));
  const [dragging, setDragging] = useState(null);
  const [linking, setLinking] = useState(null);
  const [viewBox, setViewBox] = useState({
    x: CANVAS / 2 - 450,
    y: CANVAS / 2 - 300,
    w: 900,
    h: 600,
  });
  const [panStart, setPanStart] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [mode, setMode] = useState("select");
  const [edgeStyle, setEdgeStyle] = useState("curve");
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [palette, setPalette] = useState("Violet");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [edgeAnimStyle, setEdgeAnimStyle] = useState("none");
  const [edgeLabelEdit, setEdgeLabelEdit] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [addBtnHover, setAddBtnHover] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [showHistory, setShowHistory] = useState(false);
  const [presentIdx, setPresentIdx] = useState(0);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const svgRef = useRef();
  const editRef = useRef();
  const syncTimer = useRef(null);
  const hoverLeaveTimer = useRef(null);
  const zoomAnimRef = useRef(null); // rAF id for smooth viewBox animations
  const zoomTargetRef = useRef(null); // target viewBox for smooth animations
  const visibleNodesRef = useRef([]); // always-current visibleNodes for presentNav closure
  const { toasts, add: toast } = useToast();

  // CT is fully controlled by MindMapPro (theme → T prop → CT here)
  const CT = T;
  useEffect(() => {
    onSyncNodes(nodes);
  }, [nodes]);
  useEffect(() => {
    onSyncEdges(edges);
  }, [edges]);
  useEffect(() => {
    onSyncGroups(groups);
  }, [groups]);

  // When present mode activates → reset index + show full map first
  useEffect(() => {
    if (presentMode) {
      setPresentIdx(0);
      if (zoomAnimRef.current) cancelAnimationFrame(zoomAnimRef.current);
      zoomTargetRef.current = null;
      fitAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentMode]);

  // Auto-fit on mount so the map is always visible without pressing "Fit" manually
  useEffect(() => {
    if (nodes.length > 0) {
      const t = setTimeout(fitAll, 350); // small delay → DOM fully painted
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only (MapCanvas remounts on page switch via key=)

  const selectedNode = nodes.find((n) => n.id === selected);
  const searchHits = searchQ
    ? new Set(
        nodes
          .filter((n) => n.text.toLowerCase().includes(searchQ.toLowerCase()))
          .map((n) => n.id),
      )
    : new Set();

  const snap = (v) => (snapToGrid ? Math.round(v / 20) * 20 : v);

  const scheduleSync = useCallback(
    (nextNodes, nextEdges) => {
      if (!mapId) return;
      clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(async () => {
        setSyncStatus("saving");
        try {
          const res = await api.syncMap(mapId, nextNodes, nextEdges);
          if (!res.success) throw new Error(res.message);
          setSyncStatus("idle");
        } catch {
          setSyncStatus("error");
          toast("Auto-save failed", "error");
        }
      }, 1200);
    },
    [mapId],
  );

  const snapshot = useCallback(() => {
    setHistory((h) => [
      ...h.slice(-40),
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        groups: JSON.parse(JSON.stringify(groups)),
      },
    ]);
    setRedoStack([]);
  }, [nodes, edges, groups]);

  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [{ nodes, edges, groups }, ...r.slice(0, 39)]);
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setGroups(prev.groups || []);
    setHistory((h) => h.slice(0, -1));
    scheduleSync(prev.nodes, prev.edges);
    toast("Undone");
  }, [history, nodes, edges, groups, scheduleSync]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[0];
    setHistory((h) => [...h, { nodes, edges, groups }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setGroups(next.groups || []);
    setRedoStack((r) => r.slice(1));
    scheduleSync(next.nodes, next.edges);
    toast("Redone");
  }, [redoStack, nodes, edges, groups, scheduleSync]);

  const svgPt = (e) => {
    const svg = svgRef.current,
      r = svg.getBoundingClientRect();
    return {
      x: viewBox.x + ((e.clientX - r.left) / r.width) * viewBox.w,
      y: viewBox.y + ((e.clientY - r.top) / r.height) * viewBox.h,
    };
  };

  const doZoom = useCallback((factor, centerPt) => {
    setViewBox((v) => {
      const pt = centerPt || { x: v.x + v.w / 2, y: v.y + v.h / 2 };
      const nw = Math.min(Math.max(v.w * factor, 300), 6000);
      const nh = Math.min(Math.max(v.h * factor, 200), 4000);
      setZoomLevel(Math.round((SVG_W / nw) * 100));
      return {
        x: pt.x - (pt.x - v.x) * (nw / v.w),
        y: pt.y - (pt.y - v.y) * (nh / v.h),
        w: nw,
        h: nh,
      };
    });
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      doZoom(e.deltaY > 0 ? 1.08 : 0.92, svgPt(e));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  /**
   * Core lerp animation engine — smoothly moves viewBox toward targetVB.
   * lerp = 0.12 → ease-out curve, arrives in ~35 frames at 60 fps.
   * onDone is called once when the animation settles.
   */
  const smoothZoom = useCallback((targetVB, onDone) => {
    zoomTargetRef.current = targetVB;
    if (zoomAnimRef.current) cancelAnimationFrame(zoomAnimRef.current);
    const step = () => {
      const t = zoomTargetRef.current;
      if (!t) return;
      setViewBox((curr) => {
        const L = 0.12;
        const nx = curr.x + (t.x - curr.x) * L;
        const ny = curr.y + (t.y - curr.y) * L;
        const nw = curr.w + (t.w - curr.w) * L;
        const nh = curr.h + (t.h - curr.h) * L;
        // settled?
        if (
          Math.abs(t.x - nx) < 0.4 &&
          Math.abs(t.y - ny) < 0.4 &&
          Math.abs(t.w - nw) < 0.4 &&
          Math.abs(t.h - nh) < 0.4
        ) {
          zoomAnimRef.current = null;
          if (onDone) onDone(t);
          return t;
        }
        zoomAnimRef.current = requestAnimationFrame(step);
        return { x: nx, y: ny, w: nw, h: nh };
      });
    };
    zoomAnimRef.current = requestAnimationFrame(step);
  }, []);

  /** Smoothly fit all nodes into view */
  const fitAll = useCallback(
    (silent = false) => {
      if (!nodes.length) return;
      const xs = nodes.map((n) => n.x),
        ys = nodes.map((n) => n.y),
        pad = 120;
      const fw = Math.max(Math.max(...xs) - Math.min(...xs) + pad * 2, 400);
      const fh = Math.max(Math.max(...ys) - Math.min(...ys) + pad * 2, 300);
      smoothZoom(
        { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: fw, h: fh },
        () => setZoomLevel(Math.round((SVG_W / fw) * 100)),
      );
      if (!silent) toast("Fit to screen");
    },
    [nodes, smoothZoom],
  );

  const focusNode = (id) => {
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    smoothZoom({
      x: n.x - viewBox.w / 2,
      y: n.y - viewBox.h / 2,
      w: viewBox.w,
      h: viewBox.h,
    });
    setSelected(id);
    setMultiSel(new Set([id]));
  };

  /** Smoothly pan+zoom to a specific node (used by present mode navigation) */
  const smoothGoTo = useCallback(
    (node, zoomScale = 1) => {
      if (!node) return;
      smoothZoom({
        x: node.x - SVG_W / zoomScale / 2,
        y: node.y - SVG_H / zoomScale / 2,
        w: SVG_W / zoomScale,
        h: SVG_H / zoomScale,
      });
    },
    [smoothZoom],
  );

  /** Navigate to prev / next node in present mode */
  const presentNav = useCallback(
    (dir) => {
      // Use ref so this callback is never stale and avoids TDZ
      // (visibleNodes is computed later in the render body)
      const vNodes = visibleNodesRef.current;
      if (!vNodes.length) return;
      setPresentIdx((prev) => {
        const next = (prev + dir + vNodes.length) % vNodes.length;
        smoothGoTo(vNodes[next], 1.15);
        return next;
      });
    },
    [smoothGoTo],
  ); // ← no visibleNodes dep → no TDZ

  const addChild = useCallback(
    async (parentId, label = "New Idea") => {
      const pid = parentId || selected;
      if (!pid) return;
      const parent = nodes.find((n) => n.id === pid);
      if (!parent) return;
      snapshot();
      const childCount = edges.filter((e) => e.from === pid).length;
      const angle = ((childCount * 50 - 80) * Math.PI) / 180;
      const colorSet = PALETTES[palette];
      const color = colorSet[childCount % colorSet.length];
      const tempId = uid(),
        tempEdgeId = uid();
      // text starts empty — user types fresh when edit opens
      const newNode = {
        id: tempId,
        text: "",
        x: snap(parent.x + Math.cos(angle) * 200),
        y: snap(parent.y + Math.sin(angle) * 200),
        color,
        shape: "rounded",
        fontSize: 14,
        bold: false,
        italic: false,
        note: "",
        tag: "",
        emoji: "",
        collapsed: false,
        locked: false,
        image: "",
        fontFamily: "Inter",
        groupId: null,
      };
      const newEdge = {
        id: tempEdgeId,
        from: pid,
        to: tempId,
        label: "",
        style: edgeStyle,
      };
      setNodes((ns) => [...ns, newNode]);
      setEdges((es) => [...es, newEdge]);
      setSelected(tempId);
      setMultiSel(new Set([tempId]));
      setHoveredNode(null);
      // open edit with empty string so user types directly
      setTimeout(() => {
        setEditId(tempId);
        setEditText("");
      }, 80);
      toast("Node added");
      if (mapId) {
        try {
          const res = await api.addNode(mapId, {
            parentId: pid,
            text: label,
            color,
          });
          if (!res.success) throw new Error(res.message);
          const realNodeId = res.node.id,
            realEdgeId = res.edge.id;
          setNodes((ns) =>
            ns.map((n) => (n.id === tempId ? { ...n, id: realNodeId } : n)),
          );
          setEdges((es) =>
            es.map((e) => {
              if (e.id === tempEdgeId)
                return { ...e, id: realEdgeId, to: realNodeId };
              if (e.to === tempId) return { ...e, to: realNodeId };
              return e;
            }),
          );
          if (selected === tempId) setSelected(realNodeId);
          setMultiSel((ms) => {
            const n = new Set(ms);
            n.delete(tempId);
            n.add(realNodeId);
            return n;
          });
          setEditId((id) => (id === tempId ? realNodeId : id));
        } catch {
          toast("Failed to save node", "error");
          setNodes((ns) => ns.filter((n) => n.id !== tempId));
          setEdges((es) => es.filter((e) => e.id !== tempEdgeId));
        }
      }
    },
    [selected, nodes, edges, snapshot, palette, edgeStyle, snap, mapId],
  );

  const upNode = useCallback(
    (key, val) => {
      setNodes((ns) => {
        const next = ns.map((n) =>
          multiSel.has(n.id) ? { ...n, [key]: val } : n,
        );
        if (mapId)
          [...multiSel].forEach(async (nid) => {
            try {
              await api.updateNode(mapId, nid, { [key]: val });
            } catch {}
          });
        return next;
      });
    },
    [multiSel, mapId],
  );

  const deleteNodes = useCallback(
    async (ids) => {
      const set = ids instanceof Set ? ids : new Set(ids);
      if (set.has("root") && set.size === 1) {
        toast("Can't delete root node", "error");
        return;
      }
      snapshot();
      const prevNodes = [...nodes],
        prevEdges = [...edges];
      setNodes((ns) => ns.filter((n) => !set.has(n.id)));
      setEdges((es) => es.filter((e) => !set.has(e.from) && !set.has(e.to)));
      setSelected("root");
      setMultiSel(new Set(["root"]));
      toast(`Deleted ${set.size} node(s)`);
      if (mapId) {
        for (const nid of [...set].filter((id) => id !== "root")) {
          try {
            await api.deleteNode(mapId, nid);
          } catch {
            toast("Delete failed — rolled back", "error");
            setNodes(prevNodes);
            setEdges(prevEdges);
            return;
          }
        }
      }
    },
    [nodes, edges, snapshot, mapId],
  );

  const createEdge = useCallback(
    async (fromId, toId) => {
      const exists = edges.find(
        (e) =>
          (e.from === fromId && e.to === toId) ||
          (e.from === toId && e.to === fromId),
      );
      if (exists) return;
      snapshot();
      const tempId = uid();
      const newEdge = {
        id: tempId,
        from: fromId,
        to: toId,
        label: "",
        style: edgeStyle,
      };
      setEdges((es) => [...es, newEdge]);
      toast("Connected");
      if (mapId) {
        try {
          const res = await api.addEdge(mapId, {
            from: fromId,
            to: toId,
            label: "",
            style: edgeStyle,
          });
          if (!res.success) throw new Error(res.message);
          setEdges((es) =>
            es.map((e) => (e.id === tempId ? { ...e, id: res.edge.id } : e)),
          );
        } catch {
          toast("Edge save failed", "error");
          setEdges((es) => es.filter((e) => e.id !== tempId));
        }
      }
    },
    [edges, snapshot, edgeStyle, mapId],
  );

  const removeEdge = useCallback(
    async (edgeId) => {
      snapshot();
      const prev = [...edges];
      setEdges((es) => es.filter((e) => e.id !== edgeId));
      toast("Edge removed");
      if (mapId) {
        try {
          await api.deleteEdge(mapId, edgeId);
        } catch {
          toast("Edge delete failed", "error");
          setEdges(prev);
        }
      }
    },
    [edges, snapshot, mapId],
  );

  const saveNow = async () => {
    if (!mapId) return;
    setSyncStatus("saving");
    try {
      const res = await api.syncMap(mapId, nodes, edges);
      if (!res.success) throw new Error();
      setSyncStatus("idle");
      toast("Saved", "success");
    } catch {
      setSyncStatus("error");
      toast("Save failed", "error");
    }
  };

  const duplicateNode = () => {
    if (!selectedNode) return;
    snapshot();
    const newNode = {
      ...selectedNode,
      id: uid(),
      x: selectedNode.x + 60,
      y: selectedNode.y + 60,
    };
    setNodes((ns) => [...ns, newNode]);
    setSelected(newNode.id);
    scheduleSync([...nodes, newNode], edges);
    toast("Duplicated");
  };

  // ── Groups ────────────────────────────────────────────────────────────────
  const createGroup = (nodeIds, name) => {
    snapshot();
    const gid = uid();
    const color = nodes.find((n) => nodeIds.includes(n.id))?.color || CT.accent;
    setGroups((gs) => [...gs, { id: gid, name, color }]);
    setNodes((ns) =>
      ns.map((n) => (nodeIds.includes(n.id) ? { ...n, groupId: gid } : n)),
    );
    toast(`Group "${name}" created`);
  };
  const ungroupGroup = (gid) => {
    snapshot();
    setGroups((gs) => gs.filter((g) => g.id !== gid));
    setNodes((ns) =>
      ns.map((n) => (n.groupId === gid ? { ...n, groupId: null } : n)),
    );
    toast("Ungrouped");
  };
  const selectGroup = (gid) => {
    const ids = nodes.filter((n) => n.groupId === gid).map((n) => n.id);
    if (ids.length) {
      setMultiSel(new Set(ids));
      setSelected(ids[0]);
    }
  };
  const deleteGroup = (gid) => {
    snapshot();
    setGroups((gs) => gs.filter((g) => g.id !== gid));
    setNodes((ns) =>
      ns.map((n) => (n.groupId === gid ? { ...n, groupId: null } : n)),
    );
    toast("Group deleted");
  };

  // ── Export / Import ───────────────────────────────────────────────────────
  const exportPNG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const xs = nodes.map((n) => n.x),
      ys = nodes.map((n) => n.y),
      pad = 80;
    const minX = Math.min(...xs) - pad,
      minY = Math.min(...ys) - pad;
    const W = Math.max(...xs) + pad - minX,
      H = Math.max(...ys) + pad - minY;
    const clone = svg.cloneNode(true);
    clone.setAttribute("viewBox", `${minX} ${minY} ${W} ${H}`);
    clone.setAttribute("width", W);
    clone.setAttribute("height", H);
    const bgRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    bgRect.setAttribute("x", minX);
    bgRect.setAttribute("y", minY);
    bgRect.setAttribute("width", W);
    bgRect.setAttribute("height", H);
    bgRect.setAttribute("fill", CT.bg);
    clone.insertBefore(bgRect, clone.firstChild);
    const svgStr = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "mindmap.png";
      a.click();
      toast("Exported PNG", "success");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
  }, [nodes, CT]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges, groups }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mindmap.json";
    a.click();
    toast("Exported JSON", "success");
  };
  const exportMarkdown = () => {
    const build = (id, depth) => {
      const n = nodes.find((x) => x.id === id);
      if (!n) return "";
      const prefix = "  ".repeat(depth) + (depth ? "- " : "# ");
      const children = edges.filter((e) => e.from === id).map((e) => e.to);
      return (
        prefix +
        n.text +
        "\n" +
        children.map((c) => build(c, depth + 1)).join("")
      );
    };
    const blob = new Blob([build("root", 0)], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mindmap.md";
    a.click();
    toast("Exported Markdown", "success");
  };
  const exportSVG = () => {
    const svg = svgRef.current;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mindmap.svg";
    a.click();
    toast("Exported SVG", "success");
  };
  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        snapshot();
        setNodes(d.nodes);
        setEdges(d.edges);
        if (d.groups) setGroups(d.groups);
        scheduleSync(d.nodes, d.edges);
        toast("Imported", "success");
      } catch {
        toast("Invalid JSON", "error");
      }
    };
    r.readAsText(file);
  };

  const autoArrange = (type = "radial") => {
    snapshot();
    const root = nodes.find((n) => n.id === "root");
    if (!root) return;
    const cx = root.x,
      cy = root.y;
    const positions = {};

    // ── helpers ─────────────────────────────────────────────────────────────
    const childrenOf = (id, seen) =>
      edges
        .filter((e) => e.from === id)
        .map((e) => e.to)
        .filter((c) => !seen.has(c));

    // Count leaf nodes under a subtree (for proportional spacing)
    const leafCount = (id, seen = new Set()) => {
      if (seen.has(id)) return 1;
      seen.add(id);
      const ch = childrenOf(id, seen);
      if (!ch.length) return 1;
      return ch.reduce((s, c) => s + leafCount(c, seen), 0);
    };

    // ── 1. Radial ────────────────────────────────────────────────────────────
    if (type === "radial") {
      const seen = new Set();
      const dfs = (id, angle, spread, dist) => {
        if (seen.has(id)) return;
        seen.add(id);
        const p = positions[id] || { x: cx, y: cy };
        const ch = childrenOf(id, seen);
        ch.forEach((cid, i) => {
          const a =
            angle - spread / 2 + (spread / (ch.length || 1)) * (i + 0.5);
          positions[cid] = {
            x: snap(p.x + Math.cos((a * Math.PI) / 180) * dist),
            y: snap(p.y + Math.sin((a * Math.PI) / 180) * dist),
          };
          dfs(cid, a, spread * 0.65, dist * 0.82);
        });
      };
      positions["root"] = { x: cx, y: cy };
      dfs("root", 0, 360, 230);

      // ── 2. Tree Left→Right ───────────────────────────────────────────────────
    } else if (type === "horizontal") {
      const seen = new Set();
      const dfs = (id, px, py) => {
        if (seen.has(id)) return;
        seen.add(id);
        const ch = childrenOf(id, seen);
        ch.forEach((cid, i) => {
          const ny = py + (i - (ch.length - 1) / 2) * 130;
          positions[cid] = { x: snap(px + 220), y: snap(ny) };
          dfs(cid, px + 220, ny);
        });
      };
      positions["root"] = { x: cx, y: cy };
      dfs("root", cx, cy);

      // ── 3. Tree Top→Bottom ───────────────────────────────────────────────────
    } else if (type === "vertical") {
      const seen = new Set();
      const place = (id, x, depth) => {
        if (seen.has(id)) return;
        seen.add(id);
        positions[id] = { x: snap(x), y: snap(cy + depth * 170) };
        const ch = childrenOf(id, seen);
        if (!ch.length) return;
        const total = ch.reduce(
          (s, c) => s + leafCount(c, new Set([...seen])),
          0,
        );
        let ox = x - (total * 150) / 2;
        ch.forEach((cid) => {
          const lc = leafCount(cid, new Set([...seen]));
          place(cid, ox + (lc * 150) / 2, depth + 1);
          ox += lc * 150;
        });
      };
      place("root", cx, 0);

      // ── 4. Grid ──────────────────────────────────────────────────────────────
    } else if (type === "grid") {
      // BFS order so root is first
      const order = [];
      const q = ["root"],
        visited = new Set(["root"]);
      while (q.length) {
        const id = q.shift();
        order.push(id);
        edges
          .filter((e) => e.from === id)
          .forEach((e) => {
            if (!visited.has(e.to)) {
              visited.add(e.to);
              q.push(e.to);
            }
          });
      }
      const cols = Math.max(3, Math.ceil(Math.sqrt(order.length)));
      const gX = 210,
        gY = 150;
      const totalW = (cols - 1) * gX;
      const totalH = (Math.ceil(order.length / cols) - 1) * gY;
      order.forEach((id, i) => {
        const col = i % cols,
          row = Math.floor(i / cols);
        positions[id] = {
          x: snap(cx - totalW / 2 + col * gX),
          y: snap(cy - totalH / 2 + row * gY),
        };
      });

      // ── 5. Fishbone (Ishikawa) ────────────────────────────────────────────────
    } else if (type === "fishbone") {
      const mainCh = edges.filter((e) => e.from === "root").map((e) => e.to);
      const half = Math.ceil(mainCh.length / 2);
      const spineGap = 240;
      const totalSpine = (mainCh.length - 1) * spineGap;
      positions["root"] = { x: snap(cx + totalSpine / 2 + 120), y: cy };
      mainCh.forEach((cid, i) => {
        const bx = cx + i * spineGap;
        const isTop = i < half;
        const by = cy + (isTop ? -180 : 180);
        positions[cid] = { x: snap(bx), y: snap(by) };
        const sub = edges.filter((e) => e.from === cid).map((e) => e.to);
        sub.forEach((scid, j) => {
          positions[scid] = {
            x: snap(bx - (j + 1) * 110),
            y: snap(by + (isTop ? -90 : 90)),
          };
        });
      });
    }

    const next = nodes.map((n) =>
      positions[n.id] ? { ...n, ...positions[n.id] } : n,
    );
    setNodes(next);
    scheduleSync(next, edges);
    toast("Layout applied");
    setTimeout(fitAll, 120); // auto-fit after rearranging
  };

  // ── Edge path ─────────────────────────────────────────────────────────────
  const getEdgePath = (from, to, style) => {
    if (!from || !to) return "";
    const dx = to.x - from.x,
      dy = to.y - from.y;
    switch (style) {
      case "straight":
        return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
      case "elbow": {
        const mx = (from.x + to.x) / 2;
        return `M ${from.x} ${from.y} L ${mx} ${from.y} L ${mx} ${to.y} L ${to.x} ${to.y}`;
      }
      case "arc": {
        const r = Math.sqrt(dx * dx + dy * dy) * 0.6;
        return `M ${from.x} ${from.y} A ${r} ${r} 0 0 1 ${to.x} ${to.y}`;
      }
      default: {
        const cx = from.x + dx * 0.5;
        return `M ${from.x} ${from.y} C ${cx} ${from.y} ${cx} ${to.y} ${to.x} ${to.y}`;
      }
    }
  };

  /**
   * Returns {x, y, side} — the CENTER of whichever side of the node faces the target.
   * "side" tells getSmartPath which direction the bezier control point should pull.
   */
  const getNodeEdgePoint = (node, W, H, targetX, targetY) => {
    const cx = node.x,
      cy = node.y;
    const dx = targetX - cx,
      dy = targetY - cy;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01)
      return { x: cx, y: cy, side: "right" };
    const hw = W / 2,
      hh = H / 2;

    // Circle: exact boundary point
    if (node.shape === "circle") {
      const r = Math.min(hw, hh);
      const len = Math.sqrt(dx * dx + dy * dy);
      const side =
        Math.abs(dx) >= Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "bottom"
            : "top";
      return { x: cx + (dx / len) * r, y: cy + (dy / len) * r, side };
    }

    // Pill: ellipse boundary
    if (node.shape === "pill") {
      const denom = Math.sqrt((dx * dx) / (hw * hw) + (dy * dy) / (hh * hh));
      const side =
        Math.abs(dx) / hw >= Math.abs(dy) / hh
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "bottom"
            : "top";
      return { x: cx + dx / denom, y: cy + dy / denom, side };
    }

    // Rectangular (rounded / hexagon / diamond):
    // Snap to the SIDE CENTER that faces the target.
    // Compare normalised distances — whichever axis is dominant determines the side.
    if (Math.abs(dx) / hw >= Math.abs(dy) / hh) {
      // Horizontally dominant → left or right side, Y locked to node center
      const side = dx > 0 ? "right" : "left";
      return { x: cx + (dx > 0 ? hw : -hw), y: cy, side };
    } else {
      // Vertically dominant → top or bottom side, X locked to node center
      const side = dy > 0 ? "bottom" : "top";
      return { x: cx, y: cy + (dy > 0 ? hh : -hh), side };
    }
  };

  /**
   * Direction-aware bezier.
   * Control points pull outward in the direction each node's exit/entry side faces,
   * producing smooth organic curves identical to the reference design.
   */
  const getSmartPath = (fromPt, toPt) => {
    const dist = Math.hypot(toPt.x - fromPt.x, toPt.y - fromPt.y);
    const tension = Math.min(dist * 0.45, 240);
    const ctrl = (pt, side) => {
      switch (side) {
        case "right":
          return { x: pt.x + tension, y: pt.y };
        case "left":
          return { x: pt.x - tension, y: pt.y };
        case "bottom":
          return { x: pt.x, y: pt.y + tension };
        case "top":
          return { x: pt.x, y: pt.y - tension };
        default:
          return { x: pt.x, y: pt.y };
      }
    };
    const cp1 = ctrl(fromPt, fromPt.side);
    const cp2 = ctrl(toPt, toPt.side);
    return `M ${fromPt.x} ${fromPt.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${toPt.x} ${toPt.y}`;
  };

  const nodeBounds = (node) => {
    const base = node.fontSize || 14;
    const textLen = Math.min(node.text.length * base * 0.58 + 40, 220);
    const W =
      node.shape === "circle" ? 90 : node.image ? 130 : Math.max(90, textLen);
    const H = node.shape === "circle" ? 90 : node.image ? 80 : base * 2.2 + 18;
    return { W, H };
  };

  const visibleNodeIds = useMemo(() => {
    const visible = new Set();
    const visit = (id) => {
      visible.add(id);
      const n = nodes.find((x) => x.id === id);
      if (n?.collapsed) return;
      edges.filter((e) => e.from === id).forEach((e) => visit(e.to));
    };
    visit("root");
    return visible;
  }, [nodes, edges]);

  const visibleEdges = edges.filter(
    (e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to),
  );
  const visibleNodes = nodes.filter((n) => visibleNodeIds.has(n.id));
  visibleNodesRef.current = visibleNodes; // keep ref in sync for presentNav

  const groupBounds = useMemo(() => {
    return groups
      .map((g) => {
        const members = visibleNodes.filter((n) => n.groupId === g.id);
        if (!members.length) return null;
        const xs = members.map((n) => n.x),
          ys = members.map((n) => n.y);
        const pad = 40;
        return {
          ...g,
          x: Math.min(...xs) - pad,
          y: Math.min(...ys) - pad,
          w: Math.max(...xs) - Math.min(...xs) + pad * 2,
          h: Math.max(...ys) - Math.min(...ys) + pad * 2,
        };
      })
      .filter(Boolean);
  }, [groups, visibleNodes]);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const onNodeMouseDown = (e, id) => {
    e.stopPropagation();
    if (e.button === 2) return;
    const node = nodes.find((n) => n.id === id);
    if (node?.locked) {
      toast("Node is locked");
      return;
    }
    if (mode === "link") {
      if (linking === null) {
        setLinking(id);
        return;
      }
      if (linking !== id) createEdge(linking, id);
      setLinking(null);
      return;
    }
    if (e.shiftKey) {
      setMultiSel((ms) => {
        const n = new Set(ms);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
    } else {
      if (!multiSel.has(id)) {
        setSelected(id);
        setMultiSel(new Set([id]));
      } else setSelected(id);
    }
    setDragging({
      id,
      startX: e.clientX,
      startY: e.clientY,
      origPositions: [...multiSel, id].reduce((acc, nid) => {
        const n = nodes.find((x) => x.id === nid);
        if (n) acc[nid] = { x: n.x, y: n.y };
        return acc;
      }, {}),
    });
  };

  const onMouseMove = useCallback(
    (e) => {
      if (dragging && !dragging.moved) {
        if (
          Math.hypot(e.clientX - dragging.startX, e.clientY - dragging.startY) <
          3
        )
          return;
        setDragging((d) => ({ ...d, moved: true }));
      }
      if (dragging?.moved) {
        const r = svgRef.current.getBoundingClientRect();
        const dx = (e.clientX - dragging.startX) * (viewBox.w / r.width);
        const dy = (e.clientY - dragging.startY) * (viewBox.h / r.height);
        setNodes((ns) =>
          ns.map((n) => {
            const orig = dragging.origPositions[n.id];
            if (!orig) return n;
            return { ...n, x: snap(orig.x + dx), y: snap(orig.y + dy) };
          }),
        );
      }
      if (panStart) {
        const r = svgRef.current.getBoundingClientRect();
        const dx = (e.clientX - panStart.cx) * (viewBox.w / r.width);
        const dy = (e.clientY - panStart.cy) * (viewBox.h / r.height);
        setViewBox((v) => ({ ...v, x: panStart.vx - dx, y: panStart.vy - dy }));
      }
    },
    [dragging, panStart, viewBox, snap],
  );

  const onMouseUp = useCallback(
    (e) => {
      if (dragging?.moved) {
        snapshot();
        scheduleSync(nodes, edges);
      }
      setDragging(null);
      setPanStart(null);
    },
    [dragging, nodes, edges, snapshot, scheduleSync],
  );

  const onSvgMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      setPanStart({
        cx: e.clientX,
        cy: e.clientY,
        vx: viewBox.x,
        vy: viewBox.y,
      });
      return;
    }
    if (mode === "pan" || (e.button === 0 && e.altKey)) {
      setPanStart({
        cx: e.clientX,
        cy: e.clientY,
        vx: viewBox.x,
        vy: viewBox.y,
      });
      return;
    }
    if (mode === "select") {
      // Plain click on empty canvas → just deselect
      setMultiSel(new Set());
      setSelected(null);
    }
  };

  const onDblClick = (e, id) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === id);
    if (!node || node.locked) return;
    setEditId(id);
    setEditText(node.text);
    setTimeout(() => editRef.current?.focus(), 30);
  };

  const commitEdit = () => {
    if (!editId) return;
    snapshot();
    const trimmed = editText.trim();
    const existingTxt = nodes.find((n) => n.id === editId)?.text || "";
    // If user typed something → use it.
    // If not → keep the node's existing text (for re-edits).
    // If both are empty (brand-new node, user pressed Escape) → "New Node" as fallback.
    const newText = trimmed || existingTxt || "New Node";
    setNodes((ns) =>
      ns.map((n) => (n.id === editId ? { ...n, text: newText } : n)),
    );
    if (mapId)
      api.updateNode(mapId, editId, { text: newText }).catch(console.error);
    setEditId(null);
  };

  const onContextMenu = (e, id) => {
    e.preventDefault();
    setSelected(id);
    setMultiSel(new Set([id]));
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const ctxItems = contextMenu
    ? [
        {
          label: "Add Child",
          icon: "plus",
          action: () => addChild(contextMenu.id),
          shortcut: "Tab",
        },
        { label: "Duplicate", icon: "copy", action: duplicateNode },
        {
          label: "Focus view",
          icon: "eye",
          action: () => focusNode(contextMenu.id),
        },
        "---",
        {
          label: "Group selected",
          icon: "group",
          action: () => {
            if (multiSel.size > 1) createGroup([...multiSel], "New Group");
            else toast("Select multiple nodes first", "error");
          },
        },
        {
          label: "Lock/Unlock",
          icon: "pin",
          action: () => {
            upNode("locked", !selectedNode?.locked);
            toast(selectedNode?.locked ? "Unlocked" : "Locked");
          },
        },
        {
          label: "Collapse",
          icon: "collapse",
          action: () => upNode("collapsed", !selectedNode?.collapsed),
        },
        "---",
        {
          label: "Delete Node",
          icon: "trash",
          danger: true,
          action: () => deleteNodes(multiSel),
          shortcut: "Del",
        },
      ]
    : [];

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      // ── Present mode: arrow nav + Esc to exit ──────────────────────────
      if (presentMode) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
          e.preventDefault();
          presentNav(1);
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          presentNav(-1);
          return;
        }
        if (e.key === "Escape") {
          setPresentMode(false);
          return;
        }
        return; // block all other shortcuts while presenting
      }
      // ── Normal mode shortcuts ──────────────────────────────────────────
      if (editId) {
        if (e.key === "Escape") setEditId(null);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        addChild();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !e.metaKey)
        deleteNodes(multiSel);
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        duplicateNode();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setMultiSel(new Set(nodes.map((n) => n.id)));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveNow();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        if (multiSel.size > 1) createGroup([...multiSel], "Group");
      }
      if (e.key === "Escape") {
        setMode("select");
        setLinking(null);
        setShowSearch(false);
        setContextMenu(null);
        setShowHistory(false);
      }
      if (e.key === "1") setMode("select");
      if (e.key === "2") setMode("pan");
      if (e.key === "3") setMode("link");
      if (e.key === "+" || e.key === "=") doZoom(0.85);
      if (e.key === "-") doZoom(1.15);
      if (e.key === "0") fitAll();
      if (e.key === "p") setPresentMode((m) => !m);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [editId, addChild, deleteNodes, undo, redo, multiSel, nodes, doZoom]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <EdgeAnimationKeyframes />

      {/* ── SVG Canvas ── */}
      <svg
        ref={svgRef}
        style={{
          flex: 1,
          cursor:
            mode === "pan" || panStart
              ? "grabbing"
              : mode === "link"
                ? "crosshair"
                : "default",
        }}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseDown={onSvgMouseDown}
      >
        <defs>
          <pattern
            id="dots"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="15" cy="15" r="0.7" fill={CT.muted} opacity="0.25" />
          </pattern>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill={CT.muted} opacity="0.8" />
          </marker>
          <marker
            id="arrowActive"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill={CT.accent} />
          </marker>
          {nodes.map((n) => (
            <radialGradient
              key={n.id + "-g"}
              id={`glow-${n.id}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={n.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0.08" />
            </radialGradient>
          ))}
        </defs>

        {showGrid && (
          <rect
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.w}
            height={viewBox.h}
            fill="url(#dots)"
          />
        )}

        {/* Group backgrounds */}
        {groupBounds.map((g) => (
          <g key={`grp-${g.id}`}>
            <rect
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              rx={16}
              fill={g.color + "14"}
              stroke={g.color}
              strokeWidth={1.5}
              strokeDasharray="8 4"
              opacity={0.7}
            />
            <rect
              x={g.x + 8}
              y={g.y - 11}
              width={g.name.length * 7 + 16}
              height={20}
              rx={6}
              fill={g.color}
              opacity={0.9}
            />
            <text
              x={g.x + 16}
              y={g.y + 3}
              fontSize={11}
              fontWeight={700}
              fill="white"
            >
              {g.name}
            </text>
          </g>
        ))}

        {/* Edges */}
        {visibleEdges.map((edge) => {
          const from = nodes.find((n) => n.id === edge.from);
          const to = nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;

          // ── boundary-to-boundary connection ──────────────────────────────
          const { W: fW, H: fH } = nodeBounds(from);
          const { W: tW, H: tH } = nodeBounds(to);
          const fromPt = getNodeEdgePoint(from, fW, fH, to.x, to.y);
          const toPt = getNodeEdgePoint(to, tW, tH, from.x, from.y);
          const curStyle = edge.style || edgeStyle;
          // "curve" uses direction-aware bezier; other styles use the generic path
          const path =
            curStyle === "curve"
              ? getSmartPath(fromPt, toPt)
              : getEdgePath(fromPt, toPt, curStyle);
          const mx = (fromPt.x + toPt.x) / 2;
          const my = (fromPt.y + toPt.y) / 2;

          // ── colour: use the child (non-root) node's colour ───────────────
          const childNode = edge.from === "root" ? to : from;
          const edgeColor = childNode.color || CT.accent;
          const isActive = multiSel.has(edge.from) || multiSel.has(edge.to);
          const strokeColor = isActive ? CT.accent : edgeColor;

          return (
            <g key={edge.id}>
              {/* wide invisible hit area so clicking to delete is easy */}
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: "pointer" }}
                onClick={() => removeEdge(edge.id)}
              />

              {/* visible edge — no arrowhead, matches reference style */}
              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isActive ? 2.5 : 2}
                strokeOpacity={isActive ? 1 : 0.85}
                strokeLinecap="round"
                {...getEdgeAnimationStyle(edgeAnimStyle, strokeColor)}
              />
              <AnimatedDotOverlay
                styleId={edgeAnimStyle}
                pathD={path}
                color={strokeColor}
              />

              {/* edge label */}
              {(edge.label || isActive) && (
                <g>
                  {edge.label && (
                    <rect
                      x={mx - edge.label.length * 3.5 - 4}
                      y={my - 9}
                      width={edge.label.length * 7 + 8}
                      height={16}
                      rx={4}
                      fill={CT.panel}
                      stroke={CT.border}
                      strokeWidth={0.8}
                    />
                  )}
                  {edgeLabelEdit === edge.id ? (
                    <foreignObject
                      x={mx - 50}
                      y={my - 10}
                      width={100}
                      height={20}
                    >
                      <input
                        autoFocus
                        defaultValue={edge.label}
                        onBlur={(e2) => {
                          snapshot();
                          setEdges((es) =>
                            es.map((ed) =>
                              ed.id === edge.id
                                ? { ...ed, label: e2.target.value }
                                : ed,
                            ),
                          );
                          setEdgeLabelEdit(null);
                        }}
                        onKeyDown={(e2) => {
                          if (e2.key === "Enter") e2.target.blur();
                        }}
                        style={{
                          width: "100%",
                          background: CT.panel,
                          border: "none",
                          color: CT.text,
                          fontSize: 11,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={mx}
                      y={my + 4}
                      textAnchor="middle"
                      fill={CT.muted}
                      fontSize={11}
                      style={{ cursor: "pointer" }}
                      onDoubleClick={(e2) => {
                        e2.stopPropagation();
                        setEdgeLabelEdit(edge.id);
                      }}
                    >
                      {edge.label || (isActive ? "···" : "")}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const { W, H } = nodeBounds(node);
          const isSel = multiSel.has(node.id),
            isSearchHit = searchHits.has(node.id);
          const isLinking = linking === node.id;
          const collapseCount = edges.filter((e) => e.from === node.id).length;
          const hasCollapsed = node.collapsed && collapseCount > 0;
          const isHovered =
            hoveredNode === node.id && !dragging && mode === "select";
          const nodeGroup = groups.find((g) => g.id === node.groupId);
          return (
            <g
              key={node.id}
              transform={`translate(${node.x - W / 2},${node.y - H / 2})`}
              onMouseDown={(e) => onNodeMouseDown(e, node.id)}
              onDoubleClick={(e) => onDblClick(e, node.id)}
              onContextMenu={(e) => onContextMenu(e, node.id)}
              onMouseEnter={() => {
                clearTimeout(hoverLeaveTimer.current);
                if (!dragging && mode === "select") setHoveredNode(node.id);
              }}
              onMouseLeave={() => {
                hoverLeaveTimer.current = setTimeout(() => {
                  setHoveredNode((v) => (v === node.id ? null : v));
                  setAddBtnHover(null);
                }, 120);
              }}
              style={{
                cursor: node.locked
                  ? "not-allowed"
                  : dragging?.id === node.id
                    ? "grabbing"
                    : "grab",
              }}
            >
              <rect
                x={0}
                y={0}
                width={W + 44}
                height={H}
                fill="transparent"
                style={{ pointerEvents: "all" }}
              />
              {isSel && (
                <ellipse
                  cx={W / 2}
                  cy={H / 2}
                  rx={W * 0.7}
                  ry={H * 0.7}
                  fill={`url(#glow-${node.id})`}
                  style={{ pointerEvents: "none" }}
                />
              )}
              {isSearchHit && (
                <rect
                  x={-5}
                  y={-5}
                  width={W + 10}
                  height={H + 10}
                  rx={14}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  style={{ animation: "pulse 1s ease infinite" }}
                />
              )}
              {/* Present mode: glowing ring around the focused node */}
              {presentMode && visibleNodes[presentIdx]?.id === node.id && (
                <rect
                  x={-12}
                  y={-12}
                  width={W + 24}
                  height={H + 24}
                  rx={
                    node.shape === "pill"
                      ? H / 2 + 12
                      : node.shape === "circle"
                        ? W / 2 + 12
                        : 20
                  }
                  fill={node.color + "18"}
                  stroke={node.color}
                  strokeWidth={3}
                  style={{
                    animation: "presentRing 1.8s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
              )}
              {isSel && (
                <rect
                  x={-3}
                  y={-3}
                  width={W + 6}
                  height={H + 6}
                  rx={
                    node.shape === "pill"
                      ? H / 2 + 3
                      : node.shape === "circle"
                        ? W / 2 + 3
                        : 14
                  }
                  fill="none"
                  stroke={node.color}
                  strokeWidth={2}
                  opacity={0.9}
                />
              )}
              {nodeGroup && !isSel && (
                <circle
                  cx={W}
                  cy={0}
                  r={5}
                  fill={nodeGroup.color}
                  opacity={0.9}
                />
              )}
              {node.shape === "hexagon" ? (
                <polygon
                  points={`${W * 0.25},0 ${W * 0.75},0 ${W},${H / 2} ${W * 0.75},${H} ${W * 0.25},${H} 0,${H / 2}`}
                  fill={node.id === "root" ? node.color : node.color + "20"}
                  stroke={node.color}
                  strokeWidth={isSel ? 2.5 : 2}
                />
              ) : node.shape === "diamond" ? (
                <rect
                  x={8}
                  y={8}
                  width={W - 16}
                  height={H - 16}
                  rx={6}
                  fill={node.id === "root" ? node.color : node.color + "20"}
                  stroke={node.color}
                  strokeWidth={isSel ? 2.5 : 2}
                  transform={`rotate(45,${W / 2},${H / 2})`}
                />
              ) : (
                <rect
                  width={W}
                  height={H}
                  rx={
                    node.shape === "pill"
                      ? H / 2
                      : node.shape === "circle"
                        ? W / 2
                        : 11
                  }
                  fill={node.id === "root" ? node.color : CT.surface}
                  stroke={node.color}
                  strokeWidth={isSel ? 2.5 : isHovered ? 2.2 : 2}
                  style={{ transition: "stroke-width 0.15s, filter 0.15s" }}
                  filter={
                    isHovered && node.id !== "root"
                      ? `drop-shadow(0 0 6px ${node.color}66)`
                      : undefined
                  }
                />
              )}
              {node.image && (
                <image
                  href={node.image}
                  x={4}
                  y={4}
                  width={W - 8}
                  height={H * 0.55}
                  preserveAspectRatio="xMidYMid slice"
                />
              )}
              {node.emoji && !node.image && (
                <text
                  x={14}
                  y={H / 2 + 5}
                  fontSize={14}
                  style={{ userSelect: "none" }}
                >
                  {node.emoji}
                </text>
              )}
              {editId === node.id ? (
                <foreignObject
                  x={node.emoji ? 26 : 6}
                  y={H / 2 - 12}
                  width={W - (node.emoji ? 32 : 12)}
                  height={26}
                >
                  <input
                    ref={editRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") commitEdit();
                    }}
                    placeholder="Type here…"
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: node.id === "root" ? "#ffffff" : CT.text,
                      fontSize: node.fontSize || 14,
                      fontWeight: node.bold || node.id === "root" ? 700 : 400,
                      fontStyle: node.italic ? "italic" : "normal",
                      fontFamily: node.fontFamily || "Inter",
                      textAlign: "center",
                    }}
                  />
                </foreignObject>
              ) : (
                <text
                  x={node.emoji ? W / 2 + 8 : W / 2}
                  y={
                    H / 2 +
                    (node.image ? H * 0.28 : 0) +
                    (node.fontSize || 14) * 0.35
                  }
                  textAnchor="middle"
                  fill={node.id === "root" ? "#ffffff" : CT.text}
                  fontSize={node.fontSize || 14}
                  fontWeight={node.bold || node.id === "root" ? 700 : 400}
                  fontStyle={node.italic ? "italic" : "normal"}
                  fontFamily={node.fontFamily || "Inter"}
                  style={{ pointerEvents: "none" }}
                >
                  {showLabels
                    ? node.text.length > 22
                      ? node.text.slice(0, 20) + "…"
                      : node.text
                    : ""}
                </text>
              )}
              {node.tag && (
                <text
                  x={W - 4}
                  y={14}
                  textAnchor="end"
                  fontSize={9}
                  fill={node.color}
                  opacity={0.9}
                  style={{ pointerEvents: "none" }}
                >
                  #{node.tag}
                </text>
              )}
              {node.note && <circle cx={W - 5} cy={5} r={4} fill="#f59e0b" />}
              {node.locked && (
                <text
                  x={6}
                  y={H - 5}
                  fontSize={9}
                  fill={CT.muted}
                  opacity={0.7}
                >
                  🔒
                </text>
              )}
              {hasCollapsed && (
                <g
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    upNode("collapsed", false);
                  }}
                >
                  <circle
                    cx={W / 2}
                    cy={H + 10}
                    r={10}
                    fill={node.color}
                    opacity={0.9}
                  />
                  <text
                    x={W / 2}
                    y={H + 15}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight={700}
                  >
                    {collapseCount}
                  </text>
                </g>
              )}
              {isLinking && (
                <rect
                  x={-4}
                  y={-4}
                  width={W + 8}
                  height={H + 8}
                  rx={14}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  strokeDasharray="5 3"
                  style={{ animation: "dash 0.5s linear infinite" }}
                />
              )}
              {isHovered &&
                !node.locked &&
                !node.collapsed &&
                (() => {
                  const bx = W + 20,
                    by = H / 2,
                    isHov = addBtnHover === node.id;
                  return (
                    <g
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        clearTimeout(hoverLeaveTimer.current);
                        setAddBtnHover(node.id);
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        setAddBtnHover(null);
                        hoverLeaveTimer.current = setTimeout(
                          () =>
                            setHoveredNode((v) => (v === node.id ? null : v)),
                          80,
                        );
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        addChild(node.id);
                      }}
                      style={{
                        cursor: "pointer",
                        animation: "addBtnFadeIn 0.15s ease",
                      }}
                    >
                      <line
                        x1={W}
                        y1={by}
                        x2={bx - (isHov ? 13 : 11)}
                        y2={by}
                        stroke={node.color}
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                        opacity={0.45}
                        style={{ pointerEvents: "none" }}
                      />
                      <circle
                        cx={bx}
                        cy={by}
                        r={isHov ? 13 : 11}
                        fill={isHov ? node.color : CT.panel}
                        stroke={node.color}
                        strokeWidth={isHov ? 0 : 1.5}
                        style={{ transition: "r 0.12s,fill 0.12s" }}
                      />
                      <path
                        d={`M ${bx} ${by - 5} L ${bx} ${by + 5} M ${bx - 5} ${by} L ${bx + 5} ${by}`}
                        stroke={isHov ? "white" : node.color}
                        strokeWidth={isHov ? 2.5 : 2}
                        strokeLinecap="round"
                        style={{
                          pointerEvents: "none",
                          transition: "stroke 0.12s",
                        }}
                      />
                    </g>
                  );
                })()}
            </g>
          );
        })}

        {linking && (
          <circle
            cx={nodes.find((n) => n.id === linking)?.x || 0}
            cy={nodes.find((n) => n.id === linking)?.y || 0}
            r={18}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={2}
            style={{ animation: "pulse 0.8s ease infinite" }}
          />
        )}
      </svg>

      {/* ── Toolbar (drop animation) ── */}
      {!presentMode && (
        <>
          {/* Toolbar slides down/up */}
          <div
            style={{
              position: "absolute",
              top: toolbarOpen ? 14 : -120,
              left: panelOpen ? "calc((100% - 268px) / 2)" : "50%",
              transform: "translateX(-50%)",
              opacity: toolbarOpen ? 1 : 0,
              pointerEvents: toolbarOpen ? "all" : "none",
              zIndex: 100,
              transition:
                "top 0.38s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease, left 0.2s ease",
            }}
          >
            <Toolbar
              CT={CT}
              mode={mode}
              setMode={setMode}
              setLinking={setLinking}
              showHistory={showHistory}
              setShowHistory={setShowHistory}
              showSearch={showSearch}
              setShowSearch={setShowSearch}
              setPanelOpen={setPanelOpen}
              panelOpen={panelOpen}
              selectedTheme={theme}
              setSelectedTheme={onThemeChange}
              zoomLevel={zoomLevel}
              historyLength={history.length}
              multiSel={multiSel}
              addChild={addChild}
              deleteNodes={deleteNodes}
              duplicateNode={duplicateNode}
              undo={undo}
              redo={redo}
              autoArrange={autoArrange}
              fitAll={fitAll}
              doZoom={doZoom}
              exportPNG={exportPNG}
              saveNow={saveNow}
            />
          </div>

          {/* Toggle handle — slides from below toolbar to top of screen */}
          <button
            onClick={() => setToolbarOpen((v) => !v)}
            title={toolbarOpen ? "Hide toolbar" : "Show toolbar"}
            style={{
              position: "absolute",
              top: toolbarOpen ? 60 : 0,
              left: panelOpen ? "calc((100% - 268px) / 2)" : "50%",
              transform: "translateX(-50%)",
              zIndex: 101,
              padding: "4px 22px 5px",
              borderRadius: "0 0 12px 12px",
              border: `1px solid ${CT.border}`,
              borderTop: "none",
              background: CT.panel,
              color: CT.muted,
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.07em",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              transition: [
                "top 0.38s cubic-bezier(0.16,1,0.3,1)",
                "left 0.2s ease",
                "background 0.15s",
                "color 0.15s",
                "box-shadow 0.2s",
              ].join(", "),
              boxShadow: toolbarOpen
                ? "0 3px 14px rgba(0,0,0,0.35)"
                : `0 4px 22px rgba(0,0,0,0.6), 0 0 0 1px ${CT.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = CT.accent + "22";
              e.currentTarget.style.color = CT.accent;
              e.currentTarget.style.boxShadow = `0 0 18px ${CT.accent}55, 0 4px 16px rgba(0,0,0,0.4)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = CT.panel;
              e.currentTarget.style.color = CT.muted;
              e.currentTarget.style.boxShadow = toolbarOpen
                ? "0 3px 14px rgba(0,0,0,0.35)"
                : `0 4px 22px rgba(0,0,0,0.6)`;
            }}
          >
            {toolbarOpen ? "▲" : "▼  Toolbar"}
          </button>
        </>
      )}

      {/* ── History Panel ── */}
      {showHistory && !presentMode && (
        <HistoryPanel
          history={history}
          redoStack={redoStack}
          T={CT}
          onUndo={undo}
          onRedo={redo}
          onClose={() => setShowHistory(false)}
          panelOpen={panelOpen}
        />
      )}

      {/* ── Search bar ── */}
      {showSearch && !presentMode && (
        <div
          style={{
            position: "absolute",
            top: 70,
            left: panelOpen ? "calc((100% - 268px) / 2)" : "50%",
            transform: "translateX(-50%)",
            background: CT.panel,
            border: `1px solid ${CT.border}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            transition: "left 0.2s ease",
          }}
        >
          <Icon name="search" size={14} />
          <input
            autoFocus
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search nodes…"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowSearch(false);
                setSearchQ("");
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: CT.text,
              fontSize: 13,
              width: 200,
            }}
          />
          {searchHits.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: CT.muted }}>
                {searchHits.size} found
              </span>
              {[...searchHits].slice(0, 3).map((id, i) => (
                <button
                  key={id}
                  onClick={() => focusNode(id)}
                  style={{
                    fontSize: 11,
                    background: CT.surface,
                    border: `1px solid ${CT.border}`,
                    color: CT.accent,
                    padding: "2px 8px",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  {nodes.find((n) => n.id === id)?.text?.slice(0, 12) ||
                    `#${i + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Link mode hint ── */}
      {mode === "link" && !presentMode && (
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: panelOpen ? "calc((100% - 268px) / 2)" : "50%",
            transform: "translateX(-50%)",
            background: CT.panel,
            border: `1px solid ${CT.border}`,
            color: "#fbbf24",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 12,
            fontWeight: 500,
            transition: "left 0.2s ease",
          }}
        >
          {linking
            ? "Click destination node to connect"
            : "Click source node to start linking"}{" "}
          · Esc to cancel
        </div>
      )}

      {/* ── Right Panel (slide from right + side arrow tab) ── */}
      {!presentMode && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 268,
            transform: panelOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.38s cubic-bezier(0.16,1,0.3,1)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Side arrow toggle tab */}
          <button
            onClick={() => setPanelOpen((v) => !v)}
            title={panelOpen ? "Hide panel  ›" : "Show panel  ‹"}
            style={{
              position: "absolute",
              left: -34,
              top: "50%",
              transform: "translateY(-50%)",
              width: 34,
              height: 64,
              borderRadius: "14px 0 0 14px",
              border: `1px solid ${CT.border}`,
              borderRight: "none",
              background: CT.panel,
              color: panelOpen ? CT.muted : CT.accent,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s, color 0.15s, box-shadow 0.2s",
              boxShadow: panelOpen
                ? "none"
                : `-4px 0 24px ${CT.accent}55, inset 0 0 0 1px ${CT.accent}33`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = CT.accent + "22";
              e.currentTarget.style.color = CT.accent;
              e.currentTarget.style.boxShadow = `-4px 0 28px ${CT.accent}77, inset 0 0 0 1px ${CT.accent}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = CT.panel;
              e.currentTarget.style.color = panelOpen ? CT.muted : CT.accent;
              e.currentTarget.style.boxShadow = panelOpen
                ? "none"
                : `-4px 0 24px ${CT.accent}55, inset 0 0 0 1px ${CT.accent}33`;
            }}
          >
            {panelOpen ? "›" : "‹"}
          </button>

          {/* Panel content */}
          <RightPanel
            CT={CT}
            selected={selected}
            selectedNode={selectedNode}
            nodes={nodes}
            edges={edges}
            groups={groups}
            multiSel={multiSel}
            edgeStyle={edgeStyle}
            setEdgeStyle={setEdgeStyle}
            edgeAnimStyle={edgeAnimStyle}
            setEdgeAnimStyle={setEdgeAnimStyle}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            showLabels={showLabels}
            setShowLabels={setShowLabels}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            palette={palette}
            setPalette={setPalette}
            selectedTheme={theme}
            setSelectedTheme={onThemeChange}
            mapId={mapId}
            historyLength={history.length}
            upNode={upNode}
            deleteNodes={deleteNodes}
            duplicateNode={duplicateNode}
            addChild={addChild}
            removeEdge={removeEdge}
            focusNode={focusNode}
            saveNow={saveNow}
            exportJSON={exportJSON}
            exportMarkdown={exportMarkdown}
            exportSVG={exportSVG}
            exportPNG={exportPNG}
            importJSON={importJSON}
            createGroup={createGroup}
            ungroupGroup={ungroupGroup}
            selectGroup={selectGroup}
            deleteGroup={deleteGroup}
            autoArrange={autoArrange}
            snapshot={snapshot}
            toast={toast}
          />
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={ctxItems}
          T={CT}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ToastStack toasts={toasts} T={CT} />

      {/* ── Presenter bar ── */}
      {presentMode &&
        (() => {
          const curNode = visibleNodes[presentIdx];
          return (
            <div
              style={{
                position: "fixed",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                background: "rgba(10,10,20,0.92)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 8px 40px rgba(0,0,0,0.75)",
                backdropFilter: "blur(24px)",
                fontFamily: "Inter, system-ui, sans-serif",
                userSelect: "none",
              }}
            >
              {/* Node name + progress */}
              <div
                style={{
                  padding: "10px 18px",
                  borderRight: "1px solid rgba(255,255,255,0.1)",
                  minWidth: 160,
                  maxWidth: 240,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {curNode?.emoji ? `${curNode.emoji} ` : ""}
                  {curNode?.text || "—"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 5,
                  }}
                >
                  {/* Progress bar */}
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: "rgba(255,255,255,0.12)",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 1,
                        transition: "width 0.35s ease",
                        background: curNode?.color || CT.accent,
                        width: `${((presentIdx + 1) / visibleNodes.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.4)",
                      flexShrink: 0,
                    }}
                  >
                    {presentIdx + 1} / {visibleNodes.length}
                  </span>
                </div>
              </div>

              {/* Prev */}
              {[
                {
                  label: "‹",
                  title: "Previous  ←",
                  action: () => presentNav(-1),
                },
                { label: "›", title: "Next  →", action: () => presentNav(1) },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  title={btn.title}
                  style={{
                    width: 46,
                    height: 56,
                    border: "none",
                    background: "transparent",
                    color: "rgba(255,255,255,0.8)",
                    cursor: "pointer",
                    fontSize: 24,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {btn.label}
                </button>
              ))}

              <div
                style={{
                  width: 1,
                  height: 32,
                  background: "rgba(255,255,255,0.1)",
                }}
              />

              {/* Fit all */}
              <button
                onClick={fitAll}
                title="Show full map"
                style={{
                  width: 42,
                  height: 56,
                  border: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                ⊞
              </button>

              {/* Exit */}
              <button
                onClick={() => setPresentMode(false)}
                title="Exit  Esc"
                style={{
                  padding: "0 18px",
                  height: 56,
                  border: "none",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                ✕ Exit
              </button>
            </div>
          );
        })()}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MindMapPro({ mapId: propMapId }) {
  const [mapId, setMapId] = useState(propMapId || null);
  const [loadState, setLoadState] = useState("loading");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("mindmap_theme");
    return saved && THEMES[saved] ? saved : "Obsidian";
  });
  const [presentMode, setPresentMode] = useState(false);
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const T = THEMES[theme];

  // Persist theme across sessions
  useEffect(() => {
    localStorage.setItem("mindmap_theme", theme);
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      setLoadState("loading");
      try {
        let id = mapId;
        if (!id) {
          const saved = localStorage.getItem("mindmap_id");
          if (saved) {
            id = saved;
          } else {
            const res = await api.createMap("My Mind Map");
            if (!res.success) throw new Error(res.message);
            id = res.map._id;
            localStorage.setItem("mindmap_id", id);
          }
          setMapId(id);
        }
        const res = await api.getMap(id);
        if (!res.success) throw new Error(res.message);

        const savedPages = (() => {
          try {
            return (
              JSON.parse(localStorage.getItem(`mindmap_pages_${id}`)) || null
            );
          } catch {
            return null;
          }
        })();

        if (savedPages && savedPages.length > 0) {
          const merged = savedPages.map((p, i) =>
            i === 0
              ? {
                  ...p,
                  nodes: res.map.nodes,
                  edges: res.map.edges,
                  groups: p.groups || [],
                  emoji: p.emoji || "📄",
                  color: p.color || PAGE_COLORS[0],
                }
              : {
                  ...p,
                  nodes: p.nodes ?? [],
                  edges: p.edges ?? [],
                  groups: p.groups || [],
                  emoji: p.emoji || "📄",
                  color: p.color || PAGE_COLORS[0],
                },
          );
          setPages(merged);
          setActivePageId(savedPages[0].id);
        } else {
          const firstPageId = uid();
          setPages([
            {
              id: firstPageId,
              title: "Page 1",
              nodes: res.map.nodes,
              edges: res.map.edges,
              groups: [],
              emoji: "📄",
              color: PAGE_COLORS[0],
            },
          ]);
          setActivePageId(firstPageId);
        }
        setLoadState("ready");
      } catch (err) {
        console.error("MindMap init error:", err);
        setLoadState("error");
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!mapId || !pages.length) return;
    const toSave = pages.map((p) => ({
      id: p.id,
      title: p.title,
      emoji: p.emoji || "📄",
      color: p.color || PAGE_COLORS[0],
      nodes: p.nodes,
      edges: p.edges,
      groups: p.groups || [],
    }));
    localStorage.setItem(`mindmap_pages_${mapId}`, JSON.stringify(toSave));
  }, [pages, mapId]);

  const addPage = (template, name, emoji, color) => {
    const newId = uid(),
      title = name || `Page ${pages.length + 1}`;
    const tpl = template || PAGE_TEMPLATES[0];
    setPages((ps) => [
      ...ps,
      {
        id: newId,
        title,
        nodes: tpl.nodes(title),
        edges: tpl.edges(),
        groups: [],
        emoji: emoji || tpl.emoji || "📄",
        color: color || PAGE_COLORS[pages.length % PAGE_COLORS.length],
      },
    ]);
    setActivePageId(newId);
  };

  const renamePage = (pageId, newTitle) =>
    setPages((ps) =>
      ps.map((p) => (p.id === pageId ? { ...p, title: newTitle } : p)),
    );
  const deletePage = (pageId) => {
    if (pages.length <= 1) return;
    const idx = pages.findIndex((p) => p.id === pageId);
    const newPages = pages.filter((p) => p.id !== pageId);
    setPages(newPages);
    if (activePageId === pageId)
      setActivePageId(newPages[Math.max(0, idx - 1)].id);
  };
  const duplicatePage = (pageId) => {
    const src = pages.find((p) => p.id === pageId);
    if (!src) return;
    const newId = uid();
    const newPage = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId,
      title: src.title + " (copy)",
    };
    const idx = pages.findIndex((p) => p.id === pageId);
    const next = [...pages];
    next.splice(idx + 1, 0, newPage);
    setPages(next);
    setActivePageId(newId);
  };

  const changePageColor = (pageId, color) =>
    setPages((ps) => ps.map((p) => (p.id === pageId ? { ...p, color } : p)));
  const changePageEmoji = (pageId, emoji) =>
    setPages((ps) => ps.map((p) => (p.id === pageId ? { ...p, emoji } : p)));
  const syncPageNodes = (pageId, nodes) =>
    setPages((ps) => ps.map((p) => (p.id === pageId ? { ...p, nodes } : p)));
  const syncPageEdges = (pageId, edges) =>
    setPages((ps) => ps.map((p) => (p.id === pageId ? { ...p, edges } : p)));
  const syncPageGroups = (pageId, groups) =>
    setPages((ps) => ps.map((p) => (p.id === pageId ? { ...p, groups } : p)));

  const activePage = pages.find((p) => p.id === activePageId);

  if (loadState === "loading")
    return <LoadingScreen T={T} message="Loading your mind map…" />;
  if (loadState === "error")
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: T.bg,
          color: T.text,
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 32 }}>⚠️</div>
        <p style={{ fontSize: 16, fontWeight: 600 }}>Could not load mind map</p>
        <p style={{ fontSize: 13, color: T.muted }}>
          Check your auth token and backend URL.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("mindmap_id");
            window.location.reload();
          }}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.text,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Create new map
        </button>
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: T.bg,
        color: T.text,
        fontFamily: "Inter, system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        input,textarea,select{font-family:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dash{to{stroke-dashoffset:-20}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes addBtnFadeIn{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}
        @keyframes popupSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes presentRing{0%,100%{opacity:0.5;stroke-width:2}50%{opacity:1;stroke-width:3.5}}
      `}</style>

      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          paddingBottom: 40,
        }}
      >
        {activePage && (
          <MapCanvas
            key={activePageId}
            mapId={mapId}
            pageId={activePageId}
            initialNodes={activePage.nodes ?? []}
            initialEdges={activePage.edges ?? []}
            initialGroups={activePage.groups ?? []}
            theme={theme}
            T={T}
            onThemeChange={setTheme}
            presentMode={presentMode}
            setPresentMode={setPresentMode}
            onSyncNodes={(nodes) => syncPageNodes(activePageId, nodes)}
            onSyncEdges={(edges) => syncPageEdges(activePageId, edges)}
            onSyncGroups={(groups) => syncPageGroups(activePageId, groups)}
          />
        )}
        {!presentMode && (
          <PageTabBar
            pages={pages}
            activePageId={activePageId}
            onSwitch={setActivePageId}
            onAdd={addPage}
            onRename={renamePage}
            onDelete={deletePage}
            onDuplicate={duplicatePage}
            onChangeColor={changePageColor}
            onChangeEmoji={changePageEmoji}
            T={T}
          />
        )}
      </div>
    </div>
  );
}
