// routes/priceListRoute.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPriceList,
  savePriceList,
  clearPriceList,
} from "../controllers/priceListController.js";

const router = express.Router();

router.get("/", protect, getPriceList);
router.put("/", protect, savePriceList);
router.delete("/", protect, clearPriceList);

export default router;
