import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
    {
        name: String,
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, default: "admin" },
        lastLogin: Date,
    },
    { timestamps: true }
);

// ✅ Hash password before save
adminSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// ✅ Compare password method
adminSchema.methods.matchPassword = function (entered) {
    return bcrypt.compare(entered, this.password);
};

export default mongoose.model("Admin", adminSchema);
