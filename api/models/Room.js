import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  org_id: { type: String, required: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);
