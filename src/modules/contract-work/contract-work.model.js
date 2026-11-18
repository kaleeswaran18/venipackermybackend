
const mongoose = require("mongoose");
const crypto = require("crypto");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      default: () => crypto.randomUUID(),
    },

    financeTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceTransaction",
      default: null,
    },

    paymentType: {
      type: String,
      enum: ["advance", "payment"],
      default: "payment",
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

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Cheque"],
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  }
);

const contractWorkSchema = new mongoose.Schema(
  {
    contractorName: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    workDescription: {
      type: String,
      required: true,
      trim: true,
    },

    startingDate: {
      type: Date,
      required: true,
    },

    endingDate: {
      type: Date,
      default: null,
    },

    contractAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    payments: {
      type: [paymentSchema],
      default: [],
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Total paid amount
contractWorkSchema.virtual("paidAmount").get(function () {
  return this.payments.reduce(
    (total, payment) => total + payment.amount,
    0
  );
});

// Advance amount
contractWorkSchema.virtual("advanceAmount").get(function () {
  return this.payments
    .filter((payment) => payment.paymentType === "advance")
    .reduce((total, payment) => total + payment.amount, 0);
});

// Remaining balance
contractWorkSchema.virtual("balanceAmount").get(function () {
  return this.contractAmount - this.paidAmount;
});

module.exports = mongoose.model("ContractWork", contractWorkSchema);
