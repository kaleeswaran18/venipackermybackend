const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
  {
    // =========================
    // Tax Transaction Details
    // =========================

    transactionDate: {
      type: Date,
      required: true,
    },

    transactionType: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    // =========================
    // Tax Amount
    // =========================

    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================
    // Tax Usage Details
    // =========================

    usedTax: {
      type: Number,
      min: 0,
      default: 0,
    },

    externalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // =========================
    // Source Details
    // =========================

    sourceType: {
      type: String,
      enum: ["Purchase", "Delivery"],
      required: true,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // =========================
    // Remarks
    // =========================

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tax", taxSchema);