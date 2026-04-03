import fs from "fs";
import path from "path";
import { parsePDF } from "../ingestion/pdfParser.js";
import { parseExcel } from "../ingestion/excelParser.js";
import { parseEmail } from "../ingestion/emailParser.js";
import { ingestChunks } from "../ingestion/ingestPipeline.js";

const dataDir = "./data";
const files = fs.readdirSync(dataDir, { recursive: true });

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const ext = path.extname(file).toLowerCase();
  let chunks = [];

  try {
    if (ext === ".pdf") {
      chunks = await parsePDF(filePath);
    } else if (ext === ".xlsx" || ext === ".xls") {
      chunks = await parseExcel(filePath);
    } else if (ext === ".eml" || ext === ".txt") {
      chunks = await parseEmail(filePath);
    } else {
      continue;
    }

    if (chunks.length === 0) {
      console.log(`⚠️  ${file}: no chunks extracted, skipping`);
      continue;
    }

    await ingestChunks(chunks, file);
    console.log(`✅ ${file}: ${chunks.length} chunks stored`);
  } catch (err) {
    console.error(`❌ ${file}: ${err.message}`);
  }
}

console.log("All files seeded.");
