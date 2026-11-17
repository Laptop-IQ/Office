// routes/purchasePriceListRoute.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPurchasePriceList,
  savePurchasePriceList,
  clearPurchasePriceList,
} from "../controllers/purchasePriceListController.js";

const router = express.Router();

router.get("/", protect, getPurchasePriceList);
router.put("/", protect, savePurchasePriceList);
router.delete("/", protect, clearPurchasePriceList);

export default router;
