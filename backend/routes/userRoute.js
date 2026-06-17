// routes/userRoute.js
import express from "express";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";
import {
  register,
  verifySignupOTP,
  resendSignupOTP,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  updatePassword,
  deleteAccount,
} from "../controllers/userController.js";

const router = express.Router();



// ── Public routes ───────────────────────────
router.post("/register", register);
router.post("/verify-signup-otp", verifySignupOTP); // ← matches AuthContext
router.post("/resend-signup-otp", resendSignupOTP); // ← matches AuthContext
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ── Protected routes (JWT required) ─────────
router.get("/me", protect, getMe);
router.put("/password", protect, updatePassword);
router.delete("/delete-account", protect, deleteAccount);

export default router;
