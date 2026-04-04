import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { ChatGroq } from "@langchain/groq";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { env } from "@huggingface/transformers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Override Transformers cache directory and disable native Node backend 
// to bypass Windows permission error (EACCES 13)
env.cacheDir = path.join(__dirname, "..", ".model_cache");
env.backends.onnx.node = false;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

import { MongoClient } from "mongodb";

// Configure DB Connection
export const client = new MongoClient(process.env.MONGO_URI);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await client.connect();
    console.log(`MongoDB & MongoClient Connected`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Expose vector collection
export const getVectorCollection = () => {
  return client.db("sme_docs").collection("vectors");
};

// Configure LLM
export const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.1,
});

// Configure Local Embeddings
export const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

