
const mongoose = require("mongoose");

// ==========================================
// REMARK DESCRIPTION SCHEMA
// ==========================================

const remarkDescriptionSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

// ==========================================
// CHANGE HISTORY SCHEMA
// ==========================================

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

// ==========================================
// VEHICLE EXPENSE SCHEMA
// ==========================================

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

    // ======================================
    // DIESEL AMOUNT
    // ======================================

    diesel: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // OTHER AMOUNT
    // ======================================

    otherAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // OTHER AMOUNT REMARK DESCRIPTION
    // ======================================

    remarkDescription: {
      type: [remarkDescriptionSchema],
      default: [],
    },

    // ======================================
    // STATUS
    // ======================================

    status: {
      type: String,
      enum: ["In Progress", "Completed"],
      default: "In Progress",
      required: true,
    },

    // ======================================
    // RECORD CREATED BY
    // ======================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ======================================
    // LAST UPDATED BY
    // ======================================

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ======================================
    // COMPLETE CHANGE HISTORY
    // ======================================

    changeHistory: {
      type: [changeHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = mongoose.model(
  "VehicleExpense",
  vehicleExpenseSchema
);
