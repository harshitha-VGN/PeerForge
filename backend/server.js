import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import connectDB from "./config/db.js";
import { initSocket } from "./socket.js";

// Routes
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import podRoutes from "./routes/podRoutes.js";
import progressRoutes from "./routes/progress.js";
import duelRoutes from "./routes/duel.js";
import projectRoutes from "./routes/project.js";
import economyRoutes from "./routes/economy.js";
import problemRoutes from "./routes/problem.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// 1. Define allowed origins 
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
  : ["http://localhost:3000", "http://127.0.0.1:3000", "https://peer-forge-1.vercel.app"];

// 2. Initialize Socket.io
initSocket(httpServer, allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow for development/deployment
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/pods", podRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/duels", duelRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/economy", economyRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/review", reviewRoutes);

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});