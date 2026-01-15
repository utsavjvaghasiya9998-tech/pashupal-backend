import mongoose from "mongoose";

const milkSaleSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        date: {
            type: Date,
            default: Date.now,
        },

        quantity: {
            type: Number, // liters
        },
        morningYield: Number,
        eveningYield: Number,
        pricePerLiter: {
            type: Number,
            required: true,
        },

        totalPrice: {
            type: Number,
        },

        givenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker", // or Admin
        },

        paymentStatus: {
            type: String,
            enum: ["paid", "unpaid"],
            default: "paid",
        },
    },
    { timestamps: true }
);

export default mongoose.model("MilkSale", milkSaleSchema);
