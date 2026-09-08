const mongoose = require("mongoose");

const fpoProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // the FPO's own login account (admin/representative of the FPO)
    },

    // --- Identity ---
    fpoName: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true, // CIN / registration number under Companies Act or Co-operative Societies Act
    },
    registrationType: {
      type: String,
      enum: ["Producer Company", "Cooperative Society", "Trust", "Section 8 Company"],
      required: true,
    },
    dateOfIncorporation: {
      type: Date,
    },

    // --- Contact & Location ---
    address: {
      village: { type: String, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    location: {
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
    contactPersonName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPersonDesignation: {
      type: String, // e.g. CEO, Board Member, Secretary
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },

    // --- Membership (the aggregation core of an FPO) ---
    memberFarmers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FarmerProfile",
      },
    ],
    totalMemberCount: {
      type: Number,
      default: 0, // kept denormalized; sync with memberFarmers.length via service on add/remove
    },

    // --- Aggregated Produce Info ---
    cropsHandled: [
      {
        cropName: { type: String, required: true, trim: true },
        estimatedAggregateVolumePerSeason: { type: Number, min: 0 }, // in quintals
      },
    ],
    storageCapacityInMT: {
      type: Number,
      default: 0, // metric tonnes — relevant for "sale-window recommendation" logic
    },
    hasColdStorage: {
      type: Boolean,
      default: false,
    },
    hasOwnTransport: {
      type: Boolean,
      default: false,
    },

    // --- Verification & Trust ---
    kycDocuments: {
      registrationCertificateUrl: { type: String, trim: true }, // Cloudinary URL
      panCardUrl: { type: String, trim: true },
      boardResolutionUrl: { type: String, trim: true }, // authorizing rep to transact on FPO's behalf
    },
    isVerified: {
      type: Boolean,
      default: false, // set true by Admin after document review
    },

    // --- Banking (for pooled payouts to FPO, then internal distribution) ---
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },

    // --- Platform stats (denormalized for dashboard reads) ---
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

// Geospatial index — "buyers near this FPO" / "FPOs near this mandi"
fpoProfileSchema.index({ location: "2dsphere" });

// Admin verification queue lookups
fpoProfileSchema.index({ isVerified: 1 });

module.exports = mongoose.model("FPOProfile", fpoProfileSchema);