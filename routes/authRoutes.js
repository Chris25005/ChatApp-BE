const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone,
      password: hashedPassword,
      lastSeen: new Date(),
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
res.set('Access-Control-Allow-Origin', 'https://chatapp008.netlify.app');
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
      },
      token,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      message: "Register failed",
      error: err.message,
    });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.set('Access-Control-Allow-Origin', 'https://chatapp008.netlify.app');
   
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
      },
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
});

module.exports = router;
