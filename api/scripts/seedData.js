import "dotenv/config";
import { supabase } from "../config/config.js";
import { ingestFromBucket } from "../ingestion/ingestPipeline.js";
import fs from "fs";
import path from "path";

const DATA_DIR = "./data";
const BUCKET = process.env.SUPABASE_BUCKET;

const files = fs
  .readdirSync(DATA_DIR, { recursive: true })
  .filter((f) => [".pdf", ".xlsx", ".eml", ".txt"].includes(path.extname(f)));

for (const file of files) {
  const localPath = path.join(DATA_DIR, file);
  const bucketPath = `uploads/${path.basename(file)}`;

  // Upload to Supabase bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(bucketPath, fs.readFileSync(localPath), { upsert: true });

  if (uploadError) {
    console.error(`Upload failed for ${file}:`, uploadError.message);
    continue;
  }

  // Ingest from bucket into pgvector
  await ingestFromBucket(bucketPath);
  console.log(`Done: ${file}`);
}

console.log("All files seeded.");
