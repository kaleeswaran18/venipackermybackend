
const mongoose = require("mongoose");

// =========================
// ATTENDANCE UPDATE HISTORY
// =========================

const attendanceHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["CREATE", "UPDATE"],
      required: true,
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

    changes: [
      {
        field: {
          type: String,
          required: true,
        },

        oldValue: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },

        newValue: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
      },
    ],
  }
);

// =========================
// DAILY ATTENDANCE
// =========================

const dailyAttendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Working",
        "Half Day",
        "Leave",
        "Permission",
        "Absent",
      ],
      required: true,
    },

    workCategory: {
      type: String,
      enum: [
        "Cutter",
        "Nailer",
        "Sandring",
        "Plainer",
        "Helper (M)",
        "Helper (L)",
        "Mcity",
        "Onsite Packing",
        "Others",
      ],
      default: null,
    },

    // Employee's permanent location
    permanentLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    // Actual location where employee works today
    workLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    // Temporary relocation
    temporaryRelocation: {
      type: Boolean,
      default: false,
    },

    toLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },

    // Punch details
    punchIn: {
      type: Date,
      default: null,
    },

    punchOut: {
      type: Date,
      default: null,
    },

    workingHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Overtime
    otApplicable: {
      type: Boolean,
      default: false,
    },

    otHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Daily advance
   advance: {
  amount: {
    type: Number,
    default: 0,
  },
  remark: {
    type: String,
    default: null,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FinanceTransaction",
    default: null,
  },
},

    remark: {
      type: String,
      trim: true,
      default: null,
    },

    // Daily attendance history
    history: {
      type: [attendanceHistorySchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

// =========================
// EMPLOYEE ATTENDANCE
// =========================

const attendanceEmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    days: {
      type: [dailyAttendanceSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

// =========================
// LOCATION
// =========================

const attendanceLocationSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    employees: {
      type: [attendanceEmployeeSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

// =========================
// EMPLOYEE ATTENDANCE WEEK
// =========================

const employeeAttendanceSchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: true,
    },

    weekEndDate: {
      type: Date,
      required: true,
    },

    locations: {
      type: [attendanceLocationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// One attendance document for one week
employeeAttendanceSchema.index(
  {
    weekStartDate: 1,
    weekEndDate: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "EmployeeAttendance",
  employeeAttendanceSchema
);
