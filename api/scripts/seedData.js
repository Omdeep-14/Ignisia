import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parsePDF } from "../ingestion/pdfParser.js";
import { parseExcel } from "../ingestion/excelParser.js";
import { parseEmail } from "../ingestion/emailParser.js";
import { ingestChunks } from "../ingestion/ingestPipeline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");

console.log(`📂 Looking in: ${dataDir}`);

const files = fs.readdirSync(dataDir).filter((f) => {
  const ext = path.extname(f).toLowerCase();
  return [".pdf", ".xlsx", ".xls", ".eml", ".txt"].includes(ext);
});

console.log(`📄 Found files:`, files);

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const ext = path.extname(file).toLowerCase();
  let chunks = [];

  try {
    console.log(`\n⏳ Parsing ${file}...`);

    if (ext === ".pdf") {
      chunks = await parsePDF(filePath);
    } else if (ext === ".xlsx" || ext === ".xls") {
      chunks = await parseExcel(filePath);
    } else if (ext === ".eml" || ext === ".txt") {
      chunks = await parseEmail(filePath);
    }

    console.log(`   → ${chunks.length} chunks extracted`);

    if (chunks.length === 0) {
      console.log(`⚠️  ${file}: no chunks, skipping`);
      continue;
    }

    await ingestChunks(chunks, file);
    console.log(`✅ ${file}: stored`);
  } catch (err) {
    console.error(`❌ ${file} FAILED:`, err); // full error not just message
  }
}

console.log("\n🎉 Done.");
