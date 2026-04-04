import { embeddings, getVectorCollection } from "../config/config.js";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { parsePDF } from "./pdfParser.js";
import { parseExcel } from "./excelParser.js";
import { parseEmail } from "./emailParser.js";
import { writeFileSync, unlinkSync } from "fs";
import path from "path";
import os from "os";

const PARSERS = {
  ".pdf": parsePDF,
  ".xlsx": parseExcel,
  ".xls": parseExcel,
  ".eml": parseEmail,
  ".txt": parseEmail,
};

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

async function buildDocuments(rawChunks, extraMeta = {}) {
  const documents = [];

  for (const chunk of rawChunks) {
    const metadata = {
      source: chunk.source,
      type: chunk.type,
      date: chunk.date,
      page: chunk.page ?? null,
      row: chunk.row ?? null,
      sheet: chunk.sheet ?? null,
      from: chunk.from ?? null,
      subject: chunk.subject ?? null,
      ...extraMeta,
    };

    if (chunk.type === "excel" || chunk.type === "email") {
      documents.push(
        new Document({
          pageContent: chunk.text,
          metadata,
        }),
      );
    } else {
      const subDocs = await splitter.createDocuments([chunk.text], [metadata]);
      documents.push(...subDocs);
    }
  }

  return documents;
}

async function storeDocuments(documents) {
  const collection = getVectorCollection();
  await MongoDBAtlasVectorSearch.fromDocuments(documents, embeddings, {
    collection,
    indexName: "vector_index", // Must match the index name in Atlas
    textKey: "text",
    embeddingKey: "embedding",
  });
}

// ─── ingestFromBuffer: used by API upload route ──────────────────────────────
export async function ingestFromBuffer(buffer, originalname, cloudUrl, orgId) {
  const ext = path.extname(originalname).toLowerCase();
  const parser = PARSERS[ext];
  if (!parser) throw new Error(`No parser for extension: ${ext}`);

  const tmpPath = path.join(os.tmpdir(), `${Date.now()}_${originalname}`);
  writeFileSync(tmpPath, buffer);

  const rawChunks = await parser(tmpPath);
  unlinkSync(tmpPath); // cleanup temp file

  const documents = await buildDocuments(rawChunks, {
    url: cloudUrl,
    filename: originalname,
    org_id: orgId
  });
  await storeDocuments(documents);

  console.log(`[ingest] ${originalname}: ${documents.length} chunks stored`);
  return documents.length;
}

// ─── ingestLocalFile: convenience wrapper for local files ─────────────────────
export async function ingestLocalFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const parser = PARSERS[ext];
  if (!parser) throw new Error(`No parser for extension: ${ext}`);

  const rawChunks = await parser(filePath);

  if (rawChunks.length === 0) {
    console.log(`⚠️  ${fileName}: no chunks extracted`);
    return 0;
  }

  const documents = await buildDocuments(rawChunks);
  await storeDocuments(documents);

  console.log(`[ingest] ${fileName}: ${documents.length} chunks stored`);
  return documents.length;
}
