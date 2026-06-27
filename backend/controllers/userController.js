import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/userModel.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp, subject = "Your OTP Code") => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1d4ed8;">MyApp</h2>
        <p style="color:#374151;">Your OTP code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;text-align:center;padding:16px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
};

// ← FIXED: rememberMe parameter added
const signToken = (userId, rememberMe = false) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "30d" : process.env.JWT_EXPIRES_IN || "7d",
  });

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  profilePic: user.profilePic || "",
});

// ────────────────────────────────────────────
// REGISTER — POST /api/user/register
// ────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing && existing.isVerified)
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (existing) {
      existing.name = name;
      existing.password = hashedPassword;
      existing.otp = otp;
      existing.otpExpiry = otpExpiry;
      await existing.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpiry,
      });
    }

    await sendOTPEmail(email, otp, "Verify your MyApp account");
    res.status(201).json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// VERIFY SIGNUP OTP — POST /api/user/verify-signup-otp
// ────────────────────────────────────────────
export const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (new Date() > user.otpExpiry)
      return res
        .status(400)
        .json({ success: false, message: "OTP expired. Request a new one." });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({
      success: true,
      message: "Email verified successfully",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// RESEND SIGNUP OTP — POST /api/user/resend-signup-otp
// ────────────────────────────────────────────
export const resendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.isVerified)
      return res
        .status(400)
        .json({ success: false, message: "Email already verified" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp, "Your new verification OTP");
    res.json({ success: true, message: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// LOGIN — POST /api/user/login
// ────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    // ← FIXED: remember destructure kiya
    const { email, password, remember } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    if (!user.isVerified)
      return res
        .status(403)
        .json({ success: false, message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    // ← FIXED: remember pass kiya signToken mein
    const token = signToken(user._id, remember);
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// GET ME — GET /api/user/me
// ────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// FORGOT PASSWORD — POST /api/user/forgot-password
// ────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.json({
        success: true,
        message: "If this email exists, OTP has been sent",
      });

    const otp = generateOTP();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp, "Reset your MyApp password");
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// RESET PASSWORD — POST /api/user/reset-password
// ────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.resetOtp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (new Date() > user.resetOtpExpiry)
      return res.status(400).json({ success: false, message: "OTP expired" });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// UPDATE PROFILE — PUT /api/user/profile
// ────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken)
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
      user.email = email;
    }

    if (name) user.name = name;
    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// UPDATE PASSWORD — PUT /api/user/password
// ────────────────────────────────────────────
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });

    if (newPassword.length < 8)
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// DELETE ACCOUNT — DELETE /api/user/delete-account
// ────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.profilePic) {
      const filePath = path.join(process.cwd(), user.profilePic);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await User.findByIdAndDelete(req.user.id);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
