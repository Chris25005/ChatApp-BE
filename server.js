const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const User = require("./models/User");

const app = express();

/* ===================== CORS ===================== */
const allowedOrigins = [
  "http://localhost:5173",
  "https://magenta-swan-58beb6.netlify.app/",
  "https://chatapp-frontend-phi.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

/* ===================== DATABASE ===================== */
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/whatsapp_chat";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ===================== ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

/* ===================== SOCKET SERVER ===================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"], // REQUIRED for Render
});

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("user-online", (userId) => {
    socket.userId = userId;
    onlineUsers[userId] = socket.id;
    io.emit("online-users", Object.keys(onlineUsers));
  });

  socket.on("sendMessage", (message) => {
    const receiverSocketId = onlineUsers[message.receiverId];

    socket.emit("messageSent", { messageId: message._id });

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", message);
    }
  });

  socket.on("messageDelivered", ({ messageId, senderId }) => {
    const senderSocketId = onlineUsers[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDelivered", { messageId });
    }
  });

  socket.on("messageSeen", ({ messageIds, senderId }) => {
    const senderSocketId = onlineUsers[senderId];
    if (senderSocketId) {
      messageIds.forEach((id) => {
        io.to(senderSocketId).emit("messageSeen", { messageId: id });
      });
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping");
    }
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      delete onlineUsers[socket.userId];

      await User.findByIdAndUpdate(socket.userId, {
        lastSeen: new Date(),
      });

      io.emit("online-users", Object.keys(onlineUsers));
      console.log("❌ Socket disconnected:", socket.userId);
    }
  });
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 1005;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
