const mongoose = require("mongoose");

const finishedMaterialProductSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedMaterial",
      required: true,
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
    },

    name: {
      type: String,
      required: true,
      trim: true,
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

finishedMaterialProductSchema.index(
  {
    categoryId: 1,
    companyName: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "FinishedMaterialProduct",
  finishedMaterialProductSchema
);