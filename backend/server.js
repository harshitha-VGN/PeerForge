import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

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
const io = new Server(httpServer, {
  cors: { origin: "*" } // Adjust for production
});
app.use(cors({
  origin: "http://localhost:3000", // Allow your React web app
  credentials: true
}));

app.use(express.json());

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



// --- WebSocket Logic for DSA Duels ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_duel", (roomId) => {
    socket.join(roomId);
    console.log(`User joined duel room: ${roomId}`);
  });

  socket.on("code_update", ({ roomId, code }) => {
    // Broadcast code to opponent only
    socket.to(roomId).emit("receive_code", code);
  });

  socket.on("submit_solution", ({ roomId, status }) => {
    if (status === "success") {
      io.in(roomId).emit("duel_winner", { winnerId: socket.id });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});