const mongoose = require("mongoose");

const farmerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per user
    },

    // --- Identity & Location ---
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      village: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    location: {
      // for "nearby markets" / distance-based matching later
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // --- Farm Details ---
    landSizeInAcres: {
      type: Number,
      required: true,
      min: 0,
    },
    cropsGrown: [
      {
        cropName: { type: String, required: true, trim: true },
        variety: { type: String, trim: true },
        season: {
          type: String,
          enum: ["Kharif", "Rabi", "Zaid", "Perennial"],
        },
        averageYieldPerAcre: { type: Number, min: 0 }, // in quintals, optional
      },
    ],

    // --- FPO linkage (optional — farmer may or may not belong to one) ---
    isPartOfFPO: {
      type: Boolean,
      default: false,
    },
    fpoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FPOProfile",
      default: null,
    },

    // --- Verification & Trust ---
    kycDocuments: {
      aadhaarNumber: { type: String, trim: true }, // consider encrypting/masking before storing
      landRecordUrl: { type: String, trim: true }, // Cloudinary URL
    },
    isVerified: {
      type: Boolean,
      default: false, // set true by Admin after document review
    },

    // --- Banking (for payment tracking/payouts) ---
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },

    // --- Platform stats (denormalized for quick dashboard reads) ---
    totalLotsCreated: {
      type: Number,
      default: 0,
    },
    totalTransactionsCompleted: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

// Geospatial index for "nearby buyers/mandis" queries
farmerProfileSchema.index({ location: "2dsphere" });

// Helpful for admin filtering by verification status
farmerProfileSchema.index({ isVerified: 1 });

module.exports = mongoose.model("FarmerProfile", farmerProfileSchema);