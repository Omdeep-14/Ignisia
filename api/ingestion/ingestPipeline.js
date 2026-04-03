import { supabase, embeddings } from "../config/config.js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
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

export async function ingestFromBucket(bucketFilePath) {
  // 1. Download file bytes from Supabase bucket
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .download(bucketFilePath);

  if (error) throw new Error(`Bucket download failed: ${error.message}`);

  const fileName = path.basename(bucketFilePath);
  const ext = path.extname(fileName).toLowerCase();
  const parser = PARSERS[ext];
  if (!parser) throw new Error(`No parser for extension: ${ext}`);

  // 2. Write to a temp file (parsers need a file path)
  const tmpPath = path.join(os.tmpdir(), fileName);
  const arrayBuffer = await data.arrayBuffer();
  writeFileSync(tmpPath, Buffer.from(arrayBuffer));

  // 3. Parse → raw chunks with metadata
  const rawChunks = await parser(tmpPath);
  unlinkSync(tmpPath); // clean up temp file

  // 4. Split each chunk further using LangChain splitter
  const documents = [];
  for (const chunk of rawChunks) {
    const subDocs = await splitter.createDocuments(
      [chunk.text],
      [
        {
          // metadata carried on every sub-chunk
          source: chunk.source,
          type: chunk.type,
          date: chunk.date,
          page: chunk.page ?? null,
          row: chunk.row ?? null,
          sheet: chunk.sheet ?? null,
          from: chunk.from ?? null,
          subject: chunk.subject ?? null,
          bucketPath: bucketFilePath,
        },
      ],
    );
    documents.push(...subDocs);
  }

  // 5. Embed + store in Supabase pgvector via LangChain
  await SupabaseVectorStore.fromDocuments(documents, embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  });

  console.log(`[ingest] ${fileName}: ${documents.length} chunks stored`);
  return documents.length;
}
