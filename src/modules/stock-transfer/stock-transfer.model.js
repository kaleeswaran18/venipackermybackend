
const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
  {
    fromLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    toLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    itemType: {
      type: String,
      enum: ["item", "nail", "consumable"],
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemCategory",
      required: function () {
        return this.itemType === "item";
      },
    },

    // Dynamic Reference
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
      required: true,
    },

    referenceModel: {
      type: String,
      enum: ["Nail", "Item", "Consumable"],
      required: true,
    },

    quantity: {
      type: Number,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "g", "pcs"],
    },

    pieces: [
      {
        pieceSizeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PieceSize",
          required: true,
        },

        count: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    transferDate: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes
stockTransferSchema.index({
  fromLocation: 1,
  transferDate: -1,
});

stockTransferSchema.index({
  toLocation: 1,
  transferDate: -1,
});

stockTransferSchema.index({
  itemType: 1,
  referenceId: 1,
  transferDate: -1,
});

module.exports = mongoose.model(
  "StockTransfer",
  stockTransferSchema
);
