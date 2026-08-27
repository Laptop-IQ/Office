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

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// PUBLIC
router.get("/", getAllGroups);
router.get("/:id", getGroupById);

// PROTECTED
router.post("/", protect, createGroup);
router.put("/:id", protect, updateGroup);
router.delete("/:id", protect, deleteGroup);

router.post("/:id/add-command", protect, addCommandToGroup);
router.delete("/:id/remove-command/:cmdId", protect, removeCommandFromGroup);

export default router;
