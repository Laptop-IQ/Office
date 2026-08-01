// routes/dispatchRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createDispatch, undoDispatch } from "../controllers/dispatchController.js";

const router = express.Router();

router.post("/", protect, createDispatch);
router.post("/:id/undo", protect, undoDispatch);

export default router;
