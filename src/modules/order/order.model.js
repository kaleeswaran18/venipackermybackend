const mongoose = require("mongoose");

// =========================
// FIELD SCHEMA
// =========================

const fieldSchema = new mongoose.Schema(
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

    requestedQuantity: {
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
// PRODUCT SCHEMA
// =========================

const productSchema = new mongoose.Schema(
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
      type: [fieldSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value && value.length > 0;
        },
        message: "At least one field is required.",
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
// PAYMENT HISTORY SCHEMA
// =========================

const paymentHistorySchema = new mongoose.Schema(
  {
    paymentDate: {
      type: Date,
      required: true,
    },

    paymentAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: [
        "Cash",
        "Bank Transfer",
        "UPI",
        "Cheque",
        "Other",
      ],
      required: true,
    },

    referenceNumber: {
      type: String,
      trim: true,
      default: "",
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

// =========================
// ORDER SCHEMA
// =========================

const orderSchema = new mongoose.Schema(
  {
    // =========================
    // ORDER DETAILS
    // =========================

    orderNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    source: {
      type: String,
      enum: ["From Enquiry", "Direct Order"],
      required: true,
    },

    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      default: null,
    },

    enquiryNo: {
      type: String,
      trim: true,
      default: null,
    },

    // =========================
    // CUSTOMER DETAILS
    // =========================

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },
companyId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Company",
  default: null,
},

    platform: {
      type: String,
      enum: [
        "Just Dial",
        "India Mart",
        "Direct",
        "Reference",
        "Other",
      ],
      required: true,
    },

    customerLocation: {
      type: String,
      required: true,
      trim: true,
    },

    originalRequirement: {
      type: String,
      required: true,
      trim: true,
    },

    additionalDetails: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // DELIVERY DETAILS
    // =========================

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },

   assignedLocation: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Location",
  required: true,
},

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // =========================
    // PRODUCTS
    // =========================

    products: {
      type: [productSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value && value.length > 0;
        },
        message: "At least one product is required.",
      },
    },

    // =========================
    // OTHER DETAILS
    // =========================

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // PAYMENT SUMMARY
    // =========================

    alreadyPaidAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    pendingAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "Not Received",
        "Partially Received",
        "Fully Received",
      ],
      default: "Not Received",
    },

    // =========================
    // PAYMENT HISTORY
    // =========================

    paymentHistory: {
      type: [paymentHistorySchema],
      default: [],
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
    // AMOUNT & TAX DETAILS
    // =========================

    subTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    taxPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);