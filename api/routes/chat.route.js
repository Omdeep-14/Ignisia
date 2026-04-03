import express from "express";
import { ragAgent } from "../graph/ragGraph.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "question is required" });

    const finalState = await ragAgent.invoke({ question });

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
