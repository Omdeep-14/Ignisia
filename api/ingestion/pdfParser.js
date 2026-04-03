import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function extractDateFromText(text) {
  const patterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b([A-Za-z]+ \d{1,2},?\s+\d{4})\b/,
  ];
  const sample = text.slice(0, 1000);
  for (const pattern of patterns) {
    const match = sample.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function parsePDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const uint8Array = new Uint8Array(dataBuffer);

    const pdf = await pdfjsLib.getDocument({
      data: uint8Array,
      standardFontDataUrl: new URL(
        "../node_modules/pdfjs-dist/standard_fonts/",
        import.meta.url,
      ).href,
    }).promise;

    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      if (pageText.trim().length > 0) pages.push({ pageText, pageNum: i });
    }

    const fileName = path.basename(filePath);

    return pages.map(({ pageText, pageNum }) => ({
      text: pageText.trim(),
      source: fileName,
      page: pageNum,
      totalPages: pdf.numPages,
      date: extractDateFromText(pageText) || "unknown",
      type: "pdf",
    }));
  } catch (error) {
    console.error("❌ PDF parsing failed:", error.message);
    throw new Error("Failed to parse PDF");
  }
}
