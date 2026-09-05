import { Server } from "socket.io";

let ioInstance = null;

export const initSocket = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // ── Duel Events ─────────────────────────────────────────────────────────
    socket.on("join_duel", (roomId) => {
      socket.join(`duel-${roomId}`);
      console.log(`Socket ${socket.id} joined duel room: duel-${roomId}`);
    });

    socket.on("leave_duel", (roomId) => {
      socket.leave(`duel-${roomId}`);
      console.log(`Socket ${socket.id} left duel room: duel-${roomId}`);
    });

    socket.on("code_update", ({ roomId, code }) => {
      socket.to(`duel-${roomId}`).emit("receive_code", code);
    });

    // ── Pod Events ──────────────────────────────────────────────────────────
    socket.on("join_pod", (podId) => {
      socket.join(`pod-${podId}`);
      console.log(`Socket ${socket.id} joined pod room: pod-${podId}`);
    });

    socket.on("leave_pod", (podId) => {
      socket.leave(`pod-${podId}`);
      console.log(`Socket ${socket.id} left pod room: pod-${podId}`);
    });

    // ── Global / Lobby Events ───────────────────────────────────────────────
    socket.on("join_lobby", () => {
      socket.join("lobby");
    });

    socket.on("leave_lobby", () => {
      socket.leave("lobby");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return ioInstance;
};
