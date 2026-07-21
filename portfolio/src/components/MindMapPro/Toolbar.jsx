/* eslint-disable react/react-in-jsx-scope */
import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

// ─── THEMES (needed for ThemeSwitcher color previews) ────────────────────────
const THEMES = {
  Obsidian: {
    bg: "#0a0a0f",
    surface: "#111118",
    panel: "#13131c",
    border: "#1e1e30",
    text: "#e2e8f0",
    muted: "#64748b",
    accent: "#7c3aed",
  },
  Midnight: {
    bg: "#000814",
    surface: "#001233",
    panel: "#001845",
    border: "#0a2463",
    text: "#caf0f8",
    muted: "#4895ef",
    accent: "#4361ee",
  },
  Graphite: {
    bg: "#111111",
    surface: "#1a1a1a",
    panel: "#222222",
    border: "#333333",
    text: "#f5f5f5",
    muted: "#888888",
    accent: "#ff4757",
  },
  Forest: {
    bg: "#0a1628",
    surface: "#0f2033",
    panel: "#122440",
    border: "#1a3a5c",
    text: "#e2f0fb",
    muted: "#5b9fd6",
    accent: "#00b4d8",
  },
  Abyss: {
    bg: "#060612",
    surface: "#0d0d2b",
    panel: "#10103a",
    border: "#1c1c50",
    text: "#e0e7ff",
    muted: "#6366f1",
    accent: "#818cf8",
  },
  Dawn: {
    bg: "#faf7f2",
    surface: "#f2ede4",
    panel: "#ede7db",
    border: "#d4c9b8",
    text: "#1a1208",
    muted: "#7c6e5a",
    accent: "#b45309",
  },
  Ocean: {
    bg: "#020b18",
    surface: "#041426",
    panel: "#061c36",
    border: "#0d2d50",
    text: "#e0f2fe",
    muted: "#38bdf8",
    accent: "#0ea5e9",
  },
  Neon: {
    bg: "#050508",
    surface: "#0a0a14",
    panel: "#0f0f1e",
    border: "#1a1a35",
    text: "#f0fdf4",
    muted: "#4ade80",
    accent: "#22c55e",
  },
};

// ─── Divider ──────────────────────────────────────────────────────────────────
function Sep({ CT }) {
  return (
    <div
      style={{
        width: 1,
        height: 24,
        background: CT.border,
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
  );
}

// ─── TBtn ────────────────────────────────────────────────────────────────────
export function TBtn({
  icon,
  label,
  active,
  danger,
  onClick,
  shortcut,
  T,
  badge,
}) {
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
        flexShrink: 0,
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

// ─── ThemeSwitcher popup ──────────────────────────────────────────────────────
function ThemeSwitcher({ T, theme, onTheme, onClose }) {
  const ref = useRef();

  useEffect(() => {
    const handle = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
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

// ─── Toolbar ─────────────────────────────────────────────────────────────────
/**
 * Props from MapCanvas:
 *
 * CT               – current theme object
 * mode             – "select" | "pan" | "link"
 * setMode
 * setLinking       – reset link-mode source node
 * showHistory      – bool (HistoryPanel visible)
 * setShowHistory
 * showSearch       – bool (Search bar visible)
 * setShowSearch
 * setPanelOpen     – toggle right panel
 * selectedTheme    – active theme name
 * setSelectedTheme
 * zoomLevel        – number (percentage)
 * historyLength    – number of undo steps (for badge dot)
 * multiSel         – Set<id> (passed straight to deleteNodes)
 *
 * Callbacks:
 * addChild()
 * deleteNodes(Set)
 * duplicateNode()
 * undo()
 * redo()
 * autoArrange(type)
 * fitAll()
 * doZoom(factor)
 * exportPNG()
 * saveNow()
 */
export default function Toolbar({
  CT,
  mode,
  setMode,
  setLinking,
  showHistory,
  setShowHistory,
  showSearch,
  setShowSearch,
  setPanelOpen,
  panelOpen, // ← needed to offset center when panel is open
  selectedTheme,
  setSelectedTheme,
  zoomLevel,
  historyLength,
  multiSel,
  addChild,
  deleteNodes,
  duplicateNode,
  undo,
  redo,
  autoArrange,
  fitAll,
  doZoom,
  exportPNG,
  saveNow,
}) {
  const PANEL_W = 268;
  const [showThemes, setShowThemes] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: CT.panel,
        border: `1px solid ${CT.border}`,
        borderRadius: 10,
        padding: "3px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        // prevent bleeding into the panel — respects panelOpen offset set by wrapper
        maxWidth: panelOpen
          ? `calc(100% - ${PANEL_W}px - 24px)`
          : "calc(100% - 24px)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {/* ── Mode: Select / Pan / Link ── */}
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
          ["cursor", "Cursor", "select", "1"],
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

      {/* ── Node actions ── */}
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

      <Sep CT={CT} />

      {/* ── History ── */}
      <TBtn icon="undo" onClick={undo} shortcut="⌘Z" T={CT} />
      <TBtn icon="redo" onClick={redo} shortcut="⌘Y" T={CT} />
      <TBtn
        icon="history"
        onClick={() => setShowHistory((v) => !v)}
        active={showHistory}
        badge={historyLength > 0}
        T={CT}
      />

      <Sep CT={CT} />

      {/* ── View ── */}
      <TBtn
        icon="magic"
        label="Layout"
        onClick={() => autoArrange("radial")}
        T={CT}
      />
      <TBtn icon="fit" onClick={fitAll} shortcut="0" T={CT} />
      <TBtn icon="zoomin" onClick={() => doZoom(0.85)} shortcut="+" T={CT} />
      <TBtn icon="zoomout" onClick={() => doZoom(1.15)} shortcut="-" T={CT} />

      {/* Zoom % readout */}
      <div
        style={{
          padding: "0 10px",
          fontSize: 12,
          fontWeight: 600,
          color: CT.muted,
          borderLeft: `1px solid ${CT.border}`,
          marginLeft: 2,
          userSelect: "none",
        }}
      >
        {zoomLevel}%
      </div>

      <Sep CT={CT} />

      {/* ── Theme switcher ── */}
      <div style={{ position: "relative" }}>
        <TBtn
          icon="theme"
          onClick={() => setShowThemes((v) => !v)}
          active={showThemes}
          T={CT}
        />
        {showThemes && (
          <ThemeSwitcher
            T={CT}
            theme={selectedTheme}
            onTheme={setSelectedTheme}
            onClose={() => setShowThemes(false)}
          />
        )}
      </div>

      {/* ── Misc ── */}
      <TBtn icon="export" onClick={exportPNG} T={CT} />
      <TBtn icon="save" label="Save" onClick={saveNow} shortcut="⌘S" T={CT} />
      <TBtn
        icon="search"
        onClick={() => setShowSearch((v) => !v)}
        shortcut="⌘F"
        T={CT}
      />
      <TBtn icon="chevronR" onClick={() => setPanelOpen((v) => !v)} T={CT} />
    </div>
  );
}
