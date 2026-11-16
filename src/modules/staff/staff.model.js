
const mongoose = require("mongoose");

// =========================
// COMMON CHANGE HISTORY SCHEMA
// =========================

const changeHistorySchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      trim: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
  { _id: false }
);

// =========================
// ADVANCE AMOUNT HISTORY SCHEMA
// =========================

const advanceAmountHistorySchema = new mongoose.Schema(
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
  { _id: false }
);

// =========================
// ADVANCE SCHEMA
// =========================

const advanceSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      required: true,
      trim: true,
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

    // Linked Finance Expense Transaction
    financeTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceTransaction",
      default: null,
    },

    // Advance Amount History
    amountHistory: {
      type: [advanceAmountHistorySchema],
      default: [],
    },

    // Other Advance Field Changes
    changeHistory: {
      type: [changeHistorySchema],
      default: [],
    },
  }
);

// =========================
// DAILY ATTENDANCE SCHEMA
// =========================

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    punchIn: {
      type: String,
      default: null,
    },

    punchOut: {
      type: String,
      default: null,
    },

    workingHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    dayInWork: {
      type: String,
      enum: ["Full Day", "Half Day", "Leave", "Permission"],
      default: null,
    },

    // Overtime Details
    otType: {
      type: String,
      enum: ["Day", "Hours", "Time Between", null],
      default: null,
    },

    otDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    otHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    otStartTime: {
      type: String,
      default: null,
    },

    otEndTime: {
      type: String,
      default: null,
    },

    // Multiple Advances
    advances: {
      type: [advanceSchema],
      default: [],
    },

    // Attendance Field Change History
    changeHistory: {
      type: [changeHistorySchema],
      default: [],
    },
  },
  { _id: false }
);

// =========================
// MONTHLY PAYMENT HISTORY SCHEMA
// =========================

const monthlyPaymentHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["CREATED", "UPDATED"],
      required: true,
    },

    previousPaymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid", null],
      default: null,
    },

    previousPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    previousPaidAt: {
      type: Date,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid"],
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    financeTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceTransaction",
      default: null,
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
  { _id: false }
);

// =========================
// MONTHLY RECORD SCHEMA
// =========================

const monthlyRecordSchema = new mongoose.Schema(
  {
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

    attendance: {
      type: [attendanceSchema],
      default: [],
    },

    // Salary Payment Status
    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Salary Payment Date & Time
    paidAt: {
      type: Date,
      default: null,
    },

    // Linked Finance Expense Transaction
    financeTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceTransaction",
      default: null,
    },

    // Monthly Salary Payment History
    paymentHistory: {
      type: [monthlyPaymentHistorySchema],
      default: [],
    },
  },
  { _id: false }
);

// =========================
// STAFF SCHEMA
// =========================

const staffSchema = new mongoose.Schema(
  {
    staffName: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    monthlySalary: {
      type: Number,
      required: true,
      min: 0,
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    staffType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Login Access
    loginAccess: {
      type: Boolean,
      default: false,
    },

    // Required only when loginAccess is true
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // User Model Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Staff Status
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    // Monthly Attendance Records
    monthlyRecords: {
      type: [monthlyRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// EMAIL UNIQUE INDEX
// =========================

staffSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  }
);

// =========================
// DUPLICATE MONTH VALIDATION
// =========================

staffSchema.path("monthlyRecords").validate(function (records) {
  const keys = records.map(
    (record) => `${record.month}-${record.year}`
  );

  return keys.length === new Set(keys).size;
}, "Duplicate monthly record found");

// =========================
// DUPLICATE ATTENDANCE VALIDATION
// =========================

monthlyRecordSchema.path("attendance").validate(function (records) {
  const dates = records.map(
    (record) => new Date(record.date).toISOString().split("T")[0]
  );

  return dates.length === new Set(dates).size;
}, "Duplicate attendance date found");

// =========================
// EXPORT MODEL
// =========================

module.exports = mongoose.model("Staff", staffSchema);
