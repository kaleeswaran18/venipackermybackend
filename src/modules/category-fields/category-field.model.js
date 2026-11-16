const mongoose = require("mongoose");

const categoryFieldSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedMaterial",
      required: true,
    },

    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["number", "text", "select"],
      default: "number",
    },

    order: {
      type: Number,
      required: true,
      min: 1,
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

categoryFieldSchema.index(
  { categoryId: 1, key: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CategoryField",
  categoryFieldSchema
);