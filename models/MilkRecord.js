import mongoose from "mongoose";

const milkRecordSchema = new mongoose.Schema(
    {
        animal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Animal", required: true
        },

        date: {
            type: Date,
            required: true,
            default: () => new Date().setHours(0, 0, 0, 0),
        },
        morningYield: Number,
        eveningYield: Number,
        totalYield: Number,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker"
        },
        remarks: String,
    },
    { timestamps: true }
);

export default mongoose.model("MilkRecord", milkRecordSchema);
