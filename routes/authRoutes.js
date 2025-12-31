const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const { name, phone, password } = req.body;

    // Basic validation
    if (!name || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      phone,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    // 🔴 FORCE FULL ERROR VISIBILITY
    console.error("❌ REGISTER CRASH FULL ERROR ↓↓↓");
    console.error(error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password required",
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    // 🔴 FORCE FULL ERROR VISIBILITY
    console.error("❌ LOGIN CRASH FULL ERROR ↓↓↓");
    console.error(error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
