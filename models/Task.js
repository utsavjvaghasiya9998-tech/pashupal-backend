import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    type: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
