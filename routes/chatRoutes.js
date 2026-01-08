const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Message = require("../models/Message");

/* ================================
   GET ALL USERS
================================ */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.set('Access-Control-Allow-Origin', 'https://chatapp008.netlify.app');
    res.json(users);

  } catch (err) {
    console.error("GET USERS ERROR:", err.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ================================
   GET MESSAGES BETWEEN TWO USERS
================================ */
router.get("/messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("GET MESSAGES ERROR:", err.message);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

/* ================================
   SEND MESSAGE
================================ */
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    if (!senderId || !receiverId || !text) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text,
      status: "sent",
    });

    // update lastSeen of sender
    await User.findByIdAndUpdate(senderId, {
      lastSeen: new Date(),
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err.message);
    res.status(500).json({ message: "Failed to send message" });
  }
});

/* ================================
   UPDATE MESSAGE STATUS (DELIVERED / SEEN)
================================ */
router.patch("/message/status", async (req, res) => {
  try {
    const { messageIds, status } = req.body;

    if (!messageIds || !status) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    await Message.updateMany(
      { _id: { $in: messageIds } },
      { status }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err.message);
    res.status(500).json({ message: "Failed to update message status" });
  }
});

/* ================================
   DELETE FULL CHAT (BOTH SIDES)
================================ */
router.delete("/chat/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    await Message.deleteMany({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    });

    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error("DELETE CHAT ERROR:", err.message);
    res.status(500).json({ message: "Failed to delete chat" });
  }
});

module.exports = router;
