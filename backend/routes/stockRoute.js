// routes/stockRoute.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getStockData,
  saveStockData,
  clearStockData,
} from "../controllers/stockController.js";

const router = express.Router();

// Sab routes protected hain — login ke baad hi koi apna stock access kar sakta hai.
router.get("/", protect, getStockData);
router.put("/", protect, saveStockData);
router.delete("/", protect, clearStockData);

export default router;
