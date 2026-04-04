import express from "express";
import { runRagPipeline } from "../graph/ragGraph.js";
import { requireAuth } from "./rooms.route.js";

const router = express.Router();

router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "question is required" });

    const finalState = await runRagPipeline(question, "solo-" + (req.user?.id || "guest"), req.user?.org_id);

    res.json({
      answer: finalState.answer,
      sources: finalState.sources,
      conflicts: finalState.conflicts?.map((c) => c.explanation) ?? [],
      crmTicket: finalState.crmTicket ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
