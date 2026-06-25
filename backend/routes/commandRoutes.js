import express from "express";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addCommandToGroup,
  removeCommandFromGroup,
} from "../controllers/commandController.js";

const router = express.Router();

// ── CRUD ───────────────────────────────────────────────────────────────────
router.get("/", getAllGroups);                          // GET    /api/commands
router.get("/:id", getGroupById);                      // GET    /api/commands/:id
router.post("/", createGroup);                         // POST   /api/commands
router.put("/:id", updateGroup);                       // PUT    /api/commands/:id
router.delete("/:id", deleteGroup);                    // DELETE /api/commands/:id

// ── Sub-command operations ─────────────────────────────────────────────────
router.post("/:id/add-command", addCommandToGroup);                    // POST   /api/commands/:id/add-command
router.delete("/:id/remove-command/:cmdId", removeCommandFromGroup);   // DELETE /api/commands/:id/remove-command/:cmdId

export default router;
