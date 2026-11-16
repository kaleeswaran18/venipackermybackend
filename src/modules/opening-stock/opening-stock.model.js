const mongoose = require("mongoose");

const openingStockSchema = new mongoose.Schema(
  {
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
      required: function () {
        return this.type === "item";
      },
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // =========================
    // New Item
    // =========================

    cft: {
      type: Number,
      min: 0,
    },

    cubicMeter: {
      type: Number,
      min: 0,
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
    // Used Item
    // =========================

    quantity: {
      type: Number,
      min: 0,
    },

    currentStock: {
      type: Number,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "g", "pcs"],
    },

    // =========================
    // Stock History
    // =========================

    stockHistory: [
      {
        oldStock: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },

        newStock: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },

        changedQuantity: {
          type: Number,
          required: true,
        },

        operation: {
          type: String,
          enum: ["PURCHASE_IN", "PURCHASE_UPDATE", "PURCHASE_OUT"],
          required: true,
        },

        referenceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

openingStockSchema.index(
  {
    location: 1,
    type: 1,
    category: 1,
    referenceId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "OpeningStock",
  openingStockSchema
);