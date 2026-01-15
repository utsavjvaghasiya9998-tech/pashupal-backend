import mongoose from "mongoose";

const milkStockSchema = new mongoose.Schema(
    {
        totalMilk: {
            type: Number,
            default: 0, // liters
        },
    },
    { timestamps: true }
);

export default mongoose.model("MilkStock", milkStockSchema);
