import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

function rowToText(headers, values) {
  return headers
    .map((h, i) => `${h}: ${values[i] ?? ""}`)
    .filter((pair) => !pair.endsWith(": "))
    .join(" | ");
}

function getFileDateModified(filePath) {
  const stat = fs.statSync(filePath);
  return stat.mtime.toISOString().split("T")[0]; // "2024-03-15"
}

export async function parseExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const fileName = path.basename(filePath);
  const fileDate = getFileDateModified(filePath);
  const chunks = [];

  workbook.eachSheet((worksheet, sheetId) => {
    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      rows.push({ rowNumber, values: row.values.slice(1) }); // slice(1) removes ExcelJS's 1-based index
    });

    if (rows.length < 2) return; // need at least header + 1 data row

    // First row = headers
    const headers = rows[0].values.map((h) => String(h ?? "").trim());

    // Each subsequent row becomes a chunk
    for (let i = 1; i < rows.length; i++) {
      const { rowNumber, values } = rows[i];
      const text = rowToText(
        headers,
        values.map((v) => String(v ?? "").trim()),
      );

      if (!text.trim()) continue;

      chunks.push({
        text,
        source: fileName,
        sheet: worksheet.name,
        row: rowNumber,
        date: fileDate,
        type: "excel",
      });
    }
  });

  return chunks;
}
