const mongoose = require("mongoose");

const finishedMaterialStockSchema = new mongoose.Schema(
  {
    finishedMaterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedMaterial",
      required: true,
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "FinishedMaterialStock",
  finishedMaterialStockSchema
);