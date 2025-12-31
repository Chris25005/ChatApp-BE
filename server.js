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
app.use(express.json()); // 🔴 REQUIRED (many people miss this)
app.use(
  cors({
    origin: "*",
  })
);

/* ===================== DEBUG ENV ===================== */
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

/* ===================== DB ===================== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

/* ===================== ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.send("API OK");
});

/* ===================== SOCKET ===================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", () => {
  console.log("🟢 Socket connected");
});

/* ===================== START ===================== */
const PORT = process.env.PORT || 1005;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
