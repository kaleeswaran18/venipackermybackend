
const mongoose = require("mongoose");

const occupancyHistorySchema = new mongoose.Schema(
  {
    tenantName: {
      type: String,
      required: true,
      trim: true,
    },

    tenantPhone: {
      type: String,
      required: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const paymentHistorySchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Partially Paid",
        "Paid",
      ],
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: true,
  }
);

const propertySchema = new mongoose.Schema(
  {
    propertyNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    propertyName: {
      type: String,
      required: true,
      trim: true,
    },

    doorNo: {
      type: String,
      required: true,
      trim: true,
    },

    propertyType: {
      type: String,
      enum: [
        "House",
        "Godown",
        "Shop",
        "Office",
        "Land",
        "Other",
      ],
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    occupy: {
      type: Boolean,
      default: false,
    },

    rentalType: {
      type: String,
      enum: ["Rent", "Lease"],
      required: true,
    },

    rentDetails: {
      monthlyRent: {
        type: Number,
        min: 0,
        default: null,
      },

      securityDeposit: {
        type: Number,
        min: 0,
        default: null,
      },
    },

    leaseDetails: {
      leaseAmount: {
        type: Number,
        min: 0,
        default: null,
      },

      leasePeriodYears: {
        type: Number,
        min: 1,
        default: null,
      },
    },

    occupancyHistory: {
      type: [occupancyHistorySchema],
      default: [],
    },

    paymentHistory: {
      type: [paymentHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Property",
  propertySchema
);
