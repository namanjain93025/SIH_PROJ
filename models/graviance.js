// ===================== Grievance.js =====================
const mongoose = require("mongoose");

const grievanceSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },

    // --- Who raised it ---
    raisedById: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "raisedByType",
    },
    raisedByType: {
      type: String,
      required: true,
      enum: ["FarmerProfile", "FPOProfile", "BuyerProfile", "LogisticsProfile"],
    },

    // --- Who it's against ---
    raisedAgainstId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "raisedAgainstType",
    },
    raisedAgainstType: {
      type: String,
      required: true,
      enum: ["FarmerProfile", "FPOProfile", "BuyerProfile", "LogisticsProfile"],
    },

    // --- Nature of Complaint ---
    category: {
      type: String,
      enum: [
        "Quality Mismatch",
        "Quantity Mismatch",
        "Payment Delay",
        "Payment Not Received",
        "Logistics Delay",
        "Damaged Goods",
        "Buyer Unresponsive",
        "Seller Unresponsive",
        "Other",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    evidenceUrls: [
      {
        type: String, // Cloudinary URLs — photos of damaged/mismatched produce, screenshots, etc.
        trim: true,
      },
    ],

    // --- Resolution Lifecycle ---
    status: {
      type: String,
      enum: ["Open", "Under Review", "Awaiting Response", "Resolved", "Rejected", "Escalated"],
      default: "Open",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    // --- Admin Handling ---
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: null,
    },
    resolutionSummary: {
      type: String,
      trim: true,
      default: null,
    },
    resolutionAction: {
      type: String,
      enum: ["Refund Issued", "Partial Refund", "Replacement Arranged", "Warning Issued", "No Action", "Other"],
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

grievanceSchema.index({ transactionId: 1 });
grievanceSchema.index({ status: 1, priority: -1 }); // admin queue sorted by open + urgent first
grievanceSchema.index({ raisedById: 1 });

module.exports = mongoose.model("Grievance", grievanceSchema);