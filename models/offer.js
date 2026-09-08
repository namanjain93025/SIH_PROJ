// ===================== models/offer.js =====================
const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    lotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lot",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuyerProfile",
      required: true,
    },

    // --- Offer Terms ---
    offeredPricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    offeredQuantityInQuintals: {
      type: Number, // buyer may want less than the full lot
      required: true,
      min: 0,
    },
    proposedPaymentTerms: {
      type: String,
      enum: ["Advance", "On Delivery", "Credit (7 days)", "Credit (15 days)", "Credit (30 days)"],
      required: true,
    },
    proposedPickupDate: {
      type: Date,
    },
    message: {
      type: String,
      trim: true, // optional note from buyer, e.g. "can pick up within 2 days of acceptance"
    },

    // --- Counter-offer chain ---
    parentOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      default: null, // set when this offer is a counter to a previous one — self-referencing chain
    },
    isCounterOffer: {
      type: Boolean,
      default: false,
    },
    counteredBy: {
      type: String,
      enum: ["Seller", "Buyer", null],
      default: null, // who proposed this particular counter
    },

    // --- Lifecycle ---
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Countered", "Withdrawn", "Expired"],
      default: "Pending",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    validUntil: {
      type: Date, // offer auto-expires if seller doesn't respond in time
      required: true,
    },
  },
  { timestamps: true }
);

// Seller dashboard: all offers on a lot, newest first
offerSchema.index({ lotId: 1, createdAt: -1 });

// Buyer dashboard: "my offers"
offerSchema.index({ buyerId: 1, createdAt: -1 });

// Cron sweep: expire stale pending offers
offerSchema.index({ status: 1, validUntil: 1 });

module.exports = mongoose.model("Offer", offerSchema);