// controllers/guestController.js
import jwt from "jsonwebtoken";
import {
  GUEST_TTL_MINUTES,
  createGuestSandbox,
  purgeGuest,
} from "../utils/guestSandbox.js";

// POST /api/user/guest  (public)
// Creates a private sandbox (a copy of the demo data) and returns a short-lived token.
export const startGuest = async (req, res) => {
  try {
    const guest = await createGuestSandbox();
    const token = jwt.sign(
      { id: guest._id, guest: true },
      process.env.JWT_SECRET,
      { expiresIn: `${GUEST_TTL_MINUTES}m` },
    );
    res.status(201).json({
      success: true,
      message: "Guest demo started",
      token,
      expiresAt: guest.guestExpiresAt,
      user: {
        id: guest._id,
        name: guest.name,
        email: guest.email,
        profilePic: "",
        isGuest: true,
      },
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message:
        status === 503
          ? err.message
          : "Could not start the demo. Please try again.",
    });
  }
};

// DELETE /api/user/guest  (guest token required)
// Logout of the demo: the sandbox and everything the guest changed is deleted.
export const endGuest = async (req, res) => {
  try {
    if (!req.user?.isGuest)
      return res
        .status(403)
        .json({ success: false, message: "Only guest sessions can be ended here." });
    await purgeGuest(req.user._id);
    res.json({ success: true, message: "Demo data cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not clear demo data" });
  }
};
