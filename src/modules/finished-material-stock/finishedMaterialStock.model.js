const mongoose = require("mongoose");

const finishedMaterialStockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedMaterial",
      required: true,
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