
const mongoose = require("mongoose");

const dailyLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["work", "visitor"],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    // Work Log
    personName: {
      type: String,
      trim: true,
    },

    assignedWork: {
      type: String,
      trim: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    // Visitor Log
    visitorName: {
      type: String,
      trim: true,
    },

    purpose: {
      type: String,
      trim: true,
    },

    visitDetails: {
      type: String,
      trim: true,
    },

    arrivalTime: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DailyLog", dailyLogSchema);
