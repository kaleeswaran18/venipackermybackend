
const mongoose = require("mongoose");

// =========================
// DELIVERY FIELD SCHEMA
// =========================

const deliveryFieldSchema = new mongoose.Schema(
  {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    fieldName: {
      type: String,
      required: true,
      trim: true,
    },

    orderedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveredQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================
    // STOCK DEDUCTED QUANTITY
    // =========================

    stockDeductedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// =========================
// DELIVERY PRODUCT SCHEMA
// =========================

const deliveryProductSchema = new mongoose.Schema(
  {
    finishedMaterialCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    finishedMaterialCategoryName: {
      type: String,
      required: true,
      trim: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: String,
      trim: true,
      default: "",
    },

    fields: {
      type: [deliveryFieldSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value && value.length > 0;
        },
        message: "At least one delivery field is required.",
      },
    },

    ratePerPiece: {
      type: Number,
      required: true,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

// =========================
// CUSTOMER DELIVERY SCHEMA
// =========================

const customerDeliverySchema = new mongoose.Schema(
  {
    // =========================
    // DELIVERY NUMBER
    // =========================

    deliveryNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // =========================
    // ORDER REFERENCE
    // =========================

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // =========================
    // COMPANY REFERENCE
    // =========================

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // =========================
    // CUSTOMER
    // =========================

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================
    // TAX AMOUNT
    // =========================

    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // =========================
    // EXPECTED DELIVERY DATE
    // =========================

    expectedDeliveryDate: {
      type: Date,
      required: true,
    },

    // =========================
    // ACTUAL DELIVERY DATE
    // =========================

    actualDeliveryDate: {
      type: Date,
      default: null,
    },

    // =========================
    // DELIVERY STATUS
    // =========================

    deliveryStatus: {
      type: String,
      enum: [
        "Pending",
        "Partially Delivered",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    // =========================
    // DELIVERY PRODUCTS
    // =========================

    products: {
      type: [deliveryProductSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value && value.length > 0;
        },
        message: "At least one delivery product is required.",
      },
    },

    // =========================
    // REMARKS
    // =========================

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// EXPORT MODEL
// =========================

module.exports = mongoose.model(
  "CustomerDelivery",
  customerDeliverySchema
);
