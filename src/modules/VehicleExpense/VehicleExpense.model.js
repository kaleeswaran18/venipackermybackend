
const mongoose = require("mongoose");

// Change History Schema
const changeHistorySchema = new mongoose.Schema(
  {
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },

    changes: [
      {
        field: {
          type: String,
          required: true,
        },

        oldValue: {
          type: mongoose.Schema.Types.Mixed,
        },

        newValue: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],

    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const vehicleExpenseSchema = new mongoose.Schema(
  {
    serialNo: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    vehicle: {
      type: String,
      required: true,
      trim: true,
    },

    driver: {
      type: String,
      required: true,
      trim: true,
    },

    startKms: {
      type: Number,
      required: true,
      min: 0,
    },

    endKms: {
      type: Number,
      default: null,
      min: 0,
    },

    totalKms: {
      type: Number,
      default: null,
      min: 0,
    },

    diesel: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["In Progress", "Completed"],
      default: "In Progress",
      required: true,
    },

    // Record Created By
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Last Updated By
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Complete Change History
    changeHistory: {
      type: [changeHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "VehicleExpense",
  vehicleExpenseSchema
);
