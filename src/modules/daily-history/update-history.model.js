const mongoose = require("mongoose");

const updateHistorySchema = new mongoose.Schema(
  {
    dailyHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyHistory",
      required: true,
    },

    businessDate: {
      type: Date,
      required: true,
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    action: {
      type: String,
      enum: [
        "attendance",
        "opening_stock",
        "production",
        "consumption",
        "customer_delivery",
        "closing_stock",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

updateHistorySchema.index({
  dailyHistoryId: 1,
  updatedAt: -1,
});

updateHistorySchema.index({
  locationId: 1,
  businessDate: 1,
});

module.exports = mongoose.model(
  "UpdateHistory",
  updateHistorySchema
);