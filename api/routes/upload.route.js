import express from "express";
import multer from "multer";
import { ingestFromBucket } from "../ingestion/ingestPipeline.js";
import { supabase } from "../config/config.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── POST /api/upload ────────────────────────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { originalname, buffer, mimetype } = req.file;
    const ext = originalname.split(".").pop().toLowerCase();
    const allowed = ["pdf", "xlsx", "xls", "eml", "txt"];

    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: `Unsupported file type: .${ext}` });
    }

    const bucketPath = `uploads/${Date.now()}_${originalname}`;
    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(bucketPath, buffer, { contentType: mimetype });

    if (uploadError)
      throw new Error(`Bucket upload failed: ${uploadError.message}`);

    const chunkCount = await ingestFromBucket(bucketPath);

    res.json({
      message: "File uploaded and ingested successfully",
      file: originalname,
      bucketPath,
      chunks: chunkCount,
    });
  } catch (err) {
    console.error("[upload] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/uploads/list ───────────────────────────────────────────────────
router.get("/uploads/list", async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .list("uploads", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) throw new Error(error.message);

    const files = (data ?? []).map((f) => {
      const { data: urlData } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(`uploads/${f.name}`);
      return {
        name: f.name.replace(/^\d+_/, ""),
        path: `uploads/${f.name}`,
        size: f.metadata?.size ?? 0,
        created_at: f.created_at,
        url: urlData.publicUrl,
      };
    });

    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
