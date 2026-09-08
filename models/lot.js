// ===================== models/lot.js =====================
const mongoose = require("mongoose");

const lotSchema = new mongoose.Schema(
  {
    // --- Seller (polymorphic: Farmer or FPO, same pattern as Transaction.sellerId) ---
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "sellerType",
    },
    sellerType: {
      type: String,
      required: true,
      enum: ["FarmerProfile", "FPOProfile"],
    },

    // --- Produce Details ---
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    variety: {
      type: String,
      trim: true,
    },
    qualityGrade: {
      type: String,
      enum: ["Grade A", "Grade B", "Grade C"],
      required: true,
    },
    quantityInQuintals: {
      type: Number,
      required: true,
      min: 0,
    },
    quantityRemainingInQuintals: {
      type: Number, // decrements as partial offers get accepted; starts equal to quantityInQuintals
      required: true,
      min: 0,
    },

    // --- Pricing ---
    askingPricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    isNegotiable: {
      type: Boolean,
      default: true,
    },
    suggestedPriceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MandiPrice",
      default: null, // nearest mandi's modal price at time of listing, shown to seller as a benchmark
    },

    // --- Location (pickup point — feeds LogisticsProfile distance matching) ---
    pickupLocation: {
      village: { type: String, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, trim: true },
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

    // --- Harvest / Availability Window ---
    harvestDate: {
      type: Date,
    },
    availableFromDate: {
      type: Date,
      required: true,
    },
    listingExpiryDate: {
      type: Date, // lot auto-closes to new offers after this date
      required: true,
    },

    // --- Media ---
    images: [
      {
        type: String, // Cloudinary URLs
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
    },

    // --- Lifecycle ---
    status: {
      type: String,
      enum: ["Draft", "Active", "Partially Sold", "Sold Out", "Expired", "Cancelled"],
      default: "Draft",
    },

    // --- Denormalized stats (cheap dashboard reads) ---
    totalOffersReceived: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Buyer-facing browse/search: active lots for a crop, newest first
lotSchema.index({ cropName: 1, status: 1, createdAt: -1 });

// Seller dashboard: "my lots"
lotSchema.index({ sellerId: 1, createdAt: -1 });

// Geospatial: "lots near this buyer/logistics provider"
lotSchema.index({ location: "2dsphere" });

// Admin/cron: sweep for lots past listingExpiryDate
lotSchema.index({ status: 1, listingExpiryDate: 1 });

module.exports = mongoose.model("Lot", lotSchema);