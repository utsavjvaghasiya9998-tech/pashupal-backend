import mongoose from "mongoose";

const animalSchema = new mongoose.Schema(
  {
    tagId: {
      type: String,
      required: true,
      trim: true,
    },

    breed: {
      type: String,
      trim: true,
    },

    species: {
      type: String,
      enum: ["buffalo", "cow"],
      required: true,
    },

    age: {
      type: Number,
      min: 0,
    },

    purchaseDate: Date,

    isPregnant: {
      type: Boolean,
      default: false,
    },

    healthStatus: {
      type: String,
      enum: ["healthy", "sick", "recovering"],
      default: "healthy",
    },

    currentStatus: {
      type: String,
      enum: ["active", "sold", "dead"],
      default: "active",
    },

    profileImageUrl: String,

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

export default mongoose.model("Animal", animalSchema);
