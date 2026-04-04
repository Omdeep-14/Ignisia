import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat.route.js";
import uploadRouter from "./routes/upload.route.js";
import roomsRouter from "./routes/rooms.route.js";
import authRouter from "./routes/auth.route.js";
import audioRouter from "./routes/audio.route.js";
import { connectDB } from "./config/config.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api", chatRouter);
app.use("/api", uploadRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/audio", audioRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
