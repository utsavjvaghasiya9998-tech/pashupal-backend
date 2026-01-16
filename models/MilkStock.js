import mongoose from "mongoose";

const milkStockSchema = new mongoose.Schema(
    {
        totalMilk: {
            type: Number,
            default: 0,
        },

        // ✅ VERY IMPORTANT
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
            unique: true, // one stock per admin
        },
    },
    { timestamps: true }
);

export default mongoose.model("MilkStock", milkStockSchema);
