const mongoose = require("mongoose");

const nailPackingProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedMaterialProduct",
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const nailPackingDailySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    products: {
      type: [nailPackingProductSchema],
      default: [],
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const nailPackingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      default: "Mahindra City",
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FinishedMaterialProduct",
      },
    ],

    dailyEntries: {
      type: [nailPackingDailySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

nailPackingSchema.index(
  { companyName: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "NailPacking",
  nailPackingSchema
);