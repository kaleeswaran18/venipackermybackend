const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["Used Items", "New Items"],
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

itemSchema.index(
  { name: 1, category: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Item",
  itemSchema
);