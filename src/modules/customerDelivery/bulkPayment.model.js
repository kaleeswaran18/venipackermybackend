
const mongoose = require("mongoose");

// =========================
// ORDER ALLOCATION SCHEMA
// =========================

const allocationSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    orderNo: {
      type: String,
      required: true,
      trim: true,
    },

    allocatedAmount: {
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
// ALLOCATION HISTORY SCHEMA
// =========================

const allocationHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["created", "updated"],
      required: true,
    },

    oldAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    newAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    oldAllocations: {
      type: [allocationSchema],
      default: [],
    },

    newAllocations: {
      type: [allocationSchema],
      default: [],
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

// =========================
// BULK PAYMENT SCHEMA
// =========================

const bulkPaymentSchema = new mongoose.Schema(
  {
    // Company Details
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Payment Details
    receivedAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentDate: {
      type: Date,
      required: true,
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

    // FIFO Allocation Details
    allocations: {
      type: [allocationSchema],
      default: [],
    },

    // Amount Not Allocated to Orders
    unallocatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Finance Transaction Reference
    financeTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceTransaction",
      default: null,
    },

    // Complete Create / Edit History
    allocationHistory: {
      type: [allocationHistorySchema],
      default: [],
    },

    // User Details
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// INDEXES
// =========================

bulkPaymentSchema.index({
  companyId: 1,
  paymentDate: -1,
});

bulkPaymentSchema.index({
  financeTransactionId: 1,
});

// =========================
// MODEL EXPORT
// =========================

const BulkPayment =
  mongoose.models.BulkPayment ||
  mongoose.model("BulkPayment", bulkPaymentSchema);

module.exports = BulkPayment;
