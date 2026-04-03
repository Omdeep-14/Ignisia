import { llm } from "../../config/config.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function generateNode(state) {
  const { question, chunks, conflicts } = state;

  const context = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1} | file: ${c.metadata.source} | type: ${c.metadata.type} | date: ${c.metadata.date}${c.metadata.page ? " | page: " + c.metadata.page : ""}${c.metadata.row ? " | row: " + c.metadata.row : ""}]\n${c.text}`,
    )
    .join("\n\n---\n\n");

  const conflictWarning =
    conflicts.length > 0
      ? `\n\n⚠️ CONFLICTS DETECTED:\n${conflicts.map((c) => c.explanation).join("\n")}\nTrust only the newer sources listed above.`
      : "";

  const response = await llm.invoke([
    new SystemMessage(`You are a precise knowledge assistant for an SME.
Rules:
- Answer ONLY from the provided context. Never guess.
- Always end your answer with: "Sources: [list the file names and page/row numbers you used]"
- If a conflict was detected, explain it clearly to the user before giving the answer.
- Be concise and direct.`),
    new HumanMessage(
      `CONTEXT:\n${context}${conflictWarning}\n\nQUESTION: ${question}`,
    ),
  ]);

  const answer = response.content;

  const sources = chunks.map((c) => ({
    source: c.metadata.source,
    type: c.metadata.type,
    date: c.metadata.date,
    page: c.metadata.page || null,
    row: c.metadata.row || null,
    subject: c.metadata.subject || null,
  }));

  return { ...state, answer, sources };
}
