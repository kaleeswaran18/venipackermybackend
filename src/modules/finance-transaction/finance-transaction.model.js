
const mongoose = require("mongoose");

const amountHistorySchema = new mongoose.Schema(
  {
    oldAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    newAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const financeTransactionSchema = new mongoose.Schema(
  {
    // Manual / Automatic
    entryMode: {
      type: String,
      enum: ["manual", "automatic"],
      required: true,
    },

    // Income / Expense
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    // Finance Category Reference
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceCategory",
      required: true,
    },

    // Location Reference (V1, V2, V3, Bobin, KAK, Office)
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      // required: true,
    },

    // Transaction Amount
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be greater than zero"],
    },

    // Transaction Description
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Transaction Date and Time
    transactionDate: {
      type: Date,
      required: true,
    },

    // Payment Method
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "cheque",'other'],
      required: true,
    },

    // UPI ID / Cheque Number / Bank Reference
    paymentReference: {
      type: String,
      trim: true,
      default: "",
    },

    // Purchase / Delivery Reference Number
    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Automatic Transaction Source Details
    sourceModule: {
      type: String,
      enum: ["purchase", "customer_delivery", "property",'vehicle-expense','staffsalary','staffadvancesalary','employeeadvancesalary',"individualorderpayment",'bulkorderpayment','other',"contract-work"],
      required: function () {
        return this.entryMode === "automatic";
      },
      default: null,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: function () {
        return this.entryMode === "automatic";
      },
    },

    sourcePaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    sourceType: {
      type: String,
      trim: true,
      default: null,
      required: function () {
        return this.entryMode === "automatic";
      },
    },

    // Amount Update History
    amountHistory: {
      type: [amountHistorySchema],
      default: [],
    },

    // Created By
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Last Updated By
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Soft Delete Details
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
financeTransactionSchema.index({
  locationId: 1,
  transactionDate: -1,
});

financeTransactionSchema.index({
  categoryId: 1,
  transactionDate: -1,
});

financeTransactionSchema.index({
  entryMode: 1,
  type: 1,
});

financeTransactionSchema.index({
  sourceModule: 1,
  sourceId: 1,
});

const FinanceTransaction = mongoose.models.FinanceTransaction ||
  mongoose.model("FinanceTransaction", financeTransactionSchema);

module.exports = FinanceTransaction;
