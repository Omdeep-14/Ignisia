import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import { runRagPipeline } from "../graph/ragGraph.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_dev_123";

// ── Auth middleware ─────────────────────────────────────────────────────────
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = {
      id: user._id.toString(),
      org_id: user.org_id,
      display_name: user.display_name,
      email: user.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── POST /api/rooms/create ──────────────────────────────────────────────────
router.post("/create", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Room name is required" });
    }

    // generate unique code
    let code, existing;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      existing = await Room.findOne({ code });
    } while (existing);

    const room = await Room.create({
      org_id: req.user.org_id,
      name: name.trim(),
      code,
      created_by: req.user.id,
    });

    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/rooms/join ────────────────────────────────────────────────────
router.post("/join", requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code?.trim()) {
      return res.status(400).json({ error: "Room code is required" });
    }

    const room = await Room.findOne({
      code: code.trim().toUpperCase(),
      org_id: req.user.org_id,
      is_active: true,
    });

    if (!room) return res.status(404).json({ error: "Room not found or inactive" });

    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/rooms ──────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const rooms = await Room.find({ org_id: req.user.org_id, is_active: true })
      .sort({ createdAt: -1 })
      .select("id name code createdAt created_by");

    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/rooms/:id/messages ─────────────────────────────────────────────
router.get("/:id/messages", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findOne({ _id: id, org_id: req.user.org_id });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const messages = await Message.find({ room_id: id }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/rooms/:id/ask ─────────────────────────────────────────────────
router.post("/:id/ask", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    const room = await Room.findOne({ _id: id, org_id: req.user.org_id, is_active: true });
    if (!room) return res.status(404).json({ error: "Room not found or inactive" });

    const isAiTriggered = question.trim().toLowerCase().startsWith("@ai ");
    const processedQuestion = isAiTriggered ? question.trim().substring(4).trim() : question.trim();

    const message = await Message.create({
      room_id: id,
      user_id: req.user.id,
      display_name: req.user.display_name,
      question: question.trim(),
      is_pending: isAiTriggered,
    });

    res.json({ message_id: message._id });

    if (isAiTriggered) {
      try {
        const result = await runRagPipeline(processedQuestion, id, req.user.org_id);

        await Message.findByIdAndUpdate(message._id, {
          answer: result.answer,
          sources: result.sources ?? [],
          conflicts: result.conflicts ?? [],
          timeline: result.timeline ?? [],
          crmTicket: result.crmTicket ?? null,
          is_pending: false,
        });
      } catch (err) {
        console.error("RAG pipeline error:", err);
        await Message.findByIdAndUpdate(message._id, {
          answer: "Something went wrong while generating an answer.",
          is_pending: false,
        });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/rooms/:id ───────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findOneAndUpdate(
      { _id: id, created_by: req.user.id },
      { is_active: false },
      { new: true }
    );

    if (!room) return res.status(404).json({ error: "Room not found or not authorized" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
