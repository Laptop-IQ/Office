/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */
import { useState } from "react";
import Icon from "./Icon";
import { EdgeAnimationPicker } from "./EdgeAnimations";

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, T }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        cursor: "pointer",
        background: value ? T.accent : "#333",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
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
          left: value ? 21 : 3,
        }}
      />
    </button>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
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

// ─── ConnectionsList ──────────────────────────────────────────────────────────
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

// ─── GroupsPanel ──────────────────────────────────────────────────────────────
function GroupsPanel({
  nodes,
  groups,
  multiSel,
  T,
  onGroup,
  onUngroup,
  onSelectGroup,
  onDeleteGroup,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const canGroup = multiSel.size > 1;

  return (
    <div>
      {/* Create group from selection */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>
          {canGroup
            ? `${multiSel.size} nodes selected`
            : "Select multiple nodes first"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && canGroup) {
                onGroup([...multiSel], newGroupName || "Group");
                setNewGroupName("");
              }
            }}
            style={{ ...inputStyle(T), flex: 1, fontSize: 12 }}
          />
          <button
            onClick={() => {
              if (canGroup) {
                onGroup([...multiSel], newGroupName || "Group");
                setNewGroupName("");
              }
            }}
            disabled={!canGroup}
            style={{
              padding: "0 10px",
              borderRadius: 6,
              border: "none",
              background: canGroup ? T.accent : T.border,
              color: "white",
              cursor: canGroup ? "pointer" : "default",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Group
          </button>
        </div>
      </div>

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
                  border: "1px solid rgba(239,68,68,0.3)",
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

// ─── RightPanel ───────────────────────────────────────────────────────────────
/**
 * Props coming from MapCanvas:
 *
 * CT              – current theme object
 * selected        – id of the selected node
 * selectedNode    – the full selected node object (or null)
 * nodes, edges, groups, multiSel
 * edgeStyle / setEdgeStyle
 * edgeAnimStyle / setEdgeAnimStyle
 * showGrid / setShowGrid
 * showLabels / setShowLabels
 * snapToGrid / setSnapToGrid
 * palette / setPalette
 * selectedTheme / setSelectedTheme
 * mapId           – backend map id (string | null)
 * historyLength   – number of undo steps available
 *
 * Callbacks:
 * upNode(key, val)       – update a field on all selected nodes
 * deleteNodes(Set)       – delete nodes by id set
 * duplicateNode()
 * addChild(parentId?)
 * removeEdge(edgeId)
 * focusNode(nodeId)
 * saveNow()
 * exportJSON / exportMarkdown / exportSVG / exportPNG
 * importJSON(event)
 * createGroup(ids[], name)
 * ungroupGroup(groupId)
 * selectGroup(groupId)
 * deleteGroup(groupId)
 * autoArrange(type)      – "radial" | "horizontal" | "vertical" | "grid" | "fishbone"
 * snapshot()             – push current state to undo history
 * toast(msg, type?)
 */
export default function RightPanel({
  CT,
  selected,
  selectedNode,
  nodes,
  edges,
  groups,
  multiSel,
  edgeStyle,
  setEdgeStyle,
  edgeAnimStyle,
  setEdgeAnimStyle,
  showGrid,
  setShowGrid,
  showLabels,
  setShowLabels,
  snapToGrid,
  setSnapToGrid,
  palette,
  setPalette,
  selectedTheme,
  setSelectedTheme,
  mapId,
  historyLength,
  upNode,
  deleteNodes,
  duplicateNode,
  addChild,
  removeEdge,
  focusNode,
  saveNow,
  exportJSON,
  exportMarkdown,
  exportSVG,
  exportPNG,
  importJSON,
  createGroup,
  ungroupGroup,
  selectGroup,
  deleteGroup,
  autoArrange,
  snapshot,
  toast,
}) {
  // ── Local state (only needed inside this panel) ──────────────────────────
  const [panelTab, setPanelTab] = useState("node");
  const [imageInput, setImageInput] = useState("");

  // ── Shared button style for action rows ──────────────────────────────────
  const actionBtn = (extra = {}) => ({
    padding: "8px",
    borderRadius: 6,
    border: `1px solid ${CT.border}`,
    background: CT.surface,
    color: CT.text,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    ...extra,
  });

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: CT.panel,
        borderLeft: `1px solid ${CT.border}`,
        overflow: "hidden",
      }}
    >
      {/* ── Tab bar ── */}
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

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* ════════════════════════════════════════════════════════
            NODE TAB
        ════════════════════════════════════════════════════════ */}
        {panelTab === "node" && selectedNode && (
          <>
            {/* Label & Content */}
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
                  style={inputStyle(CT)}
                />
              </div>
            </Section>

            {/* Color */}
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
                <label style={{ fontSize: 11, color: CT.muted, flexShrink: 0 }}>
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

            {/* Typography */}
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
                style={inputStyle(CT)}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f.replace(/'/g, "")}
                  </option>
                ))}
              </select>
            </Section>

            {/* Shape */}
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
                        color: selectedNode.shape === s ? CT.text : CT.muted,
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

            {/* Image */}
            <Section title="Image" T={CT} defaultOpen={false}>
              {/* ── Preview ── */}
              {selectedNode.image && (
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <img
                    src={selectedNode.image}
                    alt="node"
                    style={{
                      width: "100%",
                      maxHeight: 130,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: `1px solid ${CT.border}`,
                      display: "block",
                    }}
                  />
                  {/* quick-remove overlay */}
                  <button
                    onClick={() => upNode("image", "")}
                    title="Remove image"
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* ── Upload from device ── */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  width: "100%",
                  padding: "9px",
                  borderRadius: 7,
                  border: `1.5px dashed ${CT.border}`,
                  background: CT.surface,
                  color: CT.text,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = CT.accent)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = CT.border)
                }
              >
                <span style={{ fontSize: 15 }}>🖼</span>
                Upload from device
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast("Image too large (max 5 MB)", "error");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      upNode("image", ev.target.result);
                      toast("Image set", "success");
                    };
                    reader.readAsDataURL(file);
                    // reset so the same file can be picked again
                    e.target.value = "";
                  }}
                />
              </label>

              {/* ── Divider ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div style={{ flex: 1, height: 1, background: CT.border }} />
                <span
                  style={{
                    fontSize: 10,
                    color: CT.muted,
                    whiteSpace: "nowrap",
                  }}
                >
                  or paste URL
                </span>
                <div style={{ flex: 1, height: 1, background: CT.border }} />
              </div>

              {/* ── URL input ── */}
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && imageInput.trim()) {
                      upNode("image", imageInput.trim());
                      setImageInput("");
                      toast("Image set", "success");
                    }
                  }}
                  placeholder="https://example.com/img.png"
                  style={{ ...inputStyle(CT), flex: 1, fontSize: 11 }}
                />
                <button
                  onClick={() => {
                    if (!imageInput.trim()) return;
                    upNode("image", imageInput.trim());
                    setImageInput("");
                    toast("Image set", "success");
                  }}
                  style={{
                    padding: "0 10px",
                    borderRadius: 6,
                    border: `1px solid ${CT.border}`,
                    background: CT.surface,
                    color: CT.text,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  Set
                </button>
              </div>

              {/* ── Remove (bottom) ── */}
              {selectedNode.image && (
                <button
                  onClick={() => upNode("image", "")}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    padding: "6px",
                    borderRadius: 6,
                    border: "1px solid rgba(239,68,68,0.35)",
                    background: "rgba(239,68,68,0.06)",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  🗑 Remove image
                </button>
              )}
            </Section>

            {/* Options */}
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
                    <div style={{ fontSize: 10, color: CT.muted }}>{desc}</div>
                  </div>
                  <Toggle
                    value={!!selectedNode[k]}
                    onChange={(v) => upNode(k, v)}
                    T={CT}
                  />
                </div>
              ))}

              <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
                <button
                  onClick={() => {
                    snapshot();
                    addChild();
                  }}
                  style={{ ...actionBtn(), flex: 1 }}
                >
                  + Child
                </button>
                <button
                  onClick={duplicateNode}
                  style={{ ...actionBtn(), flex: 1 }}
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

        {/* ════════════════════════════════════════════════════════
            CONNECTIONS TAB
        ════════════════════════════════════════════════════════ */}
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
                  style={{ fontSize: 10, color: CT.muted, marginBottom: 12 }}
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

            {/* All edges list */}
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
                  const from = nodes.find((n) => n.id === e.from);
                  const to = nodes.find((n) => n.id === e.to);
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

        {/* ════════════════════════════════════════════════════════
            GROUPS TAB
        ════════════════════════════════════════════════════════ */}
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
            />
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            STYLE TAB
        ════════════════════════════════════════════════════════ */}
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
            </Section>

            <Section title="Edge Animation" T={CT}>
              <EdgeAnimationPicker
                value={edgeAnimStyle}
                onChange={setEdgeAnimStyle}
                T={CT}
              />
            </Section>

            <Section title="Auto-Layout" T={CT}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  ["🌐 Radial", "radial", "Circular, balanced"],
                  ["↔ Tree LR", "horizontal", "Left → Right tree"],
                  ["↕ Tree TB", "vertical", "Top → Bottom tree"],
                  ["⬛ Grid", "grid", "Even grid spacing"],
                  ["🐟 Fishbone", "fishbone", "Ishikawa / cause-effect"],
                ].map(([l, t, desc]) => (
                  <button
                    key={t}
                    onClick={() => autoArrange(t)}
                    title={desc}
                    style={{
                      ...actionBtn(),
                      flex: "1 0 calc(50% - 3px)",
                      fontSize: 11,
                      textAlign: "center",
                      padding: "7px 6px",
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
                    background: palette === p ? CT.accent + "15" : CT.surface,
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
                  <Toggle value={val} onChange={set} T={CT} />
                </div>
              ))}
            </Section>
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            MAP TAB
        ════════════════════════════════════════════════════════ */}
        {panelTab === "map" && (
          <>
            <Section title="Theme" T={CT}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
                      minWidth: 56,
                      border: `1px solid ${selectedTheme === t ? CT.accent : CT.border}`,
                      background:
                        selectedTheme === t ? CT.accent + "18" : CT.surface,
                      cursor: "pointer",
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
                    ...actionBtn(),
                    width: "100%",
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
                    ...actionBtn(),
                    width: "100%",
                    marginBottom: 6,
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
                  ...actionBtn(),
                  display: "block",
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
                ["History", historyLength],
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
                    style={{ fontSize: 12, fontWeight: 600, color: CT.text }}
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
                ["1/2/3", "Select / Pan / Link"],
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
  );
}
