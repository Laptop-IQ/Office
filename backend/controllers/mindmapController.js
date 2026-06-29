// controllers/mindmapController.js
import MindMap from "../models/mindmapModel.js";

// ─── Helper: generate short uid ──────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Helper: build child position based on direction ──────────────────────
const getChildPosition = (parentX, parentY, direction, existingChildCount) => {
  const DIST = 200;

  // If a direction is explicitly given (from hover + button)
  if (direction) {
    const offsets = {
      top:    { x: 0,     y: -DIST },
      right:  { x: DIST,  y: 0     },
      bottom: { x: 0,     y: DIST  },
      left:   { x: -DIST, y: 0     },
    };
    const off = offsets[direction] || offsets.bottom;
    return { x: parentX + off.x, y: parentY + off.y };
  }

  // Default radial spread if no direction
  const angle = (existingChildCount * 50 - 80) * (Math.PI / 180);
  return {
    x: parentX + Math.cos(angle) * DIST,
    y: parentY + Math.sin(angle) * DIST,
  };
};

// ────────────────────────────────────────────
// GET MINDMAP — GET /api/mindmap/:mapId
// ────────────────────────────────────────────
export const getMindMap = async (req, res) => {
  try {
    const { mapId } = req.params;
    const map = await MindMap.findOne({ _id: mapId, owner: req.user.id });

    if (!map)
      return res
        .status(404)
        .json({ success: false, message: "Mind map not found" });

    res.json({ success: true, map });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// CREATE MINDMAP — POST /api/mindmap
// ────────────────────────────────────────────
export const createMindMap = async (req, res) => {
  try {
    const { title } = req.body;
    const rootId = uid();

    const map = await MindMap.create({
      owner: req.user.id,
      title: title || "Untitled Mind Map",
      nodes: [
        {
          id: "root",
          text: title || "My Mind Map",
          x: 2000,
          y: 2000,
          color: "#7c3aed",
          shape: "rounded",
          fontSize: 18,
          bold: true,
          italic: false,
          note: "",
          tag: "",
          emoji: "🧠",
          collapsed: false,
          locked: false,
          image: "",
          fontFamily: "Inter",
        },
      ],
      edges: [],
    });

    res.status(201).json({ success: true, map });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// ADD NODE — POST /api/mindmap/:mapId/node
//
// Body:
//   parentId   — id of parent node (required)
//   text       — label for new node (optional, default "New Idea")
//   direction  — "top"|"right"|"bottom"|"left" (optional, from hover + btn)
//   color      — hex color (optional)
// ────────────────────────────────────────────
export const addNode = async (req, res) => {
  try {
    const { mapId } = req.params;
    const { parentId, text = "New Idea", direction, color } = req.body;

    if (!parentId)
      return res
        .status(400)
        .json({ success: false, message: "parentId is required" });

    const map = await MindMap.findOne({ _id: mapId, owner: req.user.id });
    if (!map)
      return res
        .status(404)
        .json({ success: false, message: "Mind map not found" });

    // Find parent node
    const parentNode = map.nodes.find((n) => n.id === parentId);
    if (!parentNode)
      return res
        .status(404)
        .json({ success: false, message: "Parent node not found" });

    if (parentNode.locked)
      return res
        .status(403)
        .json({ success: false, message: "Parent node is locked" });

    // Count existing children of this parent to determine spread
    const existingChildCount = map.edges.filter(
      (e) => e.from === parentId
    ).length;

    // Calculate position
    const pos = getChildPosition(
      parentNode.x,
      parentNode.y,
      direction,
      existingChildCount
    );

    // Palette cycling — pick color based on child count
    const PALETTE_COLORS = [
      "#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed",
      "#fb7185", "#fda4af", "#f43f5e", "#e11d48",
      "#14b8a6", "#2dd4bf", "#5eead4", "#0d9488",
    ];
    const nodeColor = color || PALETTE_COLORS[existingChildCount % PALETTE_COLORS.length];

    const newNodeId = uid();
    const newEdgeId = uid();

    const newNode = {
      id: newNodeId,
      text,
      x: pos.x,
      y: pos.y,
      color: nodeColor,
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
    };

    const newEdge = {
      id: newEdgeId,
      from: parentId,
      to: newNodeId,
      label: "",
      style: "curve",
    };

    map.nodes.push(newNode);
    map.edges.push(newEdge);
    await map.save();

    res.status(201).json({
      success: true,
      message: "Node added",
      node: newNode,
      edge: newEdge,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// UPDATE NODE — PATCH /api/mindmap/:mapId/node/:nodeId
//
// Body: any node fields to update
//   text, color, shape, fontSize, bold, italic,
//   note, tag, emoji, collapsed, locked, image,
//   fontFamily, x, y
// ────────────────────────────────────────────
export const updateNode = async (req, res) => {
  try {
    const { mapId, nodeId } = req.params;
    const updates = req.body;

    const map = await MindMap.findOne({ _id: mapId, owner: req.user.id });
    if (!map)
      return res
        .status(404)
        .json({ success: false, message: "Mind map not found" });

    const nodeIndex = map.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1)
      return res
        .status(404)
        .json({ success: false, message: "Node not found" });

    const node = map.nodes[nodeIndex];

    // Prevent editing locked nodes (except unlocking them)
    if (node.locked && updates.locked !== false)
      return res
        .status(403)
        .json({ success: false, message: "Node is locked" });

    // Allowed updatable fields
    const ALLOWED = [
      "text", "color", "shape", "fontSize", "bold", "italic",
      "note", "tag", "emoji", "collapsed", "locked", "image",
      "fontFamily", "x", "y",
    ];

    ALLOWED.forEach((key) => {
      if (updates[key] !== undefined) {
        map.nodes[nodeIndex][key] = updates[key];
      }
    });

    await map.save();

    res.json({
      success: true,
      message: "Node updated",
      node: map.nodes[nodeIndex],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// DELETE NODE — DELETE /api/mindmap/:mapId/node/:nodeId
// Deletes node and all connected edges
// ────────────────────────────────────────────
export const deleteNode = async (req, res) => {
  try {
    const { mapId, nodeId } = req.params;

    if (nodeId === "root")
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete root node" });

    const map = await MindMap.findOne({ _id: mapId, owner: req.user.id });
    if (!map)
      return res
        .status(404)
        .json({ success: false, message: "Mind map not found" });

    const exists = map.nodes.find((n) => n.id === nodeId);
    if (!exists)
      return res
        .status(404)
        .json({ success: false, message: "Node not found" });

    // Recursively collect all descendant node ids to delete
    const toDelete = new Set([nodeId]);
    const collectDescendants = (id) => {
      map.edges
        .filter((e) => e.from === id)
        .forEach((e) => {
          if (!toDelete.has(e.to)) {
            toDelete.add(e.to);
            collectDescendants(e.to);
          }
        });
    };
    collectDescendants(nodeId);

    map.nodes = map.nodes.filter((n) => !toDelete.has(n.id));
    map.edges = map.edges.filter(
      (e) => !toDelete.has(e.from) && !toDelete.has(e.to)
    );

    await map.save();

    res.json({
      success: true,
      message: `Deleted ${toDelete.size} node(s)`,
      deletedIds: [...toDelete],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// ADD EDGE — POST /api/mindmap/:mapId/edge
//
// Body: { from, to, label, style }
// ────────────────────────────────────────────
export const addEdge = async (req, res) => {
  try {
    const { mapId } = req.params;
    const { from, to, label = "", style = "curve" } = req.body;

    if (!from || !to)
      return res
        .status(400)
        .json({ success: false, message: "from and to are required" });

    const map = await MindMap.findOne({ _id: mapId, owner: req.user.id });
    if (!map)
      return res
        .status(404)
        .json({ success: false, message: "Mind map not found" });

    // Prevent duplicate edges
    const duplicate = map.edges.find(
      (e) =>
        (e.from === from && e.to === to) ||
        (e.from === to && e.to === from)
    );
    if (duplicate)
      return res
        .status(409)
        .json({ success: false, message: "Edge already exists" });

    const newEdge = { id: uid(), from, to, label, style };
    map.edges.push(newEdge);
    await map.save();

    res.status(201).json({ success: true, message: "Edge added", edge: newEdge });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// DELETE EDGE — DELETE /api/mindmap/:mapId/edge/:edgeId
// ────────────────────────────────────────────
export const deleteEdge = async (req, res) => {
  try {
    const { mapId, edgeId } = req.params;

    const map = await MindMap.findOne({ _id: mapId, owner: req.user.id });
    if (!map)
      return res
        .status(404)
        .json({ success: false, message: "Mind map not found" });

    const before = map.edges.length;
    map.edges = map.edges.filter((e) => e.id !== edgeId);

    if (map.edges.length === before)
      return res
        .status(404)
        .json({ success: false, message: "Edge not found" });

    await map.save();
    res.json({ success: true, message: "Edge removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// SYNC MAP — PUT /api/mindmap/:mapId/sync
// Full state sync from client (bulk save)
// Body: { nodes: [...], edges: [...] }
// ────────────────────────────────────────────
export const syncMindMap = async (req, res) => {
  try {
    const { mapId } = req.params;
    const { nodes, edges } = req.body;

    if (!Array.isArray(nodes) || !Array.isArray(edges))
      return res
        .status(400)
        .json({ success: false, message: "nodes and edges arrays required" });

    const map = await MindMap.findOneAndUpdate(
      { _id: mapId, owner: req.user.id },
      { nodes, edges, updatedAt: new Date() },
      { new: true }
    );

    if (!map)
      return res
        .status(404)
        .json({ success: false, message: "Mind map not found" });

    res.json({ success: true, message: "Map synced", map });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
