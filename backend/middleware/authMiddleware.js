// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { purgeGuest } from "../utils/guestSandbox.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Guest demo sessions are temporary: once expired the sandbox is wiped.
    if (user.isGuest) {
      if (!user.guestExpiresAt || user.guestExpiresAt.getTime() < Date.now()) {
        purgeGuest(user._id).catch(() => {});
        return res.status(401).json({
          success: false,
          message: "Demo session expired. Please start a new demo.",
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Account-level actions (password, delete account...) are not available in the demo.
export const blockGuest = (req, res, next) => {
  if (req.user?.isGuest) {
    return res.status(403).json({
      success: false,
      message: "Not available in the guest demo.",
    });
  }
  next();
};
