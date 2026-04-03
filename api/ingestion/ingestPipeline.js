import { supabase, embeddings } from "../config/config.js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
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

// ─── helper: turn raw parser chunks → LangChain Documents ───────────────────
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

    // Excel rows and emails are atomic — never split them further
    if (chunk.type === "excel" || chunk.type === "email") {
      documents.push(
        new Document({
          pageContent: chunk.text,
          metadata,
        }),
      );
    } else {
      // PDFs get split into smaller overlapping chunks
      const subDocs = await splitter.createDocuments([chunk.text], [metadata]);
      documents.push(...subDocs);
    }
  }

  return documents;
}

// ─── helper: embed + store in Supabase ──────────────────────────────────────
async function storeDocuments(documents) {
  await SupabaseVectorStore.fromDocuments(documents, embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  });
}

// ─── ingestFromBucket: used by API upload route ──────────────────────────────
export async function ingestFromBucket(bucketFilePath) {
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .download(bucketFilePath);

  if (error) throw new Error(`Bucket download failed: ${error.message}`);

  const fileName = path.basename(bucketFilePath);
  const ext = path.extname(fileName).toLowerCase();
  const parser = PARSERS[ext];
  if (!parser) throw new Error(`No parser for extension: ${ext}`);

  const tmpPath = path.join(os.tmpdir(), fileName);
  const arrayBuffer = await data.arrayBuffer();
  writeFileSync(tmpPath, Buffer.from(arrayBuffer));

  const rawChunks = await parser(tmpPath);
  unlinkSync(tmpPath);

  const documents = await buildDocuments(rawChunks, {
    bucketPath: bucketFilePath,
  });
  await storeDocuments(documents);

  console.log(`[ingest] ${fileName}: ${documents.length} chunks stored`);
  return documents.length;
}

// ─── ingestChunks: used by seedData.js for local files ───────────────────────
export async function ingestChunks(rawChunks, fileName) {
  const documents = await buildDocuments(rawChunks);
  await storeDocuments(documents);

  console.log(`[ingest] ${fileName}: ${documents.length} chunks stored`);
  return documents.length;
}

// ─── ingestLocalFile: convenience wrapper for a single local file path ───────
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
