import { StateGraph, END, MemorySaver } from "@langchain/langgraph";
import { retrieveNode } from "./nodes/retrieveNode.js";
import { conflictNode } from "./nodes/conflictNode.js";
import { generateNode } from "./nodes/generateNode.js";
import { crmNode } from "./nodes/crmNode.js";
import { defaultState } from "./state.js";

const graph = new StateGraph({ channels: defaultState });

graph.addNode("retrieve", retrieveNode);
graph.addNode("conflict", conflictNode);
graph.addNode("generate", generateNode);
graph.addNode("crm", crmNode);

graph.setEntryPoint("retrieve");
graph.addEdge("retrieve", "conflict");
graph.addEdge("conflict", "generate");
graph.addEdge("generate", "crm");
graph.addEdge("crm", END);

const memory = new MemorySaver();
export const ragAgent = graph.compile({ checkpointer: memory });

export async function runRagPipeline(question, threadId = "default-thread", orgId = null) {
  const result = await ragAgent.invoke(
    { question, org_id: orgId },
    { configurable: { thread_id: threadId } }
  );
  
  // Save human message and assistant message back to state manually if we don't do it inside nodes:
  // We'll actually do message appending inside generateNode so we have full control.
  
  return {
    answer: result.answer,
    sources: result.sources,
    conflicts: result.conflicts,
    timeline: result.timeline ?? [],
    crmTicket: result.crmTicket ?? null,
  };
}
