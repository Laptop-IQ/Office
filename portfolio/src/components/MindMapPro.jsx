/* eslint-disable react/react-in-jsx-scope */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

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

// ─── Utilities ────────────────────────────────────────────────────────────────
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

const NODE_COLORS = [
  "#7c3aed",
  "#1d4ed8",
  "#0d9488",
  "#d97706",
  "#e11d48",
  "#4d7c0f",
  "#9f1239",
  "#0e7490",
  "#c026d3",
  "#ea580c",
  "#0369a1",
  "#166534",
];
const EDGE_STYLES = ["curve", "straight", "elbow", "arc"];
const FONT_FAMILIES = [
  "Inter",
  "Georgia",
  "'Courier New'",
  "'Trebuchet MS'",
  "Verdana",
];

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

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 14 }) => {
  const icons = {
    cursor: (
      <path
        d="M4 2l12 7-5 1.5-3 4.5V2z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
    ),
    hand: (
      <>
        <path
          d="M8 12V6m-2 2V5m4 7V5m2 7V7m2 5V9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M4 14s0 4 6 4 6-4 6-4V9"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </>
    ),
    link: (
      <path
        d="M10 13H7a4 4 0 010-8h3M14 11h3a4 4 0 000-8h-3M8 12h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    ),
    plus: (
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
    trash: (
      <path
        d="M6 7h12M9 7V5h6v2M10 11v5M14 11v5M7 7l1 11h8l1-11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    undo: (
      <>
        <path
          d="M4 8h9a5 5 0 010 10H8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M4 8l3-3-3 3 3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
    redo: (
      <>
        <path
          d="M20 8h-9a5 5 0 000 10h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M20 8l-3-3 3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
    search: (
      <>
        <circle
          cx="11"
          cy="11"
          r="7"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M20 20l-4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    magic: (
      <path
        d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
    ),
    eye: (
      <>
        <path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </>
    ),
    copy: (
      <>
        <rect
          x="9"
          y="9"
          width="13"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </>
    ),
    note: (
      <>
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
    collapse: (
      <path
        d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 8v8M9 12l3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    ),
    chevronR: (
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    chevronL: (
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    zoomin: (
      <>
        <circle
          cx="11"
          cy="11"
          r="7"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M20 20l-4-4M11 8v6M8 11h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    zoomout: (
      <>
        <circle
          cx="11"
          cy="11"
          r="7"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M20 20l-4-4M8 11h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    fit: (
      <path
        d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    pin: (
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
    ),
    save: (
      <>
        <path
          d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <polyline
          points="17 21 17 13 7 13 7 21"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <polyline
          points="7 3 7 8 15 8"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </>
    ),
    cloud: (
      <path
        d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    ),
    tag: (
      <>
        <path
          d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <line
          x1="7"
          y1="7"
          x2="7.01"
          y2="7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
    image: (
      <>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="8.5"
          cy="8.5"
          r="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M21 15l-5-5L5 21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
    grid: (
      <>
        <rect
          x="3"
          y="3"
          width="6"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <rect
          x="15"
          y="3"
          width="6"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <rect
          x="3"
          y="15"
          width="6"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <rect
          x="15"
          y="15"
          width="6"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </>
    ),
    down: (
      <path
        d="M12 4v14M6 13l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    up: (
      <path
        d="M12 20V6M6 11l6-6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    page: (
      <>
        <rect
          x="4"
          y="2"
          width="16"
          height="20"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M8 7h8M8 11h8M8 15h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    x: (
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    ),
    pencil: (
      <>
        <path
          d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
    // NEW ICONS
    group: (
      <>
        <rect
          x="3"
          y="3"
          width="8"
          height="8"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <rect
          x="13"
          y="3"
          width="8"
          height="8"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <rect
          x="3"
          y="13"
          width="8"
          height="8"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M17 13v-2m0-2V7M7 17h2m2 0h2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    history: (
      <>
        <path
          d="M1 4v6h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M3.51 15a9 9 0 102.13-9.36L1 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M12 7v5l4 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
    palette: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        <circle cx="15" cy="9" r="1.5" fill="currentColor" />
        <circle cx="9" cy="15" r="1.5" fill="currentColor" />
        <circle cx="15" cy="15" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    export: (
      <>
        <path
          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <polyline
          points="7 10 12 15 17 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <line
          x1="12"
          y1="15"
          x2="12"
          y2="3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    connect: (
      <>
        <circle
          cx="6"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="18"
          cy="6"
          r="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="18"
          cy="18"
          r="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M9 12h2m2 0h2M16 7.5l-2 3M16 16.5l-2-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    ungroup: (
      <>
        <path
          d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 2"
        />
        <path
          d="M9 12h6M12 9v6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    theme: (
      <>
        <path
          d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block", flexShrink: 0 }}
    >
      {icons[name] || null}
    </svg>
  );
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

// ─── Minimap ──────────────────────────────────────────────────────────────────
function Minimap({ nodes, viewBox, T }) {
  if (!nodes?.length) return null;
  const allX = nodes.map((n) => n.x),
    allY = nodes.map((n) => n.y);
  const minX = Math.min(...allX) - 100,
    minY = Math.min(...allY) - 100;
  const maxX = Math.max(...allX) + 100,
    maxY = Math.max(...allY) + 100;
  const W = 160,
    H = 100,
    rangeX = maxX - minX || 1,
    rangeY = maxY - minY || 1;
  const scale = Math.min(W / rangeX, H / rangeY) * 0.9;
  const ox = (W - rangeX * scale) / 2 - minX * scale,
    oy = (H - rangeY * scale) / 2 - minY * scale;
  const vx = viewBox.x * scale + ox,
    vy = viewBox.y * scale + oy,
    vw = viewBox.w * scale,
    vh = viewBox.h * scale;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 20,
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${T.border}`,
        background: T.surface,
      }}
    >
      <svg width={W} height={H}>
        {nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x * scale + ox}
            cy={n.y * scale + oy}
            r={4}
            fill={n.color}
            opacity={0.85}
          />
        ))}
        {isFinite(vx) && isFinite(vy) && (
          <rect
            x={vx}
            y={vy}
            width={vw}
            height={vh}
            fill="none"
            stroke={T.accent}
            strokeWidth={1}
            opacity={0.6}
          />
        )}
      </svg>
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

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function TBtn({ icon, label, active, danger, onClick, shortcut, T, badge }) {
  return (
    <button
      onClick={onClick}
      title={shortcut ? `${label || ""} (${shortcut})` : label || ""}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: label ? "0 12px" : "0 10px",
        height: 34,
        borderRadius: 6,
        cursor: "pointer",
        border: "none",
        background: active
          ? T.accent
          : danger
            ? "rgba(239,68,68,0.12)"
            : "transparent",
        color: active ? "#fff" : danger ? "#ef4444" : T.text,
        fontSize: 12,
        fontWeight: 500,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active && !danger) e.currentTarget.style.background = T.surface;
      }}
      onMouseLeave={(e) => {
        if (!active && !danger)
          e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon name={icon} size={14} />
      {label && <span>{label}</span>}
      {badge && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ef4444",
            border: `1.5px solid ${T.panel}`,
          }}
        />
      )}
    </button>
  );
}

// ─── Panel Section ────────────────────────────────────────────────────────────
function Section({ title, children, T, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 16px",
          background: "transparent",
          border: "none",
          color: T.muted,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        {title}
        <span
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s",
            opacity: 0.5,
          }}
        >
          ▾
        </span>
      </button>
      {open && <div style={{ padding: "0 16px 14px" }}>{children}</div>}
    </div>
  );
}

const inputStyle = (T) => ({
  width: "100%",
  padding: "7px 10px",
  borderRadius: 6,
  border: `1px solid ${T.border}`,
  background: T.surface,
  color: T.text,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
});

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

// ─── Page Templates ───────────────────────────────────────────────────────────
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
        cy = 2000,
        branches = ["Ideas", "Problems", "Solutions", "Next Steps"];
      const colors = ["#7c3aed", "#0d9488", "#d97706", "#e11d48"],
        angles = [-120, -60, 60, 120];
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
    edges: () => [
      ...["b0", "b1", "b2", "b3"].map((to, i) => ({
        id: `e${i}`,
        from: "root",
        to,
        label: "",
        style: "curve",
      })),
    ],
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
    edges: () => [
      ...["p0", "p1", "p2", "p3"].map((to, i) => ({
        id: `e${i}`,
        from: "root",
        to,
        label: "",
        style: "curve",
      })),
    ],
  },
  {
    id: "weekly",
    label: "Weekly Review",
    emoji: "📅",
    desc: "Mon–Sun with a review node",
    nodes: (title) => {
      const cx = 2000,
        cy = 2000,
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
      const quadrants = [
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
        ...quadrants.map((q, i) => ({
          id: `q${i}`,
          text: q.text,
          color: q.color,
          shape: "rounded",
          fontSize: 14,
          bold: true,
          italic: false,
          x: q.x,
          y: q.y,
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
    edges: () => [
      ...["q0", "q1", "q2", "q3"].map((to, i) => ({
        id: `eq${i}`,
        from: "root",
        to,
        label: "",
        style: "elbow",
      })),
    ],
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
      <style>{`@keyframes popupSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

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
            {/* Emoji & Color picker */}
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
              {/* Emoji picker button */}
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
              {/* Color swatches */}
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
            {/* Page emoji/icon */}
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
                className="tab-close"
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

      {/* Add page button */}
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

// ─── History Panel ────────────────────────────────────────────────────────────
function HistoryPanel({ history, redoStack, T, onUndo, onRedo, onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 270,
        width: 220,
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 500,
        overflow: "hidden",
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
          redoStack
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
        {history
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

// ─── Theme Switcher Popup ─────────────────────────────────────────────────────
function ThemeSwitcher({ T, theme, onTheme, onClose }) {
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
        position: "absolute",
        top: 54,
        left: "50%",
        transform: "translateX(-50%)",
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 8,
        zIndex: 800,
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        width: 280,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {Object.entries(THEMES).map(([name, t]) => (
        <button
          key={name}
          onClick={() => {
            onTheme(name);
            onClose();
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${theme === name ? t.accent : T.border}`,
            background: theme === name ? t.accent + "22" : T.surface,
            cursor: "pointer",
            width: 60,
          }}
        >
          <div style={{ display: "flex", gap: 2 }}>
            {[t.bg, t.accent, t.text].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: c,
                  border: `1px solid ${T.border}`,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 9,
              color: theme === name ? T.accent : T.muted,
              fontWeight: theme === name ? 700 : 400,
            }}
          >
            {name}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Connections Panel (inside right panel "Node" tab) ────────────────────────
function ConnectionsList({ nodeId, nodes, edges, onFocus, T }) {
  const incoming = edges
    .filter((e) => e.to === nodeId)
    .map((e) => ({
      ...e,
      dir: "in",
      other: nodes.find((n) => n.id === e.from),
    }));
  const outgoing = edges
    .filter((e) => e.from === nodeId)
    .map((e) => ({
      ...e,
      dir: "out",
      other: nodes.find((n) => n.id === e.to),
    }));
  const all = [...incoming, ...outgoing];
  if (!all.length)
    return (
      <div style={{ fontSize: 12, color: "#64748b", padding: "8px 0" }}>
        No connections
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {all.map((c) => (
        <button
          key={c.id}
          onClick={() => onFocus(c.other?.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: T.surface,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: c.other?.color || T.muted,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: T.text,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {c.other?.text || "?"}
          </span>
          <span
            style={{
              fontSize: 9,
              color: T.muted,
              background: T.panel,
              padding: "2px 5px",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {c.dir === "in" ? "← in" : "out →"}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Groups Panel ─────────────────────────────────────────────────────────────
function GroupsPanel({
  nodes,
  groups,
  multiSel,
  T,
  onGroup,
  onUngroup,
  onSelectGroup,
  onDeleteGroup,
  onRenameGroup,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  return (
    <div>
      {/* Create new group from selection */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>
          {multiSel.size > 1
            ? `${multiSel.size} nodes selected`
            : "Select multiple nodes first"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && multiSel.size > 1) {
                onGroup([...multiSel], newGroupName || "Group");
                setNewGroupName("");
              }
            }}
            style={{ ...inputStyle(T), flex: 1, fontSize: 12 }}
          />
          <button
            onClick={() => {
              if (multiSel.size > 1) {
                onGroup([...multiSel], newGroupName || "Group");
                setNewGroupName("");
              }
            }}
            disabled={multiSel.size < 2}
            style={{
              padding: "0 10px",
              borderRadius: 6,
              border: "none",
              background: multiSel.size > 1 ? T.accent : T.border,
              color: "white",
              cursor: multiSel.size > 1 ? "pointer" : "default",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Group
          </button>
        </div>
      </div>
      {/* Existing groups */}
      {groups.length === 0 && (
        <div
          style={{
            fontSize: 12,
            color: T.muted,
            textAlign: "center",
            padding: "12px 0",
          }}
        >
          No groups yet
        </div>
      )}
      {groups.map((g) => {
        const memberCount = nodes.filter((n) => n.groupId === g.id).length;
        return (
          <div
            key={g.id}
            style={{
              marginBottom: 6,
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: T.surface,
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
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: g.color || T.accent,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.text,
                  flex: 1,
                }}
              >
                {g.name}
              </span>
              <span style={{ fontSize: 10, color: T.muted }}>
                {memberCount} nodes
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => onSelectGroup(g.id)}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  borderRadius: 5,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.muted,
                  cursor: "pointer",
                  fontSize: 10,
                }}
              >
                Select
              </button>
              <button
                onClick={() => onUngroup(g.id)}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  borderRadius: 5,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.muted,
                  cursor: "pointer",
                  fontSize: 10,
                }}
              >
                Ungroup
              </button>
              <button
                onClick={() => onDeleteGroup(g.id)}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  borderRadius: 5,
                  border: `1px solid rgba(239,68,68,0.3)`,
                  background: "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: 10,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Default root node ────────────────────────────────────────────────────────
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

// ─── Map Canvas ───────────────────────────────────────────────────────────────
function MapCanvas({
  mapId,
  pageId,
  initialNodes,
  initialEdges,
  initialGroups,
  theme,
  T,
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
  const [panelTab, setPanelTab] = useState("node");
  const [panelOpen, setPanelOpen] = useState(true);
  const [mode, setMode] = useState("select");
  const [edgeStyle, setEdgeStyle] = useState("curve");
  const [showGrid, setShowGrid] = useState(true);
  const [showMini, setShowMini] = useState(true);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [lasso, setLasso] = useState(null);
  const [lassoStart, setLassoStart] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [palette, setPalette] = useState("Violet");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [animatedEdges, setAnimatedEdges] = useState(false);
  const [edgeLabelEdit, setEdgeLabelEdit] = useState(null);
  const [imageInput, setImageInput] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [addBtnHover, setAddBtnHover] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [showHistory, setShowHistory] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [localTheme, setLocalTheme] = useState(T);

  const svgRef = useRef();
  const editRef = useRef();
  const syncTimer = useRef(null);
  const hoverLeaveTimer = useRef(null);
  const { toasts, add: toast } = useToast();

  // When theme prop changes, update local
  useEffect(() => {
    setSelectedTheme(theme);
    setLocalTheme(T);
  }, [theme]);

  const CT = THEMES[selectedTheme] || T; // current theme

  useEffect(() => {
    onSyncNodes(nodes);
  }, [nodes]);
  useEffect(() => {
    onSyncEdges(edges);
  }, [edges]);
  useEffect(() => {
    onSyncGroups(groups);
  }, [groups]);

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

  const fitAll = () => {
    if (!nodes.length) return;
    const xs = nodes.map((n) => n.x),
      ys = nodes.map((n) => n.y),
      pad = 120;
    const w = Math.max(...xs) - Math.min(...xs) + pad * 2,
      h = Math.max(...ys) - Math.min(...ys) + pad * 2;
    setViewBox({
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      w: Math.max(w, 400),
      h: Math.max(h, 300),
    });
    setZoomLevel(Math.round((SVG_W / Math.max(w, 400)) * 100));
    toast("Fit to screen");
  };

  const focusNode = (id) => {
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    setViewBox((v) => ({ ...v, x: n.x - v.w / 2, y: n.y - v.h / 2 }));
    setSelected(id);
    setMultiSel(new Set([id]));
  };

  const addChild = useCallback(
    async (parentId, label = "New Idea") => {
      const pid = parentId || selected;
      if (!pid) return;
      const parent = nodes.find((n) => n.id === pid);
      if (!parent) return;
      snapshot();
      const childCount = edges.filter((e) => e.from === pid).length;
      const angle = ((childCount * 50 - 80) * Math.PI) / 180;
      const dist = 200;
      const colorSet = PALETTES[palette];
      const color = colorSet[childCount % colorSet.length];
      const tempId = uid(),
        tempEdgeId = uid();
      const newNode = {
        id: tempId,
        text: label,
        x: snap(parent.x + Math.cos(angle) * dist),
        y: snap(parent.y + Math.sin(angle) * dist),
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
      setTimeout(() => {
        setEditId(tempId);
        setEditText(label);
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
      // Remove from groups
      setGroups((gs) => gs.map((g) => g));
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

  // ─── Groups ────────────────────────────────────────────────────────────────
  const createGroup = (nodeIds, name) => {
    snapshot();
    const gid = uid();
    const memberNodes = nodes.filter((n) => nodeIds.includes(n.id));
    const colors = memberNodes.map((n) => n.color);
    const color = colors[0] || CT.accent;
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

  // ─── Export PNG ────────────────────────────────────────────────────────────
  const exportPNG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const xs = nodes.map((n) => n.x),
      ys = nodes.map((n) => n.y),
      pad = 80;
    const minX = Math.min(...xs) - pad,
      minY = Math.min(...ys) - pad;
    const maxX = Math.max(...xs) + pad,
      maxY = Math.max(...ys) + pad;
    const W = maxX - minX,
      H = maxY - minY;
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
      if (lassoStart) {
        const pt = svgPt(e);
        setLasso({
          x: Math.min(lassoStart.x, pt.x),
          y: Math.min(lassoStart.y, pt.y),
          w: Math.abs(pt.x - lassoStart.x),
          h: Math.abs(pt.y - lassoStart.y),
        });
      }
    },
    [dragging, panStart, lassoStart, viewBox, snap],
  );

  const onMouseUp = useCallback(
    (e) => {
      if (dragging?.moved) {
        snapshot();
        scheduleSync(nodes, edges);
      }
      setDragging(null);
      setPanStart(null);
      if (lasso) {
        const { x, y, w, h } = lasso;
        const hit = nodes
          .filter((n) => n.x >= x && n.x <= x + w && n.y >= y && n.y <= y + h)
          .map((n) => n.id);
        if (hit.length) {
          setMultiSel(new Set(hit));
          setSelected(hit[0]);
        }
        setLasso(null);
        setLassoStart(null);
      }
    },
    [dragging, lasso, nodes, edges, snapshot, scheduleSync],
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
      const pt = svgPt(e);
      setLassoStart(pt);
      setLasso(null);
      if (!e.shiftKey) {
        setMultiSel(new Set());
        setSelected(null);
      }
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
    const newText = editText || nodes.find((n) => n.id === editId)?.text;
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

  useEffect(() => {
    const h = (e) => {
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
        setShowThemes(false);
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

  const autoArrange = (type = "radial") => {
    snapshot();
    const root = nodes.find((n) => n.id === "root");
    if (!root) return;
    const positions = {},
      arranged = new Set();
    const dfs = (id, angle, spread, dist) => {
      if (arranged.has(id)) return;
      arranged.add(id);
      const parent = positions[id] || { x: root.x, y: root.y };
      const children = edges
        .filter((e) => e.from === id)
        .map((e) => e.to)
        .filter((c) => !arranged.has(c));
      children.forEach((cid, i) => {
        const a =
          type === "horizontal"
            ? (i - (children.length - 1) / 2) * 60
            : angle -
              spread / 2 +
              (spread / (children.length || 1)) * (i + 0.5);
        const nx =
          type === "horizontal"
            ? parent.x + dist
            : parent.x + Math.cos((a * Math.PI) / 180) * dist;
        const ny =
          type === "horizontal"
            ? parent.y + (i - (children.length - 1) / 2) * 120
            : parent.y + Math.sin((a * Math.PI) / 180) * dist;
        positions[cid] = { x: snap(nx), y: snap(ny) };
        dfs(cid, a, spread * 0.65, dist * 0.82);
      });
    };
    positions["root"] = { x: root.x, y: root.y };
    dfs("root", 0, 360, 210);
    const next = nodes.map((n) =>
      positions[n.id] ? { ...n, ...positions[n.id] } : n,
    );
    setNodes(next);
    scheduleSync(next, edges);
    toast("Layout applied");
  };

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

  // Group bounding boxes for rendering
  const groupBounds = useMemo(() => {
    return groups
      .map((g) => {
        const members = visibleNodes.filter((n) => n.groupId === g.id);
        if (members.length === 0) return null;
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
          const from = nodes.find((n) => n.id === edge.from),
            to = nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;
          const isActive = multiSel.has(edge.from) || multiSel.has(edge.to);
          const path = getEdgePath(from, to, edge.style || edgeStyle);
          const mx = (from.x + to.x) / 2,
            my = (from.y + to.y) / 2;
          return (
            <g key={edge.id}>
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                style={{ cursor: "pointer" }}
                onClick={() => removeEdge(edge.id)}
              />
              <path
                d={path}
                fill="none"
                stroke={isActive ? CT.accent : CT.muted}
                strokeWidth={isActive ? 2 : 1.4}
                strokeOpacity={isActive ? 1 : 0.45}
                markerEnd={isActive ? "url(#arrowActive)" : "url(#arrowhead)"}
                strokeDasharray={animatedEdges ? "8 4" : undefined}
                style={
                  animatedEdges
                    ? { animation: "dash 0.6s linear infinite" }
                    : undefined
                }
              />
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
          const isLinking = linking === node.id,
            collapseCount = edges.filter((e) => e.from === node.id).length;
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
              {/* Group indicator dot */}
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
                  fill={node.color + "1a"}
                  stroke={node.color}
                  strokeWidth={isSel ? 2 : 1.5}
                />
              ) : node.shape === "diamond" ? (
                <rect
                  x={8}
                  y={8}
                  width={W - 16}
                  height={H - 16}
                  rx={6}
                  fill={node.color + "1a"}
                  stroke={node.color}
                  strokeWidth={isSel ? 2 : 1.5}
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
                        : 10
                  }
                  fill={node.color + "18"}
                  stroke={
                    isSel
                      ? node.color
                      : isHovered
                        ? node.color + "99"
                        : node.color + "60"
                  }
                  strokeWidth={isSel ? 2 : isHovered ? 1.8 : 1.5}
                  style={{ transition: "stroke 0.15s,stroke-width 0.15s" }}
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
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: CT.text,
                      fontSize: node.fontSize || 14,
                      fontWeight: node.bold ? 700 : 400,
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
                  fill={CT.text}
                  fontSize={node.fontSize || 14}
                  fontWeight={node.bold ? 700 : 400}
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

        {lasso && (
          <rect
            x={lasso.x}
            y={lasso.y}
            width={lasso.w}
            height={lasso.h}
            fill={CT.accent + "15"}
            stroke={CT.accent}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
        )}
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

      {/* ── Toolbar ── */}
      {!presentMode && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: CT.panel,
            border: `1px solid ${CT.border}`,
            borderRadius: 10,
            padding: "3px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 1,
              padding: "0 2px",
              borderRight: `1px solid ${CT.border}`,
              marginRight: 4,
            }}
          >
            {[
              ["cursor", "Select", "select", "1"],
              ["hand", "Pan", "pan", "2"],
              ["link", "Link", "link", "3"],
            ].map(([ico, lab, m, key]) => (
              <TBtn
                key={m}
                icon={ico}
                label={lab}
                active={mode === m}
                onClick={() => {
                  setMode(m);
                  setLinking(null);
                }}
                shortcut={key}
                T={CT}
              />
            ))}
          </div>
          <TBtn
            icon="plus"
            label="Child"
            onClick={() => addChild()}
            shortcut="Tab"
            T={CT}
          />
          <TBtn
            icon="trash"
            danger
            onClick={() => deleteNodes(multiSel)}
            shortcut="Del"
            T={CT}
          />
          <TBtn
            icon="copy"
            label="Dup"
            onClick={duplicateNode}
            shortcut="⌘D"
            T={CT}
          />
          <div
            style={{
              width: 1,
              height: 24,
              background: CT.border,
              margin: "0 4px",
            }}
          />
          <TBtn icon="undo" onClick={undo} shortcut="⌘Z" T={CT} />
          <TBtn icon="redo" onClick={redo} shortcut="⌘Y" T={CT} />
          <TBtn
            icon="history"
            onClick={() => setShowHistory((h) => !h)}
            active={showHistory}
            T={CT}
            badge={history.length > 0}
          />
          <div
            style={{
              width: 1,
              height: 24,
              background: CT.border,
              margin: "0 4px",
            }}
          />
          <TBtn
            icon="magic"
            label="Layout"
            onClick={() => autoArrange("radial")}
            T={CT}
          />
          <TBtn icon="fit" onClick={fitAll} shortcut="0" T={CT} />
          <TBtn
            icon="zoomin"
            onClick={() => doZoom(0.85)}
            shortcut="+"
            T={CT}
          />
          <TBtn
            icon="zoomout"
            onClick={() => doZoom(1.15)}
            shortcut="-"
            T={CT}
          />
          <div
            style={{
              padding: "0 10px",
              fontSize: 12,
              fontWeight: 600,
              color: CT.muted,
              borderLeft: `1px solid ${CT.border}`,
              marginLeft: 2,
            }}
          >
            {zoomLevel}%
          </div>
          <div
            style={{
              width: 1,
              height: 24,
              background: CT.border,
              margin: "0 4px",
            }}
          />
          {/* Theme switcher button */}
          <div style={{ position: "relative" }}>
            <TBtn
              icon="theme"
              onClick={() => setShowThemes((s) => !s)}
              active={showThemes}
              T={CT}
            />
            {showThemes && (
              <ThemeSwitcher
                T={CT}
                theme={selectedTheme}
                onTheme={(t) => setSelectedTheme(t)}
                onClose={() => setShowThemes(false)}
              />
            )}
          </div>
          {/* Export PNG */}
          <TBtn icon="export" onClick={exportPNG} T={CT} />
          <TBtn
            icon="save"
            label="Save"
            onClick={saveNow}
            shortcut="⌘S"
            T={CT}
          />
          <TBtn
            icon="search"
            onClick={() => setShowSearch((s) => !s)}
            shortcut="⌘F"
            T={CT}
          />
          <TBtn
            icon="chevronR"
            onClick={() => setPanelOpen((p) => !p)}
            T={CT}
          />
        </div>
      )}

      {/* History Panel */}
      {showHistory && !presentMode && (
        <HistoryPanel
          history={history}
          redoStack={redoStack}
          T={CT}
          onUndo={undo}
          onRedo={redo}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Search */}
      {showSearch && !presentMode && (
        <div
          style={{
            position: "absolute",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            background: CT.panel,
            border: `1px solid ${CT.border}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
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
              {[...searchHits]
                .map((id, i) => (
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
                ))
                .slice(0, 3)}
            </div>
          )}
        </div>
      )}

      {/* Status bar */}
      {!presentMode && (
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: showMini ? 190 : 20,
            background: CT.panel,
            border: `1px solid ${CT.border}`,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            gap: 0,
            fontSize: 11,
            color: CT.muted,
            overflow: "hidden",
          }}
        >
          <SyncBadge status={syncStatus} T={CT} />
          {[
            `${nodes.length} nodes`,
            `${edges.length} edges`,
            `${groups.length} groups`,
            multiSel.size > 1 ? `${multiSel.size} selected` : "",
          ]
            .filter(Boolean)
            .map((v, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 12px",
                  borderLeft: `1px solid ${CT.border}`,
                }}
              >
                {v}
              </div>
            ))}
          <div
            style={{
              padding: "6px 12px",
              borderLeft: `1px solid ${CT.border}`,
            }}
          >
            <button
              onClick={() => setShowGrid((g) => !g)}
              style={{
                background: "transparent",
                border: "none",
                color: showGrid ? CT.accent : CT.muted,
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              Grid
            </button>
          </div>
          <div
            style={{
              padding: "6px 12px",
              borderLeft: `1px solid ${CT.border}`,
            }}
          >
            <button
              onClick={() => setShowMini((m) => !m)}
              style={{
                background: "transparent",
                border: "none",
                color: showMini ? CT.accent : CT.muted,
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              Map
            </button>
          </div>
        </div>
      )}

      {showMini && !presentMode && (
        <Minimap nodes={visibleNodes} viewBox={viewBox} T={CT} />
      )}

      {mode === "link" && !presentMode && (
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: "50%",
            transform: "translateX(-50%)",
            background: CT.panel,
            border: `1px solid ${CT.border}`,
            color: "#fbbf24",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {linking
            ? "Click destination node to connect"
            : "Click source node to start linking"}{" "}
          · Esc to cancel
        </div>
      )}

      {/* ── Right Panel ── */}
      {panelOpen && !presentMode && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 268,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: CT.panel,
            borderLeft: `1px solid ${CT.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              borderBottom: `1px solid ${CT.border}`,
              flexShrink: 0,
            }}
          >
            {[
              ["node", "Node"],
              ["connect", "Links"],
              ["group", "Groups"],
              ["style", "Style"],
              ["map", "Map"],
            ].map(([t, l]) => (
              <button
                key={t}
                onClick={() => setPanelTab(t)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  background: panelTab === t ? CT.surface : "transparent",
                  color: panelTab === t ? CT.text : CT.muted,
                  borderBottom:
                    panelTab === t
                      ? `2px solid ${CT.accent}`
                      : "2px solid transparent",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* ── NODE TAB ── */}
            {panelTab === "node" && selectedNode && (
              <>
                <Section title="Label & Content" T={CT}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input
                      value={selectedNode.emoji || ""}
                      onChange={(e) => upNode("emoji", e.target.value)}
                      placeholder="😀"
                      style={{
                        ...inputStyle(CT),
                        width: 44,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    />
                    <input
                      value={selectedNode.text}
                      onChange={(e) => upNode("text", e.target.value)}
                      style={{ ...inputStyle(CT), flex: 1 }}
                    />
                  </div>
                  <textarea
                    value={selectedNode.note || ""}
                    onChange={(e) => upNode("note", e.target.value)}
                    placeholder="Add a note…"
                    rows={3}
                    style={{
                      ...inputStyle(CT),
                      resize: "vertical",
                      lineHeight: 1.5,
                    }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <input
                      value={selectedNode.tag || ""}
                      onChange={(e) => upNode("tag", e.target.value)}
                      placeholder="#tag"
                      style={{ ...inputStyle(CT) }}
                    />
                  </div>
                </Section>
                <Section title="Color" T={CT}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {NODE_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => upNode("color", c)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          border: "none",
                          background: c,
                          cursor: "pointer",
                          outline:
                            selectedNode.color === c
                              ? "2px solid white"
                              : "2px solid transparent",
                          outlineOffset: 2,
                          transition: "transform 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.15)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{ fontSize: 11, color: CT.muted, flexShrink: 0 }}
                    >
                      Custom
                    </label>
                    <input
                      type="color"
                      value={selectedNode.color}
                      onChange={(e) => upNode("color", e.target.value)}
                      style={{
                        width: 36,
                        height: 28,
                        border: `1px solid ${CT.border}`,
                        borderRadius: 6,
                        padding: 2,
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </Section>
                <Section title="Typography" T={CT}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: 11,
                        color: CT.muted,
                        width: 70,
                        flexShrink: 0,
                        paddingTop: 8,
                      }}
                    >
                      Size {selectedNode.fontSize || 14}px
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={36}
                      value={selectedNode.fontSize || 14}
                      onChange={(e) => upNode("fontSize", +e.target.value)}
                      style={{ flex: 1, accentColor: CT.accent }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {[
                      ["B", "bold"],
                      ["I", "italic"],
                    ].map(([l, k]) => (
                      <button
                        key={k}
                        onClick={() => upNode(k, !selectedNode[k])}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 6,
                          border: `1px solid ${CT.border}`,
                          background: selectedNode[k] ? CT.accent : CT.surface,
                          color: selectedNode[k] ? "white" : CT.text,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <select
                    value={selectedNode.fontFamily || "Inter"}
                    onChange={(e) => upNode("fontFamily", e.target.value)}
                    style={{ ...inputStyle(CT) }}
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f} value={f}>
                        {f.replace(/'/g, "")}
                      </option>
                    ))}
                  </select>
                </Section>
                <Section title="Shape" T={CT}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {["rounded", "pill", "diamond", "hexagon", "circle"].map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() => upNode("shape", s)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 6,
                            border: `1px solid ${selectedNode.shape === s ? CT.accent : CT.border}`,
                            background:
                              selectedNode.shape === s
                                ? CT.accent + "22"
                                : CT.surface,
                            color:
                              selectedNode.shape === s ? CT.text : CT.muted,
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          {s}
                        </button>
                      ),
                    )}
                  </div>
                </Section>
                <Section title="Image URL" T={CT} defaultOpen={false}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      placeholder="https://…"
                      style={{ ...inputStyle(CT), flex: 1 }}
                    />
                    <button
                      onClick={() => {
                        upNode("image", imageInput);
                        setImageInput("");
                        toast("Image set", "success");
                      }}
                      style={{
                        padding: "0 12px",
                        borderRadius: 6,
                        border: `1px solid ${CT.border}`,
                        background: CT.surface,
                        color: CT.text,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Set
                    </button>
                  </div>
                  {selectedNode.image && (
                    <button
                      onClick={() => upNode("image", "")}
                      style={{
                        marginTop: 6,
                        width: "100%",
                        padding: "5px",
                        borderRadius: 6,
                        border: `1px solid ${CT.border}`,
                        background: CT.surface,
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: 11,
                      }}
                    >
                      Remove Image
                    </button>
                  )}
                </Section>
                <Section title="Options" T={CT} defaultOpen={false}>
                  {[
                    ["locked", "🔒 Locked", "Lock node"],
                    ["collapsed", "⬇ Collapsed", "Hide children"],
                  ].map(([k, l, desc]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{l}</div>
                        <div style={{ fontSize: 10, color: CT.muted }}>
                          {desc}
                        </div>
                      </div>
                      <button
                        onClick={() => upNode(k, !selectedNode[k])}
                        style={{
                          width: 40,
                          height: 22,
                          borderRadius: 11,
                          border: "none",
                          cursor: "pointer",
                          background: selectedNode[k] ? CT.accent : "#333",
                          position: "relative",
                          transition: "background 0.2s",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 3,
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            background: "white",
                            transition: "left 0.15s",
                            left: selectedNode[k] ? 21 : 3,
                          }}
                        />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
                    <button
                      onClick={() => {
                        snapshot();
                        addChild();
                      }}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 6,
                        border: `1px solid ${CT.border}`,
                        background: CT.surface,
                        color: CT.text,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      + Child
                    </button>
                    <button
                      onClick={duplicateNode}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 6,
                        border: `1px solid ${CT.border}`,
                        background: CT.surface,
                        color: CT.text,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      Duplicate
                    </button>
                  </div>
                  <button
                    onClick={() => deleteNodes(multiSel)}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "8px",
                      borderRadius: 6,
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: "rgba(239,68,68,0.08)",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Delete Node{multiSel.size > 1 ? `s (${multiSel.size})` : ""}
                  </button>
                </Section>
              </>
            )}
            {panelTab === "node" && !selectedNode && (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: CT.muted,
                  fontSize: 13,
                }}
              >
                Click a node to edit it
              </div>
            )}

            {/* ── CONNECTIONS TAB ── */}
            {panelTab === "connect" && (
              <div style={{ padding: "14px 16px" }}>
                {selectedNode ? (
                  <>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: CT.text,
                        marginBottom: 4,
                      }}
                    >
                      {selectedNode.emoji} {selectedNode.text}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: CT.muted,
                        marginBottom: 12,
                      }}
                    >
                      All connections for this node
                    </div>
                    <ConnectionsList
                      nodeId={selected}
                      nodes={nodes}
                      edges={edges}
                      onFocus={focusNode}
                      T={CT}
                    />
                  </>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: CT.muted,
                      fontSize: 12,
                      paddingTop: 16,
                    }}
                  >
                    Select a node to see its connections
                  </div>
                )}
                <div
                  style={{
                    marginTop: 20,
                    padding: "12px",
                    borderRadius: 8,
                    border: `1px solid ${CT.border}`,
                    background: CT.surface,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: CT.muted,
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    ALL EDGES ({edges.length})
                  </div>
                  <div
                    style={{
                      maxHeight: 180,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {edges.map((e) => {
                      const from = nodes.find((n) => n.id === e.from),
                        to = nodes.find((n) => n.id === e.to);
                      return (
                        <div
                          key={e.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: CT.muted,
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: from?.color || CT.muted,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {from?.text?.slice(0, 10) || "?"}
                          </span>
                          <span style={{ opacity: 0.5 }}>→</span>
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: to?.color || CT.muted,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {to?.text?.slice(0, 10) || "?"}
                          </span>
                          <button
                            onClick={() => removeEdge(e.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: 10,
                              padding: "0 4px",
                              flexShrink: 0,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                    {edges.length === 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: CT.muted,
                          textAlign: "center",
                          padding: "8px 0",
                        }}
                      >
                        No edges yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── GROUPS TAB ── */}
            {panelTab === "group" && (
              <div style={{ padding: "14px 16px" }}>
                <GroupsPanel
                  nodes={nodes}
                  groups={groups}
                  multiSel={multiSel}
                  T={CT}
                  onGroup={createGroup}
                  onUngroup={ungroupGroup}
                  onSelectGroup={selectGroup}
                  onDeleteGroup={deleteGroup}
                  onRenameGroup={(gid, name) => {
                    setGroups((gs) =>
                      gs.map((g) => (g.id === gid ? { ...g, name } : g)),
                    );
                  }}
                />
              </div>
            )}

            {/* ── STYLE TAB ── */}
            {panelTab === "style" && (
              <>
                <Section title="Edge Style" T={CT}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {EDGE_STYLES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setEdgeStyle(s)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: `1px solid ${edgeStyle === s ? CT.accent : CT.border}`,
                          background:
                            edgeStyle === s ? CT.accent + "22" : CT.surface,
                          color: edgeStyle === s ? CT.text : CT.muted,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 12, color: CT.muted }}>
                      Animated edges
                    </span>
                    <button
                      onClick={() => setAnimatedEdges((a) => !a)}
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 11,
                        border: "none",
                        cursor: "pointer",
                        background: animatedEdges ? CT.accent : "#333",
                        position: "relative",
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 3,
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          background: "white",
                          transition: "left 0.15s",
                          left: animatedEdges ? 21 : 3,
                        }}
                      />
                    </button>
                  </div>
                </Section>
                <Section title="Auto-Layout" T={CT}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      ["Radial", "radial"],
                      ["Tree", "horizontal"],
                    ].map(([l, t]) => (
                      <button
                        key={t}
                        onClick={() => autoArrange(t)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: 6,
                          border: `1px solid ${CT.border}`,
                          background: CT.surface,
                          color: CT.text,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title="Color Palette" T={CT}>
                  {Object.keys(PALETTES).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPalette(p)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: 6,
                        marginBottom: 4,
                        border: `1px solid ${palette === p ? CT.accent : CT.border}`,
                        background:
                          palette === p ? CT.accent + "15" : CT.surface,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", gap: 3 }}>
                        {PALETTES[p].map((c) => (
                          <div
                            key={c}
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              background: c,
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 12, color: CT.text }}>{p}</span>
                    </button>
                  ))}
                </Section>
                <Section title="Canvas" T={CT}>
                  {[
                    ["Show grid", showGrid, setShowGrid],
                    ["Show labels", showLabels, setShowLabels],
                    ["Snap to grid", snapToGrid, setSnapToGrid],
                    ["Show minimap", showMini, setShowMini],
                  ].map(([l, val, set]) => (
                    <div
                      key={l}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 12, color: CT.muted }}>{l}</span>
                      <button
                        onClick={() => set((v) => !v)}
                        style={{
                          width: 40,
                          height: 22,
                          borderRadius: 11,
                          border: "none",
                          cursor: "pointer",
                          background: val ? CT.accent : "#333",
                          position: "relative",
                          transition: "background 0.2s",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 3,
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            background: "white",
                            transition: "left 0.15s",
                            left: val ? 21 : 3,
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </Section>
              </>
            )}

            {/* ── MAP TAB ── */}
            {panelTab === "map" && (
              <>
                <Section title="Theme" T={CT}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    {Object.keys(THEMES).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTheme(t)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 3,
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: `1px solid ${selectedTheme === t ? CT.accent : CT.border}`,
                          background:
                            selectedTheme === t ? CT.accent + "18" : CT.surface,
                          cursor: "pointer",
                          minWidth: 56,
                        }}
                      >
                        <div style={{ display: "flex", gap: 2 }}>
                          {[THEMES[t].bg, THEMES[t].accent, THEMES[t].text].map(
                            (c, i) => (
                              <div
                                key={i}
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 2,
                                  background: c,
                                }}
                              />
                            ),
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 9,
                            color: selectedTheme === t ? CT.accent : CT.muted,
                            fontWeight: selectedTheme === t ? 700 : 400,
                          }}
                        >
                          {t}
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>
                {mapId && (
                  <Section title="Sync" T={CT}>
                    <div
                      style={{
                        fontSize: 11,
                        color: CT.muted,
                        marginBottom: 8,
                        wordBreak: "break-all",
                      }}
                    >
                      Map ID:{" "}
                      <span style={{ color: CT.text, fontFamily: "monospace" }}>
                        {mapId}
                      </span>
                    </div>
                    <button
                      onClick={saveNow}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: 6,
                        border: `1px solid ${CT.border}`,
                        background: CT.surface,
                        color: CT.text,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="save" size={13} /> Save Now
                    </button>
                  </Section>
                )}
                <Section title="Export" T={CT}>
                  {[
                    ["⬇ JSON", "json", exportJSON],
                    ["⬇ Markdown", "md", exportMarkdown],
                    ["⬇ SVG", "svg", exportSVG],
                    ["⬇ PNG Image", "png", exportPNG],
                  ].map(([l, k, fn]) => (
                    <button
                      key={k}
                      onClick={fn}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: 6,
                        marginBottom: 6,
                        border: `1px solid ${CT.border}`,
                        background: CT.surface,
                        color: CT.text,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                        textAlign: "left",
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </Section>
                <Section title="Import" T={CT}>
                  <label
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px",
                      borderRadius: 6,
                      border: `1px solid ${CT.border}`,
                      background: CT.surface,
                      color: CT.text,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                      textAlign: "center",
                    }}
                  >
                    ⬆ Import JSON
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: "none" }}
                      onChange={importJSON}
                    />
                  </label>
                </Section>
                <Section title="Stats" T={CT} defaultOpen={false}>
                  {[
                    ["Nodes", nodes.length],
                    ["Edges", edges.length],
                    ["Groups", groups.length],
                    ["History", history.length],
                    ["Selected", multiSel.size],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "5px 0",
                        borderBottom: `1px solid ${CT.border}`,
                      }}
                    >
                      <span style={{ fontSize: 12, color: CT.muted }}>{l}</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: CT.text,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </Section>
                <Section title="Keyboard Shortcuts" T={CT} defaultOpen={false}>
                  {[
                    ["Tab", "Add child"],
                    ["Del", "Delete node"],
                    ["⌘Z", "Undo"],
                    ["⌘Y", "Redo"],
                    ["⌘D", "Duplicate"],
                    ["⌘A", "Select all"],
                    ["⌘F", "Search"],
                    ["⌘S", "Save"],
                    ["⌘G", "Group selected"],
                    ["1/2/3", "Select/Pan/Link"],
                    ["0", "Fit all"],
                    ["+/-", "Zoom"],
                    ["P", "Present mode"],
                    ["Esc", "Cancel"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 0",
                        borderBottom: `1px solid ${CT.border}`,
                      }}
                    >
                      <span style={{ fontSize: 11, color: CT.muted }}>{v}</span>
                      <kbd
                        style={{
                          fontSize: 10,
                          color: CT.text,
                          background: CT.surface,
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: `1px solid ${CT.border}`,
                        }}
                      >
                        {k}
                      </kbd>
                    </div>
                  ))}
                </Section>
              </>
            )}
          </div>
        </div>
      )}

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

      {presentMode && (
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 9999 }}>
          <button
            onClick={() => setPresentMode(false)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: `1px solid ${CT.border}`,
              background: CT.panel,
              color: CT.text,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ✕ Exit Presentation
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MindMapPro({ mapId: propMapId }) {
  const [mapId, setMapId] = useState(propMapId || null);
  const [loadState, setLoadState] = useState("loading");
  const [theme, setTheme] = useState("Obsidian");
  const [presentMode, setPresentMode] = useState(false);
  const T = THEMES[theme];

  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);

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
    const newId = uid();
    const title = name || `Page ${pages.length + 1}`;
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
