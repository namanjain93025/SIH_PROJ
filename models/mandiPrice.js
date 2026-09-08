const mongoose = require("mongoose");

const mandiPriceSchema = new mongoose.Schema(
  {
    // --- Crop & Market Identity ---
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    variety: {
      type: String,
      trim: true, // e.g. "Lokwan" for wheat, "1121" for basmati rice
    },
    mandiName: {
      type: String,
      required: true,
      trim: true,
    },
    mandiLocation: {
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
    },
    location: {
      // for "nearest mandi to this farmer" queries
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

    // --- Price Data ---
    minPricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    modalPricePerQuintal: {
      type: Number, // most commonly traded price — the figure farmers care about most
      required: true,
      min: 0,
    },

    // --- Arrival / Volume Data (feeds sale-window recommendation logic) ---
    arrivalVolumeInQuintals: {
      type: Number,
      default: 0,
    },

    // --- Date this price record applies to ---
    priceDate: {
      type: Date,
      required: true,
    },

    // --- Source tracking ---
    source: {
      type: String,
      enum: ["Government API (Agmarknet)", "Manual Entry", "Scraper", "Partner Feed"],
      default: "Government API (Agmarknet)",
    },

    // --- Trend helper (computed by priceTrendService, not set on creation) ---
    priceChangeFromPreviousDay: {
      type: Number, // positive = price rising, negative = falling
      default: 0,
    },
  },
  { timestamps: true }
);

// Fast lookups: "latest wheat prices near this district"
mandiPriceSchema.index({ cropName: 1, "mandiLocation.district": 1, priceDate: -1 });

// Prevent duplicate entries for same crop+mandi+date from scraper re-runs
mandiPriceSchema.index(
  { cropName: 1, mandiName: 1, priceDate: 1, variety: 1 },
  { unique: true }
);

mandiPriceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("MandiPrice", mandiPriceSchema);