import express from "express";
import multer from "multer";

const router = express.Router();
const upload = multer(); // Store in memory

/**
 * Speech-to-Text (STT) Transcription
 */
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });

    const response = await fetch("https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": req.file.mimetype,
      },
      body: req.file.buffer,
    });

    const data = await response.json();
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";

    res.json({ transcript });
  } catch (err) {
    console.error("STT Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Text-to-Speech (TTS) Generation
 */
router.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.err_msg || "Deepgram TTS failed");
    }

    // Set appropriate headers for the audio stream
    res.setHeader("Content-Type", "audio/mpeg");
    
    // Pipe the response body directly to the client
    const reader = response.body.getReader();
    const pump = () => reader.read().then(({ done, value }) => {
      if (done) return res.end();
      res.write(value);
      return pump();
    });
    pump();

  } catch (err) {
    console.error("TTS Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
