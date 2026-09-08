const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never return password by default on queries
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // --- Role ---
    role: {
      type: String,
      enum: ["Farmer", "FPO", "Buyer", "Logistics", "Admin"],
      required: true,
    },

    // --- Email Verification (OTP) ---
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },

    // --- Password Reset ---
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Fast role-based admin queries (e.g. "all unverified Buyers")
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
