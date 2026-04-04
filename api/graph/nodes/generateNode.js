import { llm } from "../../config/config.js";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

export async function generateNode(state) {
  const { question, chunks, conflicts, messages } = state;

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

  const systemPrompt = `You are a precise knowledge assistant for an SME.
Rules:
- Answer ONLY from the provided context. Never guess.
- Always end your answer with: "Sources: [list the file names and page/row numbers you used]".
- If a conflict was detected, YOU MUST EXPLICITLY REASON about which source is newer, why you are prioritizing it, and explain the conflict to the user BEFORE returning the final answer. NEVER silently return just one answer without explaining the conflict.
- Be concise and direct, except when explaining conflicts where you must be thorough.

## GRAPHING VISUALIZATION
If the user explicitly asks for a graph, trend, or chart (e.g., "show me trend of sales", "plot a bar graph"), you MUST extract the relevant tabular data from the context and append a strictly valid JSON block enclosed EXACTLY in <chart>...</chart> tags at the end of your response. 
The JSON must follow this exact schema:
{
  "chartType": "bar" | "line" | "scatter", 
  "title": "Title of the chart",
  "data": [ {"label": "X-axis value", "value": 123.45} ]
}
Example:
The sales are as follows.
<chart>
{"chartType":"bar","title":"Sales 2023","data":[{"label":"Jan","value":400},{"label":"Feb","value":300}]}
</chart>
Sources: sales.xlsx`;

  // Filter messages to prevent context window explosion (keep last 6)
  const history = (messages || []).slice(-6);

  const newHumanMessage = new HumanMessage(
    `CONTEXT:\n${context}${conflictWarning}\n\nQUESTION: ${question}`,
  );

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...history,
    newHumanMessage,
  ]);

  const answer = response.content;
  
  // Save clean conversational history without the massive RAG chunk payloads
  const cleanHumanMessage = new HumanMessage(question);
  const newAiMessage = new AIMessage(answer);

  const sources = chunks.map((c) => ({
    source: c.metadata.source,
    type: c.metadata.type,
    date: c.metadata.date,
    page: c.metadata.page || null,
    row: c.metadata.row || null,
    subject: c.metadata.subject || null,
  }));

  return { ...state, answer, sources, messages: [cleanHumanMessage, newAiMessage] };
}
