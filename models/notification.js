// ===================== Notification.js =====================
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // always points to base User, regardless of role
    },

    // --- Content ---
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "New Offer",
        "Offer Accepted",
        "Offer Rejected",
        "Price Alert",
        "Payment Received",
        "Payment Overdue",
        "Logistics Update",
        "Grievance Update",
        "Verification Update",
        "System",
      ],
      required: true,
    },

    // --- Linkage (so tapping the notification navigates correctly) ---
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // e.g. the Offer, Transaction, or Grievance this notification is about
    },
    relatedEntityType: {
      type: String,
      enum: ["Lot", "Offer", "Transaction", "Payment", "Grievance", null],
      default: null,
    },

    // --- Delivery Channels ---
    isReadInApp: {
      type: Boolean,
      default: false,
    },
    sentViaSMS: {
      type: Boolean,
      default: false,
    },
    sentViaEmail: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 }); // fetch user's notifications, newest first
notificationSchema.index({ recipientId: 1, isReadInApp: 1 }); // unread count query

module.exports = mongoose.model("Notification", notificationSchema);