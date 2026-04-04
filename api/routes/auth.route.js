import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_dev_123";

router.post("/signup", async (req, res) => {
  try {
    const { email, password, display_name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    // Explicitly set org_id to a fresh mongoose ID to guarantee isolation
    const orgId = new mongoose.Types.ObjectId().toString();
    const user = await User.create({ email, password: hashedPassword, display_name, org_id: orgId });

    const token = jwt.sign({ id: user._id, org_id: user.org_id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: user._id, email: user.email, display_name: user.display_name }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, org_id: user.org_id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: user._id, email: user.email, display_name: user.display_name }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
