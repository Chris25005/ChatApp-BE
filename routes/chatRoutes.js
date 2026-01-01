const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");

const router = express.Router();

/* ===================== USERS ===================== */
router.get("/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

/* ===================== SEND ===================== */
router.post("/send", async (req, res) => {
  const { senderId, receiverId, text } = req.body;

  const message = await Message.create({
    senderId,
    receiverId,
    text,
    status: "sent",
  });

  res.json(message);
});

/* ===================== MESSAGES ===================== */
router.get("/messages/:u1/:u2", async (req, res) => {
  const { u1, u2 } = req.params;

  const messages = await Message.find({
    $or: [
      { senderId: u1, receiverId: u2 },
      { senderId: u2, receiverId: u1 },
    ],
  }).sort({ createdAt: 1 });

  res.json(messages);
});

/* ===================== MARK SEEN ===================== */
router.post("/seen", async (req, res) => {
  const { messageIds } = req.body;

  await Message.updateMany(
    { _id: { $in: messageIds } },
    { status: "seen" }
  );

  res.json({ success: true });
});

module.exports = router;
