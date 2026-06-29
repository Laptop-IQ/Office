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

router.use(protect);

// ── Map-level ──────────────────────────────
router.post("/",            createMindMap);
router.get("/:mapId",       getMindMap); 
router.put("/:mapId/sync",  syncMindMap);

router.post("/:mapId/node",            addNode);
router.patch("/:mapId/node/:nodeId",   updateNode);
router.delete("/:mapId/node/:nodeId",  deleteNode);

router.post("/:mapId/edge",            addEdge);
router.delete("/:mapId/edge/:edgeId",  deleteEdge);

export default router;
