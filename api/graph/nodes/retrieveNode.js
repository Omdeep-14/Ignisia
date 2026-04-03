import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { supabase, embeddings } from "../../config/config.js";

export async function retrieveNode(state) {
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  });

  const results = await vectorStore.similaritySearchWithScore(
    state.question,
    10,
  );

  const chunks = results.map(([doc, score]) => ({
    text: doc.pageContent,
    metadata: doc.metadata,
    score,
  }));

  return { ...state, chunks };
}
