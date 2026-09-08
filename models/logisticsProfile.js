const mongoose = require("mongoose");

const logisticsProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // --- Identity ---
    providerType: {
      type: String,
      enum: ["Individual Transporter", "Transport Company", "Cold Storage Provider", "Warehouse Operator"],
      required: true,
    },
    businessName: {
      type: String,
      trim: true, // optional — individual transporters may not have a registered business name
    },
    contactPersonName: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },

    // --- Address & Coverage ---
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
        type: String, // districts/states this provider services
        trim: true,
      },
    ],
    serviceRadiusInKm: {
      type: Number,
      default: 0, // used with 2dsphere $near for "nearest transporter to this lot"
    },

    // --- Transport Capability (only relevant if providerType involves moving goods) ---
    fleet: [
      {
        vehicleType: {
          type: String,
          enum: ["Mini Truck", "Truck", "Tractor Trolley", "Refrigerated Truck", "Pickup Van"],
        },
        capacityInMT: { type: Number, min: 0 },
        vehicleCount: { type: Number, min: 1, default: 1 },
      },
    ],
    hasRefrigeratedTransport: {
      type: Boolean,
      default: false,
    },

    // --- Storage Capability (only relevant if providerType is Cold Storage/Warehouse) ---
    storageCapacityInMT: {
      type: Number,
      default: 0,
    },
    hasColdStorage: {
      type: Boolean,
      default: false,
    },
    storageRatePerMTPerDay: {
      type: Number,
      default: 0, // used for cost estimation shown to farmers weighing sell-now vs store-and-wait
    },

    // --- Pricing ---
    transportRatePerKmPerMT: {
      type: Number,
      default: 0, // baseline for logistics cost estimation in offer/transaction flow
    },

    // --- Verification & Trust ---
    kycDocuments: {
      businessLicenseUrl: { type: String, trim: true },
      vehicleRcUrl: { type: String, trim: true }, // registration certificate, if applicable
      panCardUrl: { type: String, trim: true },
    },
    isVerified: {
      type: Boolean,
      default: false, // set true by Admin after document review
    },

    // --- Banking ---
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },

    // --- Availability & Stats (denormalized) ---
    isCurrentlyAvailable: {
      type: Boolean,
      default: true, // toggle off when fully booked
    },
    totalJobsCompleted: {
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

logisticsProfileSchema.index({ location: "2dsphere" });
logisticsProfileSchema.index({ isVerified: 1 });
logisticsProfileSchema.index({ isCurrentlyAvailable: 1 });

module.exports = mongoose.model("LogisticsProfile", logisticsProfileSchema);