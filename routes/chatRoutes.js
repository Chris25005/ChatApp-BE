const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");

const router = express.Router();

/* ===== USERS ===== */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===== SEND MESSAGE ===== */
router.post("/send", async (req, res) => {
  try {
    const message = await Message.create(req.body);
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===== GET MESSAGES ===== */
router.get("/messages/:u1/:u2", async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [
        { senderId: req.params.u1, receiverId: req.params.u2 },
        { senderId: req.params.u2, receiverId: req.params.u1 },
      ],
    }).sort({ createdAt: 1 });

    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
