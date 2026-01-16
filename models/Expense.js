import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["feed", "medicine", "cleaning", "other"],
            required: true,
        },

        title: String,

        amount: {
            type: Number,
            required: true,
        },

        date: {
            type: Date,
            default: Date.now,
        },

        notes: String,

        // ✅ VERY IMPORTANT
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
