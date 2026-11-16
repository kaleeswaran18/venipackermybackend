const mongoose = require("mongoose");

// =========================
// EMPLOYEE WEEKLY SALARY
// =========================

const weeklySalaryEmployeeSchema =
  new mongoose.Schema(
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

      workingDays: {
        type: Number,
        default: 0,
        min: 0,
      },

      halfDays: {
        type: Number,
        default: 0,
        min: 0,
      },

      leaveDays: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalWorkingHours: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalOTHours: {
        type: Number,
        default: 0,
        min: 0,
      },

      dailyWage: {
        type: Number,
        required: true,
        min: 0,
      },

      basicSalary: {
        type: Number,
        default: 0,
        min: 0,
      },

      otAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      grossSalary: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalAdvance: {
        type: Number,
        default: 0,
        min: 0,
      },

      finalPayable: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      _id: false,
    }
  );

// =========================
// WEEKLY SALARY
// =========================

const weeklySalarySchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: true,
    },

    weekEndDate: {
      type: Date,
      required: true,
    },

    employees: {
      type: [weeklySalaryEmployeeSchema],
      default: [],
    },

    paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// ONE DOCUMENT PER WEEK
// =========================

weeklySalarySchema.index(
  {
    weekStartDate: 1,
    weekEndDate: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "WeeklySalary",
  weeklySalarySchema
);