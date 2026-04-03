import express from "express";
import { supabase } from "../config/config.js";
import { runRagPipeline } from "../graph/ragGraph.js";

const router = express.Router();

// ── Auth middleware ─────────────────────────────────────────────────────────
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return res.status(403).json({ error: "Profile not found" });
  }

  req.user = { ...user, ...profile };
  next();
}

// ── POST /api/rooms/create ──────────────────────────────────────────────────
router.post("/create", requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Room name is required" });
  }

  // generate unique code
  let code, existing;
  do {
    const { data } = await supabase.rpc("generate_room_code");
    code = data;
    const { data: check } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    existing = check;
  } while (existing);

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      org_id: req.user.org_id,
      name: name.trim(),
      code,
      created_by: req.user.id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ room });
});

// ── POST /api/rooms/join ────────────────────────────────────────────────────
router.post("/join", requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code?.trim()) {
    return res.status(400).json({ error: "Room code is required" });
  }

  const { data: room, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("org_id", req.user.org_id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!room)
    return res.status(404).json({ error: "Room not found or inactive" });

  res.json({ room });
});

// ── GET /api/rooms ──────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, name, code, created_at, created_by")
    .eq("org_id", req.user.org_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ rooms });
});

// ── GET /api/rooms/:id/messages ─────────────────────────────────────────────
router.get("/:id/messages", requireAuth, async (req, res) => {
  const { id } = req.params;

  // verify room belongs to user's org
  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", id)
    .eq("org_id", req.user.org_id)
    .maybeSingle();

  if (!room) return res.status(404).json({ error: "Room not found" });

  const { data: messages, error } = await supabase
    .from("room_messages")
    .select("*")
    .eq("room_id", id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ messages });
});

// ── POST /api/rooms/:id/ask ─────────────────────────────────────────────────
router.post("/:id/ask", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { question } = req.body;

  if (!question?.trim()) {
    return res.status(400).json({ error: "Question is required" });
  }

  // verify room belongs to user's org
  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", id)
    .eq("org_id", req.user.org_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!room)
    return res.status(404).json({ error: "Room not found or inactive" });

  // insert pending message immediately — triggers Realtime for all members
  const { data: message, error: insertError } = await supabase
    .from("room_messages")
    .insert({
      room_id: id,
      user_id: req.user.id,
      display_name: req.user.display_name,
      question: question.trim(),
      is_pending: true,
    })
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  // respond immediately so the client isn't waiting
  res.json({ message_id: message.id });

  // run RAG pipeline in background
  try {
    const result = await runRagPipeline(question.trim());

    await supabase
      .from("room_messages")
      .update({
        answer: result.answer,
        sources: result.sources ?? [],
        conflicts: result.conflicts ?? [],
        timeline: result.timeline ?? [],
        is_pending: false,
      })
      .eq("id", message.id);
  } catch (err) {
    console.error("RAG pipeline error:", err);
    await supabase
      .from("room_messages")
      .update({
        answer: "Something went wrong while generating an answer.",
        is_pending: false,
      })
      .eq("id", message.id);
  }
});

// ── DELETE /api/rooms/:id ───────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("rooms")
    .update({ is_active: false })
    .eq("id", id)
    .eq("created_by", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
