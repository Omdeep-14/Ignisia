import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  display_name: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String },
  sources: { type: Array, default: [] },
  conflicts: { type: Array, default: [] },
  timeline: { type: Array, default: [] },
  crmTicket: { type: Object, default: null },
  is_pending: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
