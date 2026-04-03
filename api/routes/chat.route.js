import express from "express";
import { ragAgent } from "../graph/ragGraph.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: "question is required" });
    }

    console.log(`[chat] question: "${question}"`);

    const finalState = await ragAgent.invoke({ question: question.trim() });

    console.log(`[chat] done`);

    res.json({
      answer: finalState.answer,
      sources: finalState.sources ?? [],
      conflicts: finalState.conflicts?.map((c) => c.explanation) ?? [],
      timeline: finalState.timeline ?? [],
    });
  } catch (err) {
    console.error("[chat] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
