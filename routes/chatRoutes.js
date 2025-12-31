const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");

const router = express.Router();

router.get("/users", async (req, res) => {
  const users = await User.find()
    .select("-password")
    .select("name phone lastSeen");
  res.json(users);
});

router.post("/send", async (req, res) => {
  const { senderId, receiverId, text } = req.body;

  const msg = await Message.create({
    senderId,
    receiverId,
    text,
    status: "sent",
  });

  res.json(msg);
});

router.get("/messages/:u1/:u2", async (req, res) => {
  const { u1, u2 } = req.params;

  const msgs = await Message.find({
    $or: [
      { senderId: u1, receiverId: u2 },
      { senderId: u2, receiverId: u1 },
    ],
  }).sort({ createdAt: 1 });

  res.json(msgs);
});

module.exports = router;
