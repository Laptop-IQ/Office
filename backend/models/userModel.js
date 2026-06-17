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
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
