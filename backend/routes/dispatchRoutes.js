// routes/dispatchRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createDispatch,
  undoDispatch,
  updateDispatch, // FIX: frontend PUT /dispatch/:id call karta tha, route missing tha
} from "../controllers/dispatchController.js";

const router = express.Router();

router.post("/", protect, createDispatch);
router.put("/:id", protect, updateDispatch);
router.post("/:id/undo", protect, undoDispatch);

export default router;
