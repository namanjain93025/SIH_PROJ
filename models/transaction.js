const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // --- Core Linkage ---
    lotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lot",
      required: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },

    // --- Parties (polymorphic seller: Farmer or FPO) ---
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
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuyerProfile",
      required: true,
    },

    // --- Deal Terms (snapshotted from the accepted Offer at time of finalization) ---
    cropName: {
      type: String,
      required: true,
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
    agreedPricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentTerms: {
      type: String,
      enum: ["Advance", "On Delivery", "Credit (7 days)", "Credit (15 days)", "Credit (30 days)"],
      required: true,
    },

    // --- Logistics Coordination ---
    logisticsProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LogisticsProfile",
      default: null, // may be arranged separately by buyer/seller, so not mandatory at creation
    },
    pickupLocation: {
      addressLine: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
    },
    deliveryLocation: {
      addressLine: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
    },
    expectedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
      default: null,
    },
    logisticsStatus: {
      type: String,
      enum: ["Not Arranged", "Scheduled", "In Transit", "Delivered", "Delayed"],
      default: "Not Arranged",
    },

    // --- Quality Verification at Delivery ---
    deliveredQuantityInQuintals: {
      type: Number,
      default: null, // filled after delivery — may differ slightly from agreed quantity
    },
    qualityCheckedAtDelivery: {
      type: Boolean,
      default: false,
    },
    qualityMismatchNoted: {
      type: Boolean,
      default: false, // triggers grievance flow if true
    },

    // --- Payment Tracking ---
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Advance Paid", "Partially Paid", "Fully Paid", "Overdue"],
      default: "Pending",
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Overall Transaction Lifecycle ---
    status: {
      type: String,
      enum: [
        "Initiated",
        "Logistics Arranged",
        "In Transit",
        "Delivered",
        "Payment Pending",
        "Completed",
        "Disputed",
        "Cancelled",
      ],
      default: "Initiated",
    },

    // --- Dispute Linkage ---
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      default: null,
    },

    // --- Trust / Feedback (post-completion) ---
    sellerRatingByBuyer: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    buyerRatingBySeller: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Dashboards: "all transactions for this buyer/seller, most recent first"
transactionSchema.index({ sellerId: 1, createdAt: -1 });
transactionSchema.index({ buyerId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);