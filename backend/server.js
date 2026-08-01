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
import stockRoute from "./routes/stockRoute.js";
import dispatchRoutes from "./routes/dispatchRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import commandRoutes from "./routes/commandRoutes.js";
import mindmapRoutes from "./routes/mindmapRoutes.js";
import customerListRoutes from "./routes/customerListRoutes.js";
import overdueRoutes from "./routes/overdueRoutes.js";

const app = express();
const port = process.env.PORT || 4000;

// Trust proxy
app.set("trust proxy", 1);

// Allowed origins
const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);

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

app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user/forgot-password", authLimiter);
app.use("/api/user/reset-password", authLimiter);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Routes
app.use("/api/user", userRouter);
app.use("/api/dsr/records", dsrRecordRouter);
app.use("/api/dsr/customers", dsrCustomerRouter);
app.use("/api/stock", stockRoute);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/commands", commandRoutes);
app.use("/api/mindmap", mindmapRoutes);
app.use("/api/customerlist", customerListRoutes);
app.use("/api/overdues", overdueRoutes);

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
  })
  .catch(() => {
    process.exit(1);
  });
