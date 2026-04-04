import express from "express";
import multer from "multer";
import { ingestFromBuffer } from "../ingestion/ingestPipeline.js";
import { cloudinary } from "../config/config.js";
import { requireAuth } from "./rooms.route.js";
import streamifier from "streamifier";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { originalname, buffer, mimetype } = req.file;
    const ext = originalname.split(".").pop().toLowerCase();
    const allowed = ["pdf", "xlsx", "xls", "eml", "txt"];

    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: `Unsupported file type: .${ext}` });
    }

    // 1. Upload to Cloudinary
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const publicId = originalname;
        const targetFolder = `sme-documents/${req.user.org_id}`;
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          { resource_type: "raw", folder: targetFolder, use_filename: true, unique_filename: false, public_id: publicId },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(cld_upload_stream);
      });
    };

    const cloudinaryResult = await uploadToCloudinary();

    // 2. Ingest from memory buffer directly for speed (avoid downloading back from Cloudinary)
    const chunkCount = await ingestFromBuffer(buffer, originalname, cloudinaryResult.secure_url, req.user.org_id);

    res.json({
      message: "File uploaded and ingested successfully",
      file: originalname,
      url: cloudinaryResult.secure_url,
      chunks: chunkCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/uploads/list ──────────────────────────────────────────────────
router.get("/uploads/list", requireAuth, async (req, res) => {
  try {
    // Fetch legacy unstructured files AND explicitly the user's isolated org folder
    const searchResult = await cloudinary.search
      .expression(`folder:sme-documents OR folder:sme-documents/${req.user.org_id}`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const files = searchResult.resources.map(f => ({
      name: f.public_id.split('/').pop(),
      path: f.public_id,
      size: f.bytes,
      created_at: f.created_at,
      url: f.secure_url,
    }));

    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
