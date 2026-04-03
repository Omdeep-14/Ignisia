import { StateGraph, END } from "@langchain/langgraph";
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

export const ragAgent = graph.compile();

export async function runRagPipeline(question) {
  const result = await graph.invoke({ question });
  return {
    answer: result.answer,
    sources: result.sources,
    conflicts: result.conflicts,
    timeline: result.timeline ?? [],
  };
}
