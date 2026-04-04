import { llm } from "../../config/config.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export async function crmNode(state) {
  const { question, answer, conflicts } = state;

  const prompt = `You are an automated CRM assistant attached to a document intelligence system. 
Based on the user's query and the assistant's answer, autonomously auto-fill a Support Ticket form.
Return EXACTLY a raw JSON object with NO markdown wrapping formatting. Do not use markdown blocks. Just raw JSON.
Schema:
{
  "issue": "Brief description of the client or user's core issue/query",
  "context": "Relevant context summarized from the provided answer",
  "resolution": "The suggested resolution, answer, or next step deduced"
}

Query: ${question}
Answer: ${answer}`;

  try {
    const response = await llm.invoke([
      new SystemMessage(prompt)
    ]);
    
    let text = response.content;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) text = match[0];
    const data = JSON.parse(text);

    const crmTicket = {
      id: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      issue: data.issue || "Client Inquiry",
      context: data.context || "Document intelligence triggered",
      resolution: data.resolution || "Provided extracted information",
      hasConflict: conflicts && conflicts.length > 0,
      status: "Auto-Resolved",
    };

    return { ...state, crmTicket };
  } catch (e) {
    console.error("CRM LLM parse error:", e);
    const crmTicket = {
      id: `TKT-ERR`,
      createdAt: new Date().toISOString(),
      issue: question,
      context: "LLM Parsing Failure",
      resolution: "Check server logs",
      hasConflict: false,
      status: "Failed",
    };
    return { ...state, crmTicket };
  }
}
