import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── Utilities ─────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

const PALETTES = {
  Violet:  ["#7c3aed","#8b5cf6","#a78bfa","#c4b5fd"],
  Coral:   ["#e11d48","#f43f5e","#fb7185","#fda4af"],
  Teal:    ["#0d9488","#14b8a6","#2dd4bf","#5eead4"],
  Amber:   ["#d97706","#f59e0b","#fbbf24","#fcd34d"],
  Indigo:  ["#1d4ed8","#3b82f6","#60a5fa","#93c5fd"],
  Lime:    ["#4d7c0f","#65a30d","#84cc16","#a3e635"],
  Rose:    ["#9f1239","#be123c","#e11d48","#fb7185"],
  Cyan:    ["#0e7490","#0891b2","#06b6d4","#22d3ee"],
};

const NODE_COLORS = [
  "#7c3aed","#1d4ed8","#0d9488","#d97706",
  "#e11d48","#4d7c0f","#9f1239","#0e7490",
  "#c026d3","#ea580c","#0369a1","#166534",
];

const EDGE_STYLES = ["curve","straight","elbow","arc"];
const FONT_FAMILIES = ["Inter","Georgia","'Courier New'","'Trebuchet MS'","Verdana"];

const THEMES = {
  "Obsidian": {
    bg: "#0a0a0f", surface: "#111118", panel: "#13131c", border: "#1e1e30",
    text: "#e2e8f0", muted: "#64748b", accent: "#7c3aed", grid: "#1a1a28",
  },
  "Midnight": {
    bg: "#000814", surface: "#001233", panel: "#001845", border: "#0a2463",
    text: "#caf0f8", muted: "#4895ef", accent: "#4361ee", grid: "#001028",
  },
  "Graphite": {
    bg: "#111111", surface: "#1a1a1a", panel: "#222222", border: "#333333",
    text: "#f5f5f5", muted: "#888888", accent: "#ff4757", grid: "#181818",
  },
  "Forest":  {
    bg: "#0a1628", surface: "#0f2033", panel: "#122440", border: "#1a3a5c",
    text: "#e2f0fb", muted: "#5b9fd6", accent: "#00b4d8", grid: "#0d1e30",
  },
  "Abyss": {
    bg: "#060612", surface: "#0d0d2b", panel: "#10103a", border: "#1c1c50",
    text: "#e0e7ff", muted: "#6366f1", accent: "#818cf8", grid: "#0e0e22",
  },
};

// ─── SVG Icons (crisp, no emoji) ───────────────────────────────────────────
const Icon = ({ name, size = 14 }) => {
  const icons = {
    cursor: <><path d="M4 2l12 7-5 1.5-3 4.5V2z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></>,
    hand:   <><path d="M8 12V6m-2 2V5m4 7V5m2 7V7m2 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 14s0 4 6 4 6-4 6-4V9" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
    link:   <><path d="M10 13H7a4 4 0 010-8h3M14 11h3a4 4 0 000-8h-3M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
    plus:   <><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    trash:  <><path d="M6 7h12M9 7V5h6v2M10 11v5M14 11v5M7 7l1 11h8l1-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    undo:   <><path d="M4 8h9a5 5 0 010 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M4 8l3-3-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    redo:   <><path d="M20 8h-9a5 5 0 000 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M20 8l-3-3 3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    search: <><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    grid:   <><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
    magic:  <><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></>,
    down:   <><path d="M12 4v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    up:     <><path d="M12 20V6M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    eye:    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
    copy:   <><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
    note:   <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
    tag:    <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    collapse:<><path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 8v8M9 12l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
    image:  <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
    chevronR:<><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    chevronL:<><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    zoomin: <><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M20 20l-4-4M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    zoomout:<><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M20 20l-4-4M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    fit:    <><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    pin:    <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display:"block",flexShrink:0}}>
      {icons[name] || null}
    </svg>
  );
};

// ─── Toast ─────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type="info") => {
    const id = uid();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500);
  };
  return { toasts, add };
}

function ToastStack({ toasts, T }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:9999, display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="success" ? "#166534" : t.type==="error" ? "#7f1d1d" : T.panel,
          border: `1px solid ${t.type==="success"?"#22c55e":t.type==="error"?"#ef4444":T.border}`,
          color: T.text, padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:500,
          animation:"fadeUp 0.2s ease", whiteSpace:"nowrap",
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Minimap ───────────────────────────────────────────────────────────────
function Minimap({ nodes, viewBox, T }) {
  const allX = nodes.map(n=>n.x), allY = nodes.map(n=>n.y);
  const minX = Math.min(...allX)-100, minY = Math.min(...allY)-100;
  const maxX = Math.max(...allX)+100, maxY = Math.max(...allY)+100;
  const W=160, H=100;
  const scaleX = W/(maxX-minX||1), scaleY = H/(maxY-minY||1);
  const scale = Math.min(scaleX,scaleY)*0.9;
  const ox = (W - (maxX-minX)*scale)/2 - minX*scale;
  const oy = (H - (maxY-minY)*scale)/2 - minY*scale;
  return (
    <div style={{ position:"absolute", bottom:20, left:20, borderRadius:8, overflow:"hidden",
      border:`1px solid ${T.border}`, background:T.surface }}>
      <svg width={W} height={H}>
        {nodes.map(n => (
          <circle key={n.id} cx={n.x*scale+ox} cy={n.y*scale+oy} r={4} fill={n.color} opacity={0.85}/>
        ))}
        <rect
          x={(viewBox.x)*scale+ox} y={(viewBox.y)*scale+oy}
          width={viewBox.w*scale} height={viewBox.h*scale}
          fill="none" stroke={T.accent} strokeWidth={1} opacity={0.6}
        />
      </svg>
    </div>
  );
}

// ─── Context Menu ──────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, T, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  });
  return (
    <div ref={ref} style={{
      position:"fixed", left:x, top:y, zIndex:9000, minWidth:180,
      background:T.panel, border:`1px solid ${T.border}`, borderRadius:8,
      padding:"4px 0", boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
    }}>
      {items.map((item,i) => item === "---" ? (
        <div key={i} style={{ height:1, background:T.border, margin:"4px 0" }}/>
      ) : (
        <button key={i} onClick={() => { item.action(); onClose(); }}
          style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 14px",
            background:"transparent", border:"none", color: item.danger?"#ef4444":T.text,
            fontSize:13, cursor:"pointer", textAlign:"left" }}
          onMouseEnter={e=>e.currentTarget.style.background=T.surface}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
        >
          {item.icon && <Icon name={item.icon} size={13}/>}
          <span>{item.label}</span>
          {item.shortcut && <span style={{ marginLeft:"auto", opacity:0.4, fontSize:11 }}>{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Toolbar Button ────────────────────────────────────────────────────────
function TBtn({ icon, label, active, danger, onClick, shortcut, T }) {
  return (
    <button
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        padding: label ? "0 12px" : "0 10px", height:34, borderRadius:6, cursor:"pointer", border:"none",
        background: active ? T.accent : danger ? "rgba(239,68,68,0.12)" : "transparent",
        color: active ? "#fff" : danger ? "#ef4444" : T.text,
        fontSize:12, fontWeight:500, transition:"background 0.15s",
        outline: active ? "none" : `1px solid transparent`,
      }}
      onMouseEnter={e => { if(!active&&!danger) e.currentTarget.style.background=T.surface; }}
      onMouseLeave={e => { if(!active&&!danger) e.currentTarget.style.background="transparent"; }}
    >
      <Icon name={icon} size={14}/>
      {label && <span>{label}</span>}
    </button>
  );
}

// ─── Panel Section ─────────────────────────────────────────────────────────
function Section({ title, children, T, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom:`1px solid ${T.border}` }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          width:"100%", padding:"10px 16px", background:"transparent", border:"none",
          color:T.muted, fontSize:10, fontWeight:700, letterSpacing:"0.08em",
          textTransform:"uppercase", cursor:"pointer" }}>
        {title}
        <span style={{ transform:open?"rotate(0deg)":"rotate(-90deg)", transition:"transform 0.15s", opacity:0.5 }}>▾</span>
      </button>
      {open && <div style={{ padding:"0 16px 14px" }}>{children}</div>}
    </div>
  );
}

// ─── Label + Input ─────────────────────────────────────────────────────────
const inputStyle = (T) => ({
  width:"100%", padding:"7px 10px", borderRadius:6, border:`1px solid ${T.border}`,
  background:T.surface, color:T.text, fontSize:13, outline:"none", boxSizing:"border-box",
});

// ─── Main ─────────────────────────────────────────────────────────────────
export default function MindMapPro() {
  const CANVAS = 4000;
  const SVG_W = 900, SVG_H = 600;

  // State
  const [nodes, setNodes] = useState([{
    id:"root", x:CANVAS/2, y:CANVAS/2, text:"My Mind Map",
    color:"#7c3aed", shape:"rounded", fontSize:18, bold:true,
    italic:false, note:"", tag:"", emoji:"🧠", collapsed:false, locked:false,
    image:"", fontFamily:"Inter",
  }]);
  const [edges, setEdges] = useState([]);
  const [selected, setSelected] = useState("root");
  const [multiSel, setMultiSel] = useState(new Set(["root"]));
  const [dragging, setDragging] = useState(null);
  const [linking, setLinking] = useState(null);
  const [viewBox, setViewBox] = useState({ x:CANVAS/2-450, y:CANVAS/2-300, w:900, h:600 });
  const [panStart, setPanStart] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [theme, setTheme] = useState("Obsidian");
  const [panelTab, setPanelTab] = useState("node"); // node | style | map
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
  const [presentMode, setPresentMode] = useState(false);
  const [edgeLabelEdit, setEdgeLabelEdit] = useState(null);
  const [imageInput, setImageInput] = useState("");
  const svgRef = useRef();
  const editRef = useRef();
  const { toasts, add: toast } = useToast();

  const T = THEMES[theme];
  const selectedNode = nodes.find(n => n.id === selected);
  const searchHits = searchQ ? new Set(nodes.filter(n=>n.text.toLowerCase().includes(searchQ.toLowerCase())).map(n=>n.id)) : new Set();

  // ── Snap helper ──
  const snap = (v) => snapToGrid ? Math.round(v/20)*20 : v;

  // ── History ──
  const snapshot = useCallback(() => {
    setHistory(h => [...h.slice(-40), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
    setRedoStack([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length-1];
    setRedoStack(r => [{ nodes, edges }, ...r.slice(0,39)]);
    setNodes(prev.nodes); setEdges(prev.edges);
    setHistory(h => h.slice(0,-1));
    toast("Undone");
  }, [history, nodes, edges]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[0];
    setHistory(h => [...h, { nodes, edges }]);
    setNodes(next.nodes); setEdges(next.edges);
    setRedoStack(r => r.slice(1));
    toast("Redone");
  }, [redoStack, nodes, edges]);

  // ── SVG coords ──
  const svgPt = (e) => {
    const svg = svgRef.current;
    const r = svg.getBoundingClientRect();
    return {
      x: viewBox.x + ((e.clientX-r.left)/r.width)*viewBox.w,
      y: viewBox.y + ((e.clientY-r.top)/r.height)*viewBox.h,
    };
  };

  // ── Zoom ──
  const doZoom = useCallback((factor, centerPt) => {
    setViewBox(v => {
      const pt = centerPt || { x: v.x+v.w/2, y: v.y+v.h/2 };
      const nw = Math.min(Math.max(v.w*factor, 300), 6000);
      const nh = Math.min(Math.max(v.h*factor, 200), 4000);
      const newZoom = Math.round((SVG_W/nw)*100);
      setZoomLevel(newZoom);
      return { x: pt.x-(pt.x-v.x)*(nw/v.w), y: pt.y-(pt.y-v.y)*(nh/v.h), w:nw, h:nh };
    });
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    const onWheel = (e) => { e.preventDefault(); doZoom(e.deltaY>0?1.08:0.92, svgPt(e)); };
    el.addEventListener("wheel", onWheel, { passive:false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const fitAll = () => {
    if (!nodes.length) return;
    const xs = nodes.map(n=>n.x), ys = nodes.map(n=>n.y);
    const pad = 120;
    const w = Math.max(...xs)-Math.min(...xs)+pad*2;
    const h = Math.max(...ys)-Math.min(...ys)+pad*2;
    setViewBox({ x:Math.min(...xs)-pad, y:Math.min(...ys)-pad, w:Math.max(w,400), h:Math.max(h,300) });
    setZoomLevel(Math.round((SVG_W/Math.max(w,400))*100));
    toast("Fit to screen");
  };

  const focusNode = (id) => {
    const n = nodes.find(x=>x.id===id);
    if (!n) return;
    setViewBox(v => ({ ...v, x:n.x-v.w/2, y:n.y-v.h/2 }));
  };

  // ── Add child ──
  const addChild = useCallback((parentId, label="New Idea") => {
    const pid = parentId || selected;
    if (!pid) return;
    const parent = nodes.find(n=>n.id===pid);
    if (!parent) return;
    snapshot();
    const childCount = edges.filter(e=>e.from===pid).length;
    const angle = (childCount*50 - 80) * Math.PI/180;
    const dist = 200;
    const id = uid();
    const colorSet = PALETTES[palette];
    const color = colorSet[childCount % colorSet.length];
    const newNode = {
      id, text:label,
      x: snap(parent.x + Math.cos(angle)*dist),
      y: snap(parent.y + Math.sin(angle)*dist),
      color, shape:"rounded", fontSize:14, bold:false, italic:false,
      note:"", tag:"", emoji:"", collapsed:false, locked:false, image:"", fontFamily:"Inter",
    };
    setNodes(ns => [...ns, newNode]);
    setEdges(es => [...es, { id:uid(), from:pid, to:id, label:"", style:edgeStyle }]);
    setSelected(id);
    setMultiSel(new Set([id]));
    setTimeout(() => { setEditId(id); setEditText(label); }, 80);
    toast("Node added");
    return id;
  }, [selected, nodes, edges, snapshot, palette, edgeStyle, snap]);

  // ── Duplicate ──
  const duplicateNode = () => {
    if (!selectedNode) return;
    snapshot();
    const newNode = { ...selectedNode, id:uid(), x:selectedNode.x+60, y:selectedNode.y+60 };
    setNodes(ns => [...ns, newNode]);
    setSelected(newNode.id);
    toast("Duplicated");
  };

  // ── Delete ──
  const deleteNodes = useCallback((ids) => {
    const set = ids instanceof Set ? ids : new Set(ids);
    if (set.has("root") && set.size === 1) { toast("Can't delete root node","error"); return; }
    snapshot();
    setNodes(ns => ns.filter(n => !set.has(n.id) || n.id==="root" ? !set.has(n.id) : false ));
    setEdges(es => es.filter(e => !set.has(e.from) && !set.has(e.to)));
    setSelected("root");
    setMultiSel(new Set(["root"]));
    toast(`Deleted ${set.size} node(s)`);
  }, [snapshot]);

  // ── Update node ──
  const upNode = (key, val) => {
    setNodes(ns => ns.map(n => multiSel.has(n.id) ? { ...n, [key]:val } : n));
  };

  // ── Auto-arrange radial ──
  const autoArrange = (type="radial") => {
    snapshot();
    const root = nodes.find(n=>n.id==="root");
    if (!root) return;
    const positions = {};
    const arranged = new Set();
    const dfs = (id, angle, spread, dist) => {
      if (arranged.has(id)) return;
      arranged.add(id);
      const parent = positions[id] || { x:root.x, y:root.y };
      const children = edges.filter(e=>e.from===id).map(e=>e.to).filter(c=>!arranged.has(c));
      children.forEach((cid, i) => {
        const a = type==="horizontal"
          ? (i - (children.length-1)/2) * 60
          : angle - spread/2 + (spread/(children.length||1))*(i+0.5);
        const nx = type==="horizontal"
          ? parent.x + dist
          : parent.x + Math.cos(a*Math.PI/180)*dist;
        const ny = type==="horizontal"
          ? parent.y + (i - (children.length-1)/2)*120
          : parent.y + Math.sin(a*Math.PI/180)*dist;
        positions[cid] = { x:snap(nx), y:snap(ny) };
        dfs(cid, a, spread*0.65, dist*0.82);
      });
    };
    positions["root"] = { x:root.x, y:root.y };
    dfs("root", 0, 360, 210);
    setNodes(ns => ns.map(n => positions[n.id] ? { ...n, ...positions[n.id] } : n));
    toast("Layout applied");
  };

  // ── Edge path ──
  const getEdgePath = (from, to, style) => {
    if (!from||!to) return "";
    const dx=to.x-from.x, dy=to.y-from.y;
    switch(style) {
      case "straight": return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
      case "elbow": {
        const mx = (from.x+to.x)/2;
        return `M ${from.x} ${from.y} L ${mx} ${from.y} L ${mx} ${to.y} L ${to.x} ${to.y}`;
      }
      case "arc": {
        const r = Math.sqrt(dx*dx+dy*dy)*0.6;
        return `M ${from.x} ${from.y} A ${r} ${r} 0 0 1 ${to.x} ${to.y}`;
      }
      default: { // curve
        const cx = from.x+dx*0.5;
        return `M ${from.x} ${from.y} C ${cx} ${from.y} ${cx} ${to.y} ${to.x} ${to.y}`;
      }
    }
  };

  // ── Node bounds ──
  const nodeBounds = (node) => {
    const base = node.fontSize||14;
    const textLen = Math.min(node.text.length*base*0.58+40, 220);
    const W = node.shape==="circle" ? 90 : node.image ? 130 : Math.max(90, textLen);
    const H = node.shape==="circle" ? 90 : node.image ? 80 : base*2.2+18;
    return { W, H };
  };

  // ── Mouse events ──
  const onNodeMouseDown = (e, id) => {
    e.stopPropagation();
    if (e.button === 2) return;
    const node = nodes.find(n=>n.id===id);
    if (node?.locked) { toast("Node is locked"); return; }

    if (mode==="link") {
      if (linking===null) { setLinking(id); return; }
      if (linking !== id) {
        const exists = edges.find(ed=>(ed.from===linking&&ed.to===id)||(ed.from===id&&ed.to===linking));
        if (!exists) {
          snapshot();
          setEdges(es => [...es, { id:uid(), from:linking, to:id, label:"", style:edgeStyle }]);
          toast("Connected");
        }
      }
      setLinking(null);
      return;
    }

    if (e.shiftKey) {
      setMultiSel(ms => { const n=new Set(ms); n.has(id)?n.delete(id):n.add(id); return n; });
    } else {
      if (!multiSel.has(id)) { setSelected(id); setMultiSel(new Set([id])); }
      else setSelected(id);
    }

    const node2 = nodes.find(n=>n.id===id);
    setDragging({
      id, startX:e.clientX, startY:e.clientY,
      origPositions: [...multiSel, id].reduce((acc,nid)=>{
        const n=nodes.find(x=>x.id===nid);
        if(n) acc[nid]={x:n.x,y:n.y};
        return acc;
      },{}),
    });
  };

  const onMouseMove = useCallback((e) => {
    if (dragging && !dragging.moved) {
      const d = Math.hypot(e.clientX-dragging.startX, e.clientY-dragging.startY);
      if (d < 3) return;
      setDragging(d => ({ ...d, moved:true }));
    }
    if (dragging?.moved) {
      const r = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.w/r.width, scaleY = viewBox.h/r.height;
      const dx=(e.clientX-dragging.startX)*scaleX, dy=(e.clientY-dragging.startY)*scaleY;
      setNodes(ns => ns.map(n => {
        const orig = dragging.origPositions[n.id];
        if (!orig) return n;
        return { ...n, x:snap(orig.x+dx), y:snap(orig.y+dy) };
      }));
    }
    if (panStart) {
      const r = svgRef.current.getBoundingClientRect();
      const dx=(e.clientX-panStart.cx)*(viewBox.w/r.width);
      const dy=(e.clientY-panStart.cy)*(viewBox.h/r.height);
      setViewBox(v => ({ ...v, x:panStart.vx-dx, y:panStart.vy-dy }));
    }
    if (lassoStart) {
      const pt = svgPt(e);
      setLasso({ x:Math.min(lassoStart.x,pt.x), y:Math.min(lassoStart.y,pt.y),
        w:Math.abs(pt.x-lassoStart.x), h:Math.abs(pt.y-lassoStart.y) });
    }
  }, [dragging, panStart, lassoStart, viewBox, snap]);

  const onMouseUp = useCallback((e) => {
    if (dragging?.moved) snapshot();
    setDragging(null);
    setPanStart(null);
    if (lasso) {
      const { x,y,w,h } = lasso;
      const hit = nodes.filter(n=>n.x>=x&&n.x<=x+w&&n.y>=y&&n.y<=y+h).map(n=>n.id);
      if (hit.length) { setMultiSel(new Set(hit)); setSelected(hit[0]); }
      setLasso(null); setLassoStart(null);
    }
  }, [dragging, lasso, nodes, snapshot]);

  const onSvgMouseDown = (e) => {
    if (e.button===1) {
      e.preventDefault();
      setPanStart({ cx:e.clientX, cy:e.clientY, vx:viewBox.x, vy:viewBox.y });
      return;
    }
    if (mode==="pan" || e.button===0 && e.altKey) {
      setPanStart({ cx:e.clientX, cy:e.clientY, vx:viewBox.x, vy:viewBox.y });
      return;
    }
    if (mode==="select") {
      const pt = svgPt(e);
      setLassoStart(pt); setLasso(null);
      if (!e.shiftKey) { setMultiSel(new Set()); setSelected(null); }
    }
  };

  const onDblClick = (e, id) => {
    e.stopPropagation();
    const node = nodes.find(n=>n.id===id);
    if (!node||node.locked) return;
    setEditId(id); setEditText(node.text);
    setTimeout(()=>editRef.current?.focus(),30);
  };

  const commitEdit = () => {
    if (!editId) return;
    snapshot();
    setNodes(ns => ns.map(n => n.id===editId ? { ...n, text:editText||n.text } : n));
    setEditId(null);
  };

  // ── Context menu ──
  const onContextMenu = (e, id) => {
    e.preventDefault();
    setSelected(id); setMultiSel(new Set([id]));
    setContextMenu({ x:e.clientX, y:e.clientY, id });
  };

  const ctxItems = contextMenu ? [
    { label:"Add Child", icon:"plus", action:()=>addChild(contextMenu.id), shortcut:"Tab" },
    { label:"Duplicate", icon:"copy", action:duplicateNode },
    { label:"Focus", icon:"eye", action:()=>focusNode(contextMenu.id) },
    "---",
    { label:"Lock / Unlock", icon:"pin", action:()=>{ upNode("locked",!selectedNode?.locked); toast(selectedNode?.locked?"Unlocked":"Locked"); } },
    { label:"Collapse", icon:"collapse", action:()=>upNode("collapsed",!selectedNode?.collapsed) },
    "---",
    { label:"Delete Node", icon:"trash", danger:true, action:()=>deleteNodes(multiSel), shortcut:"Del" },
  ] : [];

  // ── Keyboard ──
  useEffect(() => {
    const h = (e) => {
      if (editId) { if(e.key==="Escape") setEditId(null); return; }
      if (e.key==="Tab") { e.preventDefault(); addChild(); }
      if ((e.key==="Delete"||e.key==="Backspace") && !e.metaKey) deleteNodes(multiSel);
      if ((e.metaKey||e.ctrlKey)&&e.key==="z") { e.preventDefault(); undo(); }
      if ((e.metaKey||e.ctrlKey)&&e.key==="y") { e.preventDefault(); redo(); }
      if ((e.metaKey||e.ctrlKey)&&e.key==="f") { e.preventDefault(); setShowSearch(s=>!s); }
      if ((e.metaKey||e.ctrlKey)&&e.key==="d") { e.preventDefault(); duplicateNode(); }
      if ((e.metaKey||e.ctrlKey)&&e.key==="a") { e.preventDefault(); setMultiSel(new Set(nodes.map(n=>n.id))); }
      if (e.key==="Escape") { setMode("select"); setLinking(null); setShowSearch(false); setContextMenu(null); }
      if (e.key==="1") setMode("select");
      if (e.key==="2") setMode("pan");
      if (e.key==="3") setMode("link");
      if (e.key==="+" || e.key==="=") doZoom(0.85);
      if (e.key==="-") doZoom(1.15);
      if (e.key==="0") fitAll();
      if (e.key==="p") setPresentMode(m=>!m);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [editId, addChild, deleteNodes, undo, redo, multiSel, nodes, doZoom]);

  // ── Export ──
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({nodes,edges},null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="mindmap.json"; a.click();
    toast("Exported JSON","success");
  };
  const exportMarkdown = () => {
    const build = (id, depth) => {
      const n = nodes.find(x=>x.id===id);
      if (!n) return "";
      const prefix = "  ".repeat(depth) + (depth?"- ":"# ");
      const children = edges.filter(e=>e.from===id).map(e=>e.to);
      return prefix + n.text + "\n" + children.map(c=>build(c,depth+1)).join("");
    };
    const md = build("root",0);
    const blob = new Blob([md],{type:"text/markdown"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="mindmap.md"; a.click();
    toast("Exported Markdown","success");
  };
  const importJSON = (e) => {
    const file=e.target.files[0]; if (!file) return;
    const r=new FileReader();
    r.onload=(ev)=>{
      try {
        const d=JSON.parse(ev.target.result);
        snapshot(); setNodes(d.nodes); setEdges(d.edges);
        toast("Imported","success");
      } catch { toast("Invalid JSON","error"); }
    };
    r.readAsText(file);
  };

  const exportSVG = () => {
    const svg = svgRef.current;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML],{type:"image/svg+xml"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="mindmap.svg"; a.click();
    toast("Exported SVG","success");
  };

  // ── Get visible nodes (collapse) ──
  const visibleNodeIds = useMemo(() => {
    const visible = new Set();
    const visit = (id) => {
      visible.add(id);
      const n = nodes.find(x=>x.id===id);
      if (n?.collapsed) return;
      edges.filter(e=>e.from===id).forEach(e=>visit(e.to));
    };
    visit("root");
    return visible;
  }, [nodes, edges]);

  const visibleEdges = edges.filter(e=>visibleNodeIds.has(e.from)&&visibleNodeIds.has(e.to));
  const visibleNodes = nodes.filter(n=>visibleNodeIds.has(n.id));

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden",
      background:T.bg, color:T.text, fontFamily:"Inter, system-ui, sans-serif", userSelect:"none" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:2px; }
        input,textarea,select { font-family:inherit; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes dash { to{stroke-dashoffset:-20} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        @keyframes nodePop { 0%{transform:scale(0.8)}60%{transform:scale(1.05)}100%{transform:scale(1)} }
      `}</style>

      {/* ── SVG Canvas ── */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <svg
          ref={svgRef}
          style={{ width:"100%", height:"100%",
            cursor: mode==="pan"||panStart?"grabbing" : mode==="link"?"crosshair":"default" }}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseDown={onSvgMouseDown}
        >
          <defs>
            <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="0.7" fill={T.muted} opacity="0.25"/>
            </pattern>
            <pattern id="lines" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={T.muted} strokeWidth="0.4" opacity="0.18"/>
            </pattern>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={T.muted} opacity="0.8"/>
            </marker>
            <marker id="arrowActive" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={T.accent}/>
            </marker>
            {nodes.map(n=>(
              <radialGradient key={n.id+"-g"} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={n.color} stopOpacity="0.35"/>
                <stop offset="100%" stopColor={n.color} stopOpacity="0.08"/>
              </radialGradient>
            ))}
          </defs>

          {/* Grid */}
          {showGrid && (
            <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#dots)"/>
          )}

          {/* Edges */}
          {visibleEdges.map(edge => {
            const from=nodes.find(n=>n.id===edge.from), to=nodes.find(n=>n.id===edge.to);
            if (!from||!to) return null;
            const isActive = multiSel.has(edge.from)||multiSel.has(edge.to);
            const path = getEdgePath(from, to, edge.style||edgeStyle);
            const mx=(from.x+to.x)/2, my=(from.y+to.y)/2;
            return (
              <g key={edge.id}>
                {/* hit area */}
                <path d={path} fill="none" stroke="transparent" strokeWidth={12} style={{cursor:"pointer"}}
                  onClick={()=>{snapshot();setEdges(es=>es.filter(x=>x.id!==edge.id));toast("Edge removed");}}
                />
                <path d={path} fill="none"
                  stroke={isActive ? T.accent : T.muted}
                  strokeWidth={isActive?2:1.4}
                  strokeOpacity={isActive?1:0.45}
                  markerEnd={isActive?"url(#arrowActive)":"url(#arrowhead)"}
                  strokeDasharray={animatedEdges?"8 4":edge.style==="straight"?undefined:"none"}
                  style={animatedEdges?{animation:"dash 0.6s linear infinite"}:undefined}
                />
                {/* edge label */}
                {(edge.label||isActive) && (
                  <g>
                    {edge.label && (
                      <rect x={mx-edge.label.length*3.5-4} y={my-9} width={edge.label.length*7+8} height={16}
                        rx={4} fill={T.panel} stroke={T.border} strokeWidth={0.8}/>
                    )}
                    {edgeLabelEdit===edge.id ? (
                      <foreignObject x={mx-50} y={my-10} width={100} height={20}>
                        <input autoFocus defaultValue={edge.label}
                          onBlur={e2=>{snapshot();setEdges(es=>es.map(ed=>ed.id===edge.id?{...ed,label:e2.target.value}:ed));setEdgeLabelEdit(null);}}
                          onKeyDown={e2=>{if(e2.key==="Enter")e2.target.blur();}}
                          style={{width:"100%",background:T.panel,border:"none",color:T.text,fontSize:11,textAlign:"center",outline:"none"}}
                        />
                      </foreignObject>
                    ):(
                      <text x={mx} y={my+4} textAnchor="middle" fill={T.muted} fontSize={11}
                        style={{cursor:"pointer"}}
                        onDoubleClick={e2=>{e2.stopPropagation();setEdgeLabelEdit(edge.id);}}>
                        {edge.label || (isActive?"···":"")}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map(node => {
            const { W, H } = nodeBounds(node);
            const isSel = multiSel.has(node.id);
            const isSearchHit = searchHits.has(node.id);
            const isLinking = linking===node.id;
            const collapseCount = edges.filter(e=>e.from===node.id).length;
            const hasCollapsed = node.collapsed && collapseCount>0;

            return (
              <g key={node.id}
                transform={`translate(${node.x-W/2},${node.y-H/2})`}
                onMouseDown={e=>onNodeMouseDown(e,node.id)}
                onDoubleClick={e=>onDblClick(e,node.id)}
                onContextMenu={e=>onContextMenu(e,node.id)}
                style={{ cursor: node.locked?"not-allowed":dragging?.id===node.id?"grabbing":"grab" }}
              >
                {/* Glow bg */}
                {isSel && (
                  <ellipse cx={W/2} cy={H/2} rx={W*0.7} ry={H*0.7}
                    fill={`url(#glow-${node.id})`} style={{pointerEvents:"none"}}/>
                )}

                {/* Search highlight */}
                {isSearchHit && (
                  <rect x={-5} y={-5} width={W+10} height={H+10} rx={14}
                    fill="none" stroke="#fbbf24" strokeWidth={2}
                    style={{animation:"pulse 1s ease infinite"}}/>
                )}

                {/* Selection border */}
                {isSel && (
                  <rect x={-3} y={-3} width={W+6} height={H+6}
                    rx={node.shape==="pill"?H/2+3:node.shape==="circle"?W/2+3:14}
                    fill="none" stroke={node.color} strokeWidth={2} strokeDasharray="none" opacity={0.9}/>
                )}

                {/* Node body */}
                {node.shape==="hexagon" ? (
                  <polygon
                    points={`${W*.25},0 ${W*.75},0 ${W},${H/2} ${W*.75},${H} ${W*.25},${H} 0,${H/2}`}
                    fill={node.color+"1a"} stroke={node.color} strokeWidth={isSel?2:1.5}
                  />
                ) : node.shape==="diamond" ? (
                  <rect x={8} y={8} width={W-16} height={H-16} rx={6}
                    fill={node.color+"1a"} stroke={node.color} strokeWidth={isSel?2:1.5}
                    transform={`rotate(45,${W/2},${H/2})`}
                  />
                ) : (
                  <rect width={W} height={H}
                    rx={node.shape==="pill"?H/2:node.shape==="circle"?W/2:10}
                    fill={node.color+"18"}
                    stroke={isSel ? node.color : node.color+"60"}
                    strokeWidth={isSel?2:1.5}
                  />
                )}

                {/* Image */}
                {node.image && (
                  <image href={node.image} x={4} y={4} width={W-8} height={H*0.55}
                    preserveAspectRatio="xMidYMid slice" style={{borderRadius:6}}/>
                )}

                {/* Emoji */}
                {node.emoji && !node.image && (
                  <text x={14} y={H/2+5} fontSize={14} style={{userSelect:"none"}}>
                    {node.emoji}
                  </text>
                )}

                {/* Text */}
                {editId===node.id ? (
                  <foreignObject x={node.emoji?26:6} y={H/2-12} width={W-(node.emoji?32:12)} height={26}>
                    <input ref={editRef} value={editText}
                      onChange={e=>setEditText(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape")commitEdit();}}
                      style={{ width:"100%", background:"transparent", border:"none", outline:"none",
                        color:T.text, fontSize:node.fontSize||14, fontWeight:node.bold?700:400,
                        fontStyle:node.italic?"italic":"normal",
                        fontFamily:node.fontFamily||"Inter", textAlign:"center",
                      }}
                    />
                  </foreignObject>
                ) : (
                  <text x={(node.emoji?W/2+8:W/2)} y={H/2+(node.image?H*0.28:0)+(node.fontSize||14)*0.35}
                    textAnchor="middle" fill={T.text}
                    fontSize={node.fontSize||14}
                    fontWeight={node.bold?700:400}
                    fontStyle={node.italic?"italic":"normal"}
                    fontFamily={node.fontFamily||"Inter"}
                    style={{pointerEvents:"none"}}
                  >
                    {showLabels ? (node.text.length>22?node.text.slice(0,20)+"…":node.text) : ""}
                  </text>
                )}

                {/* Tag */}
                {node.tag && (
                  <text x={W-4} y={14} textAnchor="end" fontSize={9} fill={node.color} opacity={0.9}
                    style={{pointerEvents:"none"}}>
                    #{node.tag}
                  </text>
                )}

                {/* Note dot */}
                {node.note && (
                  <circle cx={W-5} cy={5} r={4} fill="#f59e0b"/>
                )}

                {/* Lock icon */}
                {node.locked && (
                  <text x={6} y={H-5} fontSize={9} fill={T.muted} opacity={0.7}>🔒</text>
                )}

                {/* Collapse badge */}
                {hasCollapsed && (
                  <g style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();upNode("collapsed",false);}}>
                    <circle cx={W/2} cy={H+10} r={10} fill={node.color} opacity={0.9}/>
                    <text x={W/2} y={H+15} textAnchor="middle" fill="white" fontSize={10} fontWeight={700}>
                      {collapseCount}
                    </text>
                  </g>
                )}

                {/* Link-mode ring */}
                {isLinking && (
                  <rect x={-4} y={-4} width={W+8} height={H+8}
                    rx={14} fill="none" stroke="#fbbf24" strokeWidth={3} strokeDasharray="5 3"
                    style={{animation:"dash 0.5s linear infinite"}}/>
                )}
              </g>
            );
          })}

          {/* Lasso */}
          {lasso && (
            <rect x={lasso.x} y={lasso.y} width={lasso.w} height={lasso.h}
              fill={T.accent+"15"} stroke={T.accent} strokeWidth={1.5} strokeDasharray="5 3"/>
          )}

          {/* Linking line preview */}
          {linking && (
            <circle cx={nodes.find(n=>n.id===linking)?.x||0} cy={nodes.find(n=>n.id===linking)?.y||0}
              r={18} fill="none" stroke="#fbbf24" strokeWidth={2}
              style={{animation:"pulse 0.8s ease infinite"}}/>
          )}
        </svg>

        {/* ── Toolbar ── */}
        {!presentMode && (
          <div style={{
            position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
            display:"flex", alignItems:"center", gap:2,
            background:T.panel, border:`1px solid ${T.border}`,
            borderRadius:10, padding:"3px", boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
          }}>
            {/* Mode */}
            <div style={{display:"flex",gap:1,padding:"0 2px",borderRight:`1px solid ${T.border}`,marginRight:4}}>
              {[["cursor","Select","select","1"],["hand","Pan","pan","2"],["link","Link","link","3"]].map(([ico,lab,m,key])=>(
                <TBtn key={m} icon={ico} label={lab} active={mode===m} onClick={()=>{setMode(m);setLinking(null);}} shortcut={key} T={T}/>
              ))}
            </div>

            {/* Actions */}
            <TBtn icon="plus" label="Child" onClick={()=>addChild()} shortcut="Tab" T={T}/>
            <TBtn icon="trash" danger onClick={()=>deleteNodes(multiSel)} shortcut="Del" T={T}/>
            <TBtn icon="copy" onClick={duplicateNode} label="Dup" shortcut="⌘D" T={T}/>
            <div style={{width:1,height:24,background:T.border,margin:"0 4px"}}/>
            <TBtn icon="undo" onClick={undo} shortcut="⌘Z" T={T}/>
            <TBtn icon="redo" onClick={redo} shortcut="⌘Y" T={T}/>
            <div style={{width:1,height:24,background:T.border,margin:"0 4px"}}/>
            <TBtn icon="magic" label="Layout" onClick={()=>autoArrange("radial")} T={T}/>
            <TBtn icon="fit" onClick={fitAll} shortcut="0" T={T}/>
            <TBtn icon="zoomin" onClick={()=>doZoom(0.85)} shortcut="+" T={T}/>
            <TBtn icon="zoomout" onClick={()=>doZoom(1.15)} shortcut="-" T={T}/>
            <div style={{
              padding:"0 10px", fontSize:12, fontWeight:600, color:T.muted,
              borderLeft:`1px solid ${T.border}`, marginLeft:2,
            }}>{zoomLevel}%</div>
            <div style={{width:1,height:24,background:T.border,margin:"0 4px"}}/>
            <TBtn icon="search" onClick={()=>setShowSearch(s=>!s)} shortcut="⌘F" T={T}/>
            <TBtn icon="chevronR" onClick={()=>setPanelOpen(p=>!p)} T={T}/>
          </div>
        )}

        {/* ── Search ── */}
        {showSearch && !presentMode && (
          <div style={{
            position:"absolute", top:70, left:"50%", transform:"translateX(-50%)",
            background:T.panel, border:`1px solid ${T.border}`, borderRadius:8,
            display:"flex", alignItems:"center", gap:8, padding:"8px 14px",
            boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
          }}>
            <Icon name="search" size={14}/>
            <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)}
              placeholder="Search nodes…"
              onKeyDown={e=>{ if(e.key==="Escape"){setShowSearch(false);setSearchQ("");} }}
              style={{ background:"transparent",border:"none",outline:"none",color:T.text,fontSize:13,width:200 }}
            />
            {searchHits.size>0 && (
              <span style={{fontSize:11,color:T.muted}}>{searchHits.size} found</span>
            )}
          </div>
        )}

        {/* ── Bottom status bar ── */}
        {!presentMode && (
          <div style={{
            position:"absolute", bottom:16, right: showMini?190:20,
            background:T.panel, border:`1px solid ${T.border}`, borderRadius:7,
            display:"flex", alignItems:"center", gap:0, fontSize:11, color:T.muted,
            overflow:"hidden",
          }}>
            {[
              [`${nodes.length} nodes`], [`${edges.length} edges`],
              [multiSel.size>1?`${multiSel.size} selected`:""],
            ].filter(([v])=>v).map(([v],i)=>(
              <div key={i} style={{ padding:"6px 12px", borderRight:`1px solid ${T.border}` }}>{v}</div>
            ))}
            <div style={{ padding:"6px 12px" }}>
              <button onClick={()=>setShowGrid(g=>!g)} style={{background:"transparent",border:"none",color:showGrid?T.accent:T.muted,cursor:"pointer",fontSize:11}}>Grid</button>
            </div>
            <div style={{ padding:"6px 12px", borderLeft:`1px solid ${T.border}` }}>
              <button onClick={()=>setShowMini(m=>!m)} style={{background:"transparent",border:"none",color:showMini?T.accent:T.muted,cursor:"pointer",fontSize:11}}>Map</button>
            </div>
          </div>
        )}

        {/* ── Minimap ── */}
        {showMini && !presentMode && (
          <Minimap nodes={visibleNodes} viewBox={viewBox} T={T}/>
        )}

        {/* ── Link hint ── */}
        {mode==="link" && !presentMode && (
          <div style={{
            position:"absolute", bottom:64, left:"50%", transform:"translateX(-50%)",
            background: T.panel, border:`1px solid ${T.border}`,
            color:"#fbbf24", borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:500,
          }}>
            {linking?"Click destination node to connect":"Click source node to start linking"} · Esc to cancel
          </div>
        )}
      </div>

      {/* ── Right Panel ── */}
      {panelOpen && !presentMode && (
        <div style={{
          width:260, height:"100%", display:"flex", flexDirection:"column",
          background:T.panel, borderLeft:`1px solid ${T.border}`,
          overflow:"hidden",
        }}>
          {/* Panel tab bar */}
          <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            {[["node","Node"],["style","Style"],["map","Map"]].map(([t,l])=>(
              <button key={t} onClick={()=>setPanelTab(t)}
                style={{ flex:1, padding:"11px 0", border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                  background:panelTab===t?T.surface:"transparent",
                  color:panelTab===t?T.text:T.muted,
                  borderBottom:panelTab===t?`2px solid ${T.accent}`:"2px solid transparent",
                }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:"auto" }}>
            {/* ── Node Tab ── */}
            {panelTab==="node" && selectedNode && (
              <>
                <Section title="Label & Content" T={T}>
                  <div style={{display:"flex",gap:6,marginBottom:8}}>
                    <input value={selectedNode.emoji||""} onChange={e=>upNode("emoji",e.target.value)}
                      placeholder="😀" style={{...inputStyle(T),width:44,textAlign:"center",flexShrink:0}}/>
                    <input value={selectedNode.text} onChange={e=>upNode("text",e.target.value)}
                      style={{...inputStyle(T),flex:1}}/>
                  </div>
                  <textarea value={selectedNode.note||""} onChange={e=>upNode("note",e.target.value)}
                    placeholder="Add a note…" rows={3}
                    style={{...inputStyle(T),resize:"vertical",lineHeight:1.5}}/>
                  <div style={{marginTop:8}}>
                    <input value={selectedNode.tag||""} onChange={e=>upNode("tag",e.target.value)}
                      placeholder="#tag"
                      style={{...inputStyle(T)}}/>
                  </div>
                </Section>

                <Section title="Color" T={T}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {NODE_COLORS.map(c=>(
                      <button key={c} onClick={()=>upNode("color",c)}
                        style={{ width:26,height:26,borderRadius:6,border:"none",background:c,cursor:"pointer",
                          outline:selectedNode.color===c?`2px solid white`:"2px solid transparent",
                          outlineOffset:2,transition:"transform 0.1s",
                        }}
                        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                      />
                    ))}
                  </div>
                  <div style={{marginTop:8,display:"flex",gap:6,alignItems:"center"}}>
                    <label style={{fontSize:11,color:T.muted,flexShrink:0}}>Custom</label>
                    <input type="color" value={selectedNode.color}
                      onChange={e=>upNode("color",e.target.value)}
                      style={{width:36,height:28,border:`1px solid ${T.border}`,borderRadius:6,padding:2,background:"transparent",cursor:"pointer"}}/>
                  </div>
                </Section>

                <Section title="Typography" T={T}>
                  <div style={{display:"flex",gap:6,marginBottom:8}}>
                    <label style={{fontSize:11,color:T.muted,width:70,flexShrink:0,paddingTop:8}}>Size {selectedNode.fontSize||14}px</label>
                    <input type="range" min={10} max={36} value={selectedNode.fontSize||14}
                      onChange={e=>upNode("fontSize",+e.target.value)}
                      style={{flex:1,accentColor:T.accent}}/>
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:8}}>
                    {[["B","bold","bold"],["I","italic","italic"]].map(([l,k,v])=>(
                      <button key={k} onClick={()=>upNode(k,!selectedNode[k])}
                        style={{ padding:"5px 14px", borderRadius:6, border:`1px solid ${T.border}`,
                          background:selectedNode[k]?T.accent:T.surface,
                          color:selectedNode[k]?"white":T.text, fontSize:13, fontWeight:700, cursor:"pointer",
                        }}>{l}</button>
                    ))}
                  </div>
                  <select value={selectedNode.fontFamily||"Inter"} onChange={e=>upNode("fontFamily",e.target.value)}
                    style={{...inputStyle(T)}}>
                    {FONT_FAMILIES.map(f=><option key={f} value={f}>{f.replace(/'/g,"")}</option>)}
                  </select>
                </Section>

                <Section title="Shape" T={T}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {["rounded","pill","diamond","hexagon","circle"].map(s=>(
                      <button key={s} onClick={()=>upNode("shape",s)}
                        style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${selectedNode.shape===s?T.accent:T.border}`,
                          background:selectedNode.shape===s?T.accent+"22":T.surface,
                          color:selectedNode.shape===s?T.text:T.muted, fontSize:11, cursor:"pointer",
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Image URL" T={T} defaultOpen={false}>
                  <div style={{display:"flex",gap:6}}>
                    <input value={imageInput} onChange={e=>setImageInput(e.target.value)}
                      placeholder="https://…" style={{...inputStyle(T),flex:1}}/>
                    <button onClick={()=>{upNode("image",imageInput);setImageInput("");toast("Image set","success");}}
                      style={{padding:"0 12px",borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,cursor:"pointer",fontSize:12}}>
                      Set
                    </button>
                  </div>
                  {selectedNode.image && (
                    <button onClick={()=>upNode("image","")} style={{marginTop:6,width:"100%",padding:"5px",borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:"#ef4444",cursor:"pointer",fontSize:11}}>
                      Remove Image
                    </button>
                  )}
                </Section>

                <Section title="Options" T={T} defaultOpen={false}>
                  {[
                    ["locked","🔒 Locked","Lock node from editing"],
                    ["collapsed","⬇ Collapsed","Hide children"],
                  ].map(([k,l,desc])=>(
                    <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:500}}>{l}</div>
                        <div style={{fontSize:10,color:T.muted}}>{desc}</div>
                      </div>
                      <button onClick={()=>upNode(k,!selectedNode[k])}
                        style={{ width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",
                          background:selectedNode[k]?T.accent:"#333",position:"relative",transition:"background 0.2s",
                        }}>
                        <div style={{ position:"absolute",top:3,width:16,height:16,borderRadius:8,background:"white",
                          transition:"left 0.15s",left:selectedNode[k]?21:3,
                        }}/>
                      </button>
                    </div>
                  ))}
                  <div style={{display:"flex",gap:6,paddingTop:4}}>
                    <button onClick={()=>{snapshot();addChild()}} style={{flex:1,padding:"8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,cursor:"pointer",fontSize:12,fontWeight:500}}>+ Child</button>
                    <button onClick={duplicateNode} style={{flex:1,padding:"8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,cursor:"pointer",fontSize:12,fontWeight:500}}>Duplicate</button>
                  </div>
                  <button onClick={()=>deleteNodes(multiSel)} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:6,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:500}}>
                    Delete Node{multiSel.size>1?`s (${multiSel.size})`:""}
                  </button>
                </Section>
              </>
            )}
            {panelTab==="node" && !selectedNode && (
              <div style={{padding:24,textAlign:"center",color:T.muted,fontSize:13}}>
                Click a node to edit it
              </div>
            )}

            {/* ── Style Tab ── */}
            {panelTab==="style" && (
              <>
                <Section title="Edge Style" T={T}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {EDGE_STYLES.map(s=>(
                      <button key={s} onClick={()=>setEdgeStyle(s)}
                        style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${edgeStyle===s?T.accent:T.border}`,
                          background:edgeStyle===s?T.accent+"22":T.surface, color:edgeStyle===s?T.text:T.muted,
                          fontSize:11, cursor:"pointer",
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:T.muted}}>Animated edges</span>
                    <button onClick={()=>setAnimatedEdges(a=>!a)}
                      style={{ width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",
                        background:animatedEdges?T.accent:"#333",position:"relative",transition:"background 0.2s",
                      }}>
                      <div style={{ position:"absolute",top:3,width:16,height:16,borderRadius:8,background:"white",
                        transition:"left 0.15s",left:animatedEdges?21:3,
                      }}/>
                    </button>
                  </div>
                </Section>

                <Section title="Auto-Layout" T={T}>
                  <div style={{display:"flex",gap:6}}>
                    {[["Radial","radial"],["Tree","horizontal"]].map(([l,t])=>(
                      <button key={t} onClick={()=>autoArrange(t)}
                        style={{ flex:1,padding:"8px",borderRadius:6,border:`1px solid ${T.border}`,
                          background:T.surface,color:T.text,cursor:"pointer",fontSize:12,fontWeight:500,
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Color Palette" T={T}>
                  {Object.keys(PALETTES).map(p=>(
                    <button key={p} onClick={()=>setPalette(p)}
                      style={{ display:"flex",alignItems:"center",gap:8,width:"100%",
                        padding:"7px 10px",borderRadius:6,marginBottom:4,
                        border:`1px solid ${palette===p?T.accent:T.border}`,
                        background:palette===p?T.accent+"15":T.surface,cursor:"pointer",
                      }}>
                      <div style={{display:"flex",gap:3}}>
                        {PALETTES[p].map(c=><div key={c} style={{width:14,height:14,borderRadius:3,background:c}}/>)}
                      </div>
                      <span style={{fontSize:12,color:T.text}}>{p}</span>
                    </button>
                  ))}
                </Section>

                <Section title="Canvas" T={T}>
                  {[
                    ["Show grid","showGrid",showGrid,setShowGrid],
                    ["Show labels","showLabels",showLabels,setShowLabels],
                    ["Snap to grid","snapToGrid",snapToGrid,setSnapToGrid],
                    ["Show minimap","showMini",showMini,setShowMini],
                  ].map(([l,_,val,set])=>(
                    <div key={l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{fontSize:12,color:T.muted}}>{l}</span>
                      <button onClick={()=>set(v=>!v)}
                        style={{ width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",
                          background:val?T.accent:"#333",position:"relative",transition:"background 0.2s",
                        }}>
                        <div style={{ position:"absolute",top:3,width:16,height:16,borderRadius:8,background:"white",
                          transition:"left 0.15s",left:val?21:3,
                        }}/>
                      </button>
                    </div>
                  ))}
                </Section>
              </>
            )}

            {/* ── Map Tab ── */}
            {panelTab==="map" && (
              <>
                <Section title="Theme" T={T}>
                  {Object.keys(THEMES).map(t=>(
                    <button key={t} onClick={()=>setTheme(t)}
                      style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                        width:"100%",padding:"8px 10px",borderRadius:6,marginBottom:4,
                        border:`1px solid ${theme===t?T.accent:T.border}`,
                        background:theme===t?T.accent+"18":T.surface,cursor:"pointer",
                      }}>
                      <span style={{fontSize:12,color:T.text,fontWeight:theme===t?600:400}}>{t}</span>
                      <div style={{width:12,height:12,borderRadius:"50%",background:THEMES[t].accent}}/>
                    </button>
                  ))}
                </Section>

                <Section title="Export" T={T}>
                  {[
                    ["⬇ JSON","json",exportJSON],
                    ["⬇ Markdown","md",exportMarkdown],
                    ["⬇ SVG","svg",exportSVG],
                  ].map(([l,k,fn])=>(
                    <button key={k} onClick={fn}
                      style={{ width:"100%",padding:"8px",borderRadius:6,marginBottom:6,
                        border:`1px solid ${T.border}`,background:T.surface,color:T.text,
                        cursor:"pointer",fontSize:12,fontWeight:500,textAlign:"left",
                      }}>
                      {l}
                    </button>
                  ))}
                </Section>

                <Section title="Import" T={T}>
                  <label style={{ display:"block",width:"100%",padding:"8px",borderRadius:6,
                    border:`1px solid ${T.border}`,background:T.surface,color:T.text,
                    cursor:"pointer",fontSize:12,fontWeight:500,textAlign:"center",
                  }}>
                    ⬆ Import JSON
                    <input type="file" accept=".json" style={{display:"none"}} onChange={importJSON}/>
                  </label>
                </Section>

                <Section title="Stats" T={T} defaultOpen={false}>
                  {[["Nodes",nodes.length],["Edges",edges.length],["History",history.length],["Selected",multiSel.size]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontSize:12,color:T.muted}}>{l}</span>
                      <span style={{fontSize:12,fontWeight:600,color:T.text}}>{v}</span>
                    </div>
                  ))}
                </Section>

                <Section title="Keyboard Shortcuts" T={T} defaultOpen={false}>
                  {[
                    ["Tab","Add child"],["Del","Delete node"],["⌘Z","Undo"],["⌘Y","Redo"],
                    ["⌘D","Duplicate"],["⌘A","Select all"],["⌘F","Search"],
                    ["1/2/3","Select/Pan/Link"],["0","Fit all"],["+/-","Zoom"],
                    ["P","Present mode"],["Esc","Cancel"],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontSize:11,color:T.muted}}>{v}</span>
                      <kbd style={{fontSize:10,color:T.text,background:T.surface,padding:"2px 6px",borderRadius:4,border:`1px solid ${T.border}`}}>{k}</kbd>
                    </div>
                  ))}
                </Section>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Context Menu ── */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={ctxItems} T={T}
          onClose={()=>setContextMenu(null)}/>
      )}

      {/* ── Toasts ── */}
      <ToastStack toasts={toasts} T={T}/>

      {/* Present mode overlay */}
      {presentMode && (
        <div style={{position:"fixed",top:12,right:12,zIndex:9999}}>
          <button onClick={()=>setPresentMode(false)}
            style={{padding:"6px 16px",borderRadius:8,border:`1px solid ${T.border}`,
              background:T.panel,color:T.text,fontSize:12,cursor:"pointer",fontWeight:600}}>
            ✕ Exit Presentation
          </button>
        </div>
      )}
    </div>
  );
}
