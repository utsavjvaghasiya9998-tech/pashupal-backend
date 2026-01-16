import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            lowercase: true,
        },
        phone: String,

        password: { type: String, required: true },

        role: {
            type: String,
            default: "customer"
        },

        address: String,

        totalMilkTaken: {
            type: Number,
            default: 0,
        },

        totalAmount: {
            type: Number,
            default: 0,
        },

        active: {
            type: Boolean,
            default: true,
        },

        // ✅ VERY IMPORTANT
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },
    },
    { timestamps: true }
);

// ✅ Hash password before save
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// ✅ Compare password method
userSchema.methods.matchPassword = function (entered) {
    return bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
