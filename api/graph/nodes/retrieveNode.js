import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { embeddings, getVectorCollection } from "../../config/config.js";

export async function retrieveNode(state) {
  const collection = getVectorCollection();
  
  const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: "vector_index", 
    textKey: "text",
    embeddingKey: "embedding",
  });

  // Number of results to fetch: Massive bump to 100 to encompass all chunks from all files natively
  const results = await vectorStore.similaritySearchWithScore(
    state.question,
    60
  );

  const chunks = results.map(([doc, score]) => ({
    text: doc.pageContent,
    metadata: doc.metadata,
    score,
  }));

  return { ...state, chunks };
}
