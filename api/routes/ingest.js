import express from "express";
import { ingestFromBucket } from "../ingestion/ingestPipeline.js";

const router = express.Router();

// Called after a file is uploaded to the Supabase bucket
// body: { filePath: "uploads/pricing_sheet.xlsx" }
router.post("/ingest", async (req, res) => {
  try {
    const { filePath } = req.body;
    const count = await ingestFromBucket(filePath);
    res.json({ success: true, chunksStored: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
