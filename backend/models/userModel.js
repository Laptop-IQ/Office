// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    profilePic: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Registration OTP
    otp: String,
    otpExpiry: Date,
    // Password reset OTP
    resetOtp: String,
    resetOtpExpiry: Date,
    // ── Guest demo ──────────────────────────────────────────────────────
    // isGuest: temporary sandbox account created by "Continue as Guest".
    //   It owns a private COPY of the demo data and is deleted (with all of
    //   its data) when the guest logs out or guestExpiresAt passes.
    // isDemoTemplate: the read-only source account that guests are cloned from.
    isGuest: { type: Boolean, default: false, index: true },
    guestExpiresAt: { type: Date, index: true },
    isDemoTemplate: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
