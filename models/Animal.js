import mongoose from "mongoose";
const animalSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      // required: true,
    },

    tagId: {
      type: String,
      required: true,
      unique: true, // Ear tag or QR code ID
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

    purchaseDate: {
      type: Date,
    },

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

    profileImageUrl: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true, // ✅ creates createdAt & updatedAt automatically
  }
);
export default mongoose.model("Animal", animalSchema);
