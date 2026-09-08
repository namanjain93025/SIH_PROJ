// ===================== Payment.js =====================
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },

    // --- Parties ---
    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuyerProfile",
      required: true, // buyer is always the payer in this flow
    },
    payeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "payeeType", // Farmer or FPO receiving payment
    },
    payeeType: {
      type: String,
      required: true,
      enum: ["FarmerProfile", "FPOProfile"],
    },

    // --- Payment Classification ---
    paymentType: {
      type: String,
      enum: ["Advance", "Partial", "Full Settlement", "Balance Payment"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },

    // --- Razorpay Integration Fields ---
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null, // filled after successful payment capture
    },
    razorpaySignature: {
      type: String,
      default: null, // for HMAC verification record-keeping
    },

    // --- Status Lifecycle ---
    status: {
      type: String,
      enum: ["Created", "Pending", "Success", "Failed", "Refunded"],
      default: "Created",
    },
    failureReason: {
      type: String,
      trim: true,
      default: null,
    },

    // --- Webhook Audit ---
    webhookVerified: {
      type: Boolean,
      default: false, // true once HMAC signature has been validated server-side
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);