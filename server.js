require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

/* ===================== ALLOWED ORIGINS ===================== */
const allowedOrigins = [
  "http://localhost:5173",
  "https://chatapp008.netlify.app",
  "http://chatapp008.netlify.app",
];

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* 🔑 VERY IMPORTANT: preflight */
//app.options("*", cors());
app.use(cors());

/* ===================== DEBUG ===================== */
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing");
  process.exit(1);
}

/* ===================== DATABASE ===================== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
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
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("user-online", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", [...onlineUsers.keys()]);
  });

  socket.on("sendMessage", (message) => {
    const receiverSocket = onlineUsers.get(message.receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", message);
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("stopTyping");
    }
  });

  socket.on("messageDelivered", ({ messageId, senderId }) => {
    const senderSocket = onlineUsers.get(senderId);
    if (senderSocket) {
      io.to(senderSocket).emit("messageDelivered", { messageId });
    }
  });

  socket.on("messageSeen", ({ senderId, messageIds }) => {
    const senderSocket = onlineUsers.get(senderId);
    if (senderSocket) {
      messageIds.forEach((id) => {
        io.to(senderSocket).emit("messageSeen", { messageId: id });
      });
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online-users", [...onlineUsers.keys()]);
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

/* ===================== START ===================== */
const PORT = process.env.PORT || 1005;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
