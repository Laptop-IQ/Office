import express from "express";
import cors from "cors";
import "dotenv/config";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import hpp from "hpp";

import userRouter from "./routes/userRoute.js";
import connectDB from "./config/db.js";
import dsrRecordRouter from "./routes/dsrRecordRouter.js";
import dsrCustomerRouter from "./routes/dsrCustomerRouter.js";
import keyCustomerRoutes from "./routes/keyCustomerRoutes.js";
import stockRoute from "./routes/stockRoute.js";
import dispatchRoutes from "./routes/dispatchRoutes.js";
import overdueRoutes from "./routes/overdueRoutes.js";
import ecofastRoutes from "./routes/ecofastRoutes.js";
import priceListRoute from "./routes/priceListRoute.js";
import purchasePriceListRoute from "./routes/purchasePriceListRoute.js";
import { protect } from "./middleware/authMiddleware.js";
import { startGuestSweeper } from "./utils/guestSandbox.js";

const app = express();
const port = process.env.PORT || 4000;

// Trust proxy
app.set("trust proxy", 1);

// Allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || "").split(",").map((value) => value.trim()),
  "https://office-1-jg5x.onrender.com",
].filter(Boolean);

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Security middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(hpp());
app.use(compression());

// CORS
app.use(cors(corsOptions));

// Global rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 1000 : 100,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Auth routes rate limit
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: "Too many attempts, please try again later.",
});

// Guest demo: each start copies the demo data, so keep it modest per IP
const guestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.GUEST_STARTS_PER_HOUR) || 20,
  message: { success: false, message: "Too many demo starts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/user/login", authLimiter);
app.use("/api/user/guest", (req, res, next) =>
  req.method === "POST" ? guestLimiter(req, res, next) : next(),
);
app.use("/api/user/register", authLimiter);
app.use("/api/user/forgot-password", authLimiter);
app.use("/api/user/reset-password", authLimiter);

// API responses are per-user: never let a browser / proxy cache and replay one user's data to another
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Price list upload can be larger than 1 MB — must be mounted BEFORE the global parser
app.use("/api/pricelist", express.json({ limit: "5mb" }), priceListRoute);
// Purchase-order page price list (also large) — same rule: before the global parser
app.use(
  "/api/purchase-pricelist",
  express.json({ limit: "5mb" }),
  purchasePriceListRoute,
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Routes
app.use("/api/user", userRouter);
app.use("/api/dsr/records", dsrRecordRouter);
app.use("/api/dsr/customers", dsrCustomerRouter);
app.use("/api/dsr/key-customers", keyCustomerRoutes);
app.use("/api/stock", stockRoute);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/overdues", overdueRoutes);
// Ecofast Trial Report + Excel export (authenticated)
app.use("/api/ecofast", protect, express.json({ limit: "2mb" }), ecofastRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API WORKING");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// Start server
connectDB()
  .then(() => {
    app.listen(port);
    startGuestSweeper(); // removes demo sandboxes that were never logged out
  })
  .catch(() => {
    process.exit(1);
  });
