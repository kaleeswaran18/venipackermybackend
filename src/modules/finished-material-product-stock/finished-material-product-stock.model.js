const mongoose = require("mongoose");

const overallStockSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedMaterial",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedMaterialProduct",
      required: true,
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    values: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Same category + product + location should not be duplicated
overallStockSchema.index(
  {
    categoryId: 1,
    productId: 1,
    locationId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "OverallStock",
  overallStockSchema
);