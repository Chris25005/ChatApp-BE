require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://incandescent-medovik-5cbb8b.netlify.app",
    ],
    credentials: true,
  })
);

/* ===================== ENV CHECK ===================== */
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

/* ===================== DATABASE ===================== */
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in environment variables");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

/* ===================== ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.send("API OK");
});

/* ===================== SOCKET.IO ===================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://superb-paletas-c15c1f.netlify.app",
    ],
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"],
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  /* USER ONLINE */
  socket.on("user-online", (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  /* SEND MESSAGE */
  socket.on("sendMessage", (message) => {
    const receiverSocketId = onlineUsers.get(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", {
        ...message,
        status: "delivered",
      });
    }
  });

  /* MESSAGE SEEN */
  socket.on("messageSeen", ({ senderId, messageIds }) => {
    const senderSocketId = onlineUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen", { messageIds });
    }
  });

  /* TYPING */
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping");
    }
  });

  /* DISCONNECT */
  socket.on("disconnect", async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      try {
        await mongoose
          .model("User")
          .findByIdAndUpdate(socket.userId, {
            lastSeen: new Date(),
          });
      } catch {}
    }

    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 1005;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
