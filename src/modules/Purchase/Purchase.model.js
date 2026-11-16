
const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    // =========================
    // Purchase Details
    // =========================

    purchaseNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    purchaseDate: {
      type: Date,
      required: true,
    },

    // =========================
    // Stock Details
    // =========================

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    type: {
      type: String,
      enum: ["item", "nail", "consumable"],
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemCategory",
      default: null,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // =========================
    // Quantity
    // =========================

    quantity: {
      type: Number,
      min: 0,
      default: null,
    },

    unit: {
      type: String,
      enum: ["kg", "g", "pcs"],
      default: null,
    },

    // =========================
    // New Item
    // =========================

    cft: {
      type: Number,
      min: 0,
      default: null,
    },

    cubicMeter: {
      type: Number,
      min: 0,
      default: null,
    },

    pieces: [
      {
        pieceSizeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PieceSize",
          required: true,
        },

        width: {
          type: Number,
          required: true,
          min: 0,
        },

        inch: {
          type: Number,
          required: true,
          min: 0,
        },

        feet: {
          type: Number,
          required: true,
          min: 0,
        },

        count: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],

    // =========================
    // Supplier Details
    // =========================

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    supplierPhone: {
      type: String,
      required: true,
      trim: true,
    },

    supplierAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================
    // Amount Details
    // =========================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================
    // Payment History
    // =========================

    paymentHistory: [
      {
        paymentDate: {
          type: Date,
          required: true,
        },

        amount: {
          type: Number,
          required: true,
          min: 0,
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

        // =========================
        // Payment Edit History
        // =========================

        editHistory: [
          {
            oldAmount: {
              type: Number,
              required: true,
            },

            newAmount: {
              type: Number,
              required: true,
            },

            oldPaymentDate: {
              type: Date,
              required: true,
            },

            newPaymentDate: {
              type: Date,
              required: true,
            },

            oldPaymentMode: {
              type: String,
              enum: ["Cash", "UPI", "Bank Transfer", "Cheque"],
              required: true,
            },

            newPaymentMode: {
              type: String,
              enum: ["Cash", "UPI", "Bank Transfer", "Cheque"],
              required: true,
            },

            oldRemarks: {
              type: String,
              default: "",
            },

            newRemarks: {
              type: String,
              default: "",
            },

            changedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },

            changedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },

    // =========================
    // Initial Purchase Snapshot
    // =========================

    initialSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // =========================
    // Section-wise Edit History
    // =========================

    history: [
      {
        section: {
          type: String,
          enum: [
            "purchase",
            "supplier",
            "amount",
            "remarks",
          ],
          required: true,
        },

        oldData: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },

        newData: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // =========================
    // Remarks
    // =========================

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // Opening Stock
    // =========================

    openingStockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpeningStock",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
