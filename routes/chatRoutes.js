const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");

const router = express.Router();

router.get("/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

router.post("/send", async (req, res) => {
  const msg = await Message.create(req.body);
  res.json(msg);
});

router.get("/messages/:u1/:u2", async (req, res) => {
  const msgs = await Message.find({
    $or: [
      { senderId: req.params.u1, receiverId: req.params.u2 },
      { senderId: req.params.u2, receiverId: req.params.u1 },
    ],
  }).sort({ createdAt: 1 });

  res.json(msgs);
});

module.exports = router;
