/**
 * AudioServices.js
 * Handles Microphone recording (STT) and Audio Playback (TTS)
 */

const API_BASE = "http://localhost:5000/api/audio";

let mediaRecorder = null;
let audioChunks = [];

/**
 * Start recording audio from the microphone
 */
export async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.start();
    return true;
  } catch (err) {
    console.error("Error starting recording:", err);
    return false;
  }
}

/**
 * Stop recording and get transcription
 */
export async function stopRecording() {
  return new Promise((resolve) => {
    if (!mediaRecorder) return resolve("");

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      try {
        const res = await fetch(`${API_BASE}/stt`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        resolve(data.transcript || "");
      } catch (err) {
        console.error("Transcription error:", err);
        resolve("");
      } finally {
        // Stop all tracks to release the microphone
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        mediaRecorder = null;
      }
    };

    mediaRecorder.stop();
  });
}

/**
 * Perform TTS and play audio
 */
export async function speakText(text) {
  try {
    const res = await fetch(`${API_BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error("TTS request failed");

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.play();
    });
  } catch (err) {
    console.error("TTS Error:", err);
  }
}
