// routes/mindmapRoutes.js
import express from "express";
import {
  getMindMap,
  createMindMap,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  deleteEdge,
  syncMindMap,
} from "../controllers/mindmapController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected
router.use(protect);

// ── Map-level ──────────────────────────────
router.post("/",            createMindMap);   // Create new map
router.get("/:mapId",       getMindMap);      // Get map by id
router.put("/:mapId/sync",  syncMindMap);     // Full state sync (bulk save)

// ── Node-level ──────────────────────────────
// POST   /api/mindmap/:mapId/node
//   body: { parentId, text?, direction?, color? }
//   direction: "top" | "right" | "bottom" | "left"  ← from hover + button
router.post("/:mapId/node",            addNode);
router.patch("/:mapId/node/:nodeId",   updateNode);
router.delete("/:mapId/node/:nodeId",  deleteNode);

// ── Edge-level ──────────────────────────────
router.post("/:mapId/edge",            addEdge);
router.delete("/:mapId/edge/:edgeId",  deleteEdge);

export default router;
