import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat.route.js";
import uploadRouter from "./routes/upload.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", chatRouter);
app.use("/api", uploadRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
