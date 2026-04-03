import express from "express";
import multer from "multer";
import { ingestFromBucket } from "../ingestion/ingestPipeline.js";
import { supabase } from "../config/config.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { originalname, buffer, mimetype } = req.file;
    const ext = originalname.split(".").pop().toLowerCase();
    const allowed = ["pdf", "xlsx", "xls", "eml", "txt"];

    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: `Unsupported file type: .${ext}` });
    }

    // Upload to Supabase bucket
    const bucketPath = `uploads/${Date.now()}_${originalname}`;
    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(bucketPath, buffer, { contentType: mimetype });

    if (uploadError)
      throw new Error(`Bucket upload failed: ${uploadError.message}`);

    // Ingest from bucket into vector store
    const chunkCount = await ingestFromBucket(bucketPath);

    res.json({
      message: "File uploaded and ingested successfully",
      file: originalname,
      bucketPath,
      chunks: chunkCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
