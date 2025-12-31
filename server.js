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
  "https://incandescent-medovik-5cbb8b.netlify.app/"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

/* ===================== DATABASE ===================== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

/* ===================== ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => res.send("API running"));

/* ===================== SOCKET ===================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"],
});

const onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("user-online", (userId) => {
    socket.userId = userId;
    onlineUsers[userId] = socket.id;
    io.emit("online-users", Object.keys(onlineUsers));
  });

  socket.on("sendMessage", (message) => {
    const receiverSocketId = onlineUsers[message.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", message);
    }
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      delete onlineUsers[socket.userId];
      await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
      io.emit("online-users", Object.keys(onlineUsers));
    }
  });
});

/* ===================== START ===================== */
const PORT = process.env.PORT || 1005;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
