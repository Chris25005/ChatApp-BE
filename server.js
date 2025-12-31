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

/* ---------- MIDDLEWARE ---------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

/* ---------- DB ---------- */
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/whatsapp_chat")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ Mongo error:", err));

/* ---------- ROUTES ---------- */
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

app.get("/", (_, res) => res.send("API running"));

/* ---------- SOCKET ---------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
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
    const receiverSocket = onlineUsers[message.receiverId];

    socket.emit("messageSent", { messageId: message._id });

    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", message);
    }
  });

  socket.on("messageDelivered", ({ messageId, senderId }) => {
    const senderSocket = onlineUsers[senderId];
    if (senderSocket) {
      io.to(senderSocket).emit("messageDelivered", { messageId });
    }
  });

  socket.on("messageSeen", ({ messageIds, senderId }) => {
    const senderSocket = onlineUsers[senderId];
    if (senderSocket) {
      messageIds.forEach((id) => {
        io.to(senderSocket).emit("messageSeen", { messageId: id });
      });
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("stopTyping");
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

/* ---------- START ---------- */
const PORT = 1005;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
