import fs from "fs";
import path from "path";
import { simpleParser } from "mailparser";

function parseDateString(dateStr) {
  if (!dateStr) return "unknown";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "unknown";
  }
}

export async function parseEmail(filePath) {
  const raw = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  // mailparser handles both .eml (MIME) and plain .txt emails
  const parsed = await simpleParser(raw);

  const from = parsed.from?.text || "unknown";
  const to = parsed.to?.text || "unknown";
  const subject = parsed.subject || "(no subject)";
  const date = parseDateString(parsed.date);

  // Prefer plain text body; fall back to stripping HTML
  const body =
    parsed.text?.trim() || parsed.html?.replace(/<[^>]+>/g, " ").trim() || "";

  if (!body) return [];

  // Build a rich text block so the LLM has full context
  const text = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    `---`,
    body,
  ].join("\n");

  return [
    {
      text,
      source: fileName,
      from,
      to,
      subject,
      date,
      type: "email",
    },
  ];
}
