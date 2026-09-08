const mongoose = require("mongoose");

const buyerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // --- Identity ---
    buyerType: {
      type: String,
      enum: ["Processor", "Institutional Buyer", "Trader", "Retailer", "Exporter"],
      required: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPersonName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPersonDesignation: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },

    // --- Business Registration ---
    gstNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows multiple docs without gstNumber (some small traders may not have GST)
    },
    businessRegistrationNumber: {
      type: String,
      trim: true,
    },
    licenseType: {
      type: String, // e.g. FSSAI (for processors), APMC trading license, mandi license
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },

    // --- Address & Location ---
    address: {
      addressLine: { type: String, trim: true },
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
    operatingRegions: [
      {
        type: String, // districts/states buyer sources from — used in matchingEngine
        trim: true,
      },
    ],

    // --- Sourcing Preferences (feeds matchingEngine.js) ---
    cropsInterested: [
      {
        cropName: { type: String, required: true, trim: true },
        qualityGradeRequired: {
          type: String,
          enum: ["Grade A", "Grade B", "Grade C", "Any"],
          default: "Any",
        },
        minVolumeRequiredInQuintals: { type: Number, min: 0 },
        maxVolumeCapacityInQuintals: { type: Number, min: 0 },
        preferredPriceRangeMin: { type: Number, min: 0 },
        preferredPriceRangeMax: { type: Number, min: 0 },
      },
    ],

    // --- Payment Reliability (directly addresses problem statement's "payment reliability" gap) ---
    preferredPaymentMode: {
      type: String,
      enum: ["Advance", "On Delivery", "Credit (7 days)", "Credit (15 days)", "Credit (30 days)"],
      default: "On Delivery",
    },
    paymentReliabilityScore: {
      type: Number,
      default: 0, // computed from past transaction payment timeliness
      min: 0,
      max: 5,
    },

    // --- Verification & Trust ---
    kycDocuments: {
      gstCertificateUrl: { type: String, trim: true },
      businessLicenseUrl: { type: String, trim: true },
      panCardUrl: { type: String, trim: true },
    },
    isVerified: {
      type: Boolean,
      default: false, // set true by Admin after document/credential review
    },

    // --- Banking ---
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },

    // --- Platform stats (denormalized) ---
    totalOffersMade: {
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

buyerProfileSchema.index({ location: "2dsphere" });
buyerProfileSchema.index({ isVerified: 1 });
buyerProfileSchema.index({ "cropsInterested.cropName": 1 }); // fast lookup: "which buyers want wheat?"

module.exports = mongoose.model("BuyerProfile", buyerProfileSchema);