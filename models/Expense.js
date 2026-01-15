import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["feed", "medicine", "cleaning", "other"],
        required: true,
    },

    // animal: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Animal",
    //     required: false, // some expenses may be general
    // },

    title: {
        type: String,
        // required: true,
    },

    amount: {
        type: Number,
        required: true,
    },

    date: {
        type: Date,
        default: Date.now,
    },

    notes: String,

    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
},
    { timestamps: true }
)
export default mongoose.model('Expense', expenseSchema);