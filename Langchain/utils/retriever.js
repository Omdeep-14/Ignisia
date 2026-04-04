import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import { createClient } from "@supabase/supabase-js"

const embeddings = new HuggingFaceTransformersEmbeddings({ modelName: "Xenova/all-MiniLM-L6-v2" })
const sbApiKey = process.env.SUPABASE_API_KEY   
const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT
const client = createClient(sbUrl , sbApiKey)

const vectorStore = new SupabaseVectorStore(embeddings , {
    client,
    tableName : 'documents',
    queryName : 'match_documents'
})

const retriever = vectorStore.asRetriever() 

export {retriever}