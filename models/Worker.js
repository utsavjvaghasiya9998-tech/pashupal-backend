    import mongoose from "mongoose";
    import bcrypt from "bcryptjs";

    const workerSchema = new mongoose.Schema(
        {
            name: String,

            email: {
                type: String,
                required: true,
            },

            phone: String,

            password: {
                type: String,
                required: true,
            },

            address: String,

            assignedAnimals: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Animal",
                },
            ],

            assignedTask: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Task",
            },

            status: {
                type: String,
                default: "inactive",
            },

            role: {
                type: String,
                default: "worker",
            },

            joinedDate: Date,

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

    // ✅ Hash password before save
    workerSchema.pre("save", async function () {
        if (!this.isModified("password")) return;
        this.password = await bcrypt.hash(this.password, 10);
    });

    // ✅ Compare password method
    workerSchema.methods.matchPassword = function (entered) {
        return bcrypt.compare(entered, this.password);
    };

    export default mongoose.model("Worker", workerSchema);
