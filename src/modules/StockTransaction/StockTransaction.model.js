const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    // =========================
    // Transaction Details
    // =========================

    transactionDate: {
      type: Date,
      required: true,
    },

    // =========================
    // Stock Details
    // =========================

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    type: {
      type: String,
      enum: ["item", "nail", "consumable"],
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemCategory",
      default: null,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // =========================
    // Transaction Type
    // =========================

    transactionType: {
      type: String,
      enum: ["IN", "OUT", "ADJUSTMENT"],
      required: true,
    },

    // =========================
    // Quantity
    // =========================

    quantity: {
      type: Number,
      min: 0,
      default: null,
    },

    unit: {
      type: String,
      enum: ["kg", "g", "pcs"],
      default: null,
    },

    // =========================
    // New Item
    // =========================

    cft: {
      type: Number,
      min: 0,
      default: null,
    },

    cubicMeter: {
      type: Number,
      min: 0,
      default: null,
    },

    pieces: [
      {
        pieceSizeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PieceSize",
          required: true,
        },

        width: {
          type: Number,
          required: true,
          min: 0,
        },

        inch: {
          type: Number,
          required: true,
          min: 0,
        },

        feet: {
          type: Number,
          required: true,
          min: 0,
        },

        count: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],

    // =========================
    // Source Details
    // =========================

    sourceType: {
      type: String,
      enum: [
        "Purchase",
        "Consumption",
        "Production",
        "Delivery",
        "Adjustment",
      ],
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

module.exports = mongoose.model(
  "StockTransaction",
  stockTransactionSchema
);