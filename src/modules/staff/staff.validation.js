
const Joi = require("joi");

const loginRoles = [
  "systemadmin",
  "owner",
  "business_executive",
  "supervisor",
];

// =========================
// CREATE STAFF
// =========================

const createStaffSchema = Joi.object({
  staffName: Joi.string()
    .trim()
    .required(),

  phoneNumber: Joi.string()
    .trim()
    .required(),

  monthlySalary: Joi.number()
    .min(0)
    .required(),

  address: Joi.string()
    .trim()
    .allow("")
    .optional(),

  staffType: Joi.string()
    .trim()
    .lowercase()
    .required(),

  email: Joi.when("staffType", {
    is: Joi.string().valid(...loginRoles),
    then: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required(),
    otherwise: Joi.forbidden(),
  }),

  password: Joi.when("staffType", {
    is: Joi.string().valid(...loginRoles),
    then: Joi.string()
      .min(6)
      .required(),
    otherwise: Joi.forbidden(),
  }),

  status: Joi.string()
    .valid("Active", "Inactive")
    .optional(),
});

// =========================
// UPDATE STAFF
// =========================

const updateStaffSchema = Joi.object({
  staffName: Joi.string()
    .trim()
    .optional(),

  phoneNumber: Joi.string()
    .trim()
    .optional(),

  monthlySalary: Joi.number()
    .min(0)
    .optional(),

  address: Joi.string()
    .trim()
    .allow("")
    .optional(),

  staffType: Joi.string()
    .trim()
    .lowercase()
    .optional(),

  status: Joi.string()
    .valid("Active", "Inactive")
    .optional(),
}).min(1);

// =========================
// GENERATE MONTHLY ATTENDANCE
// =========================

const generateMonthlyAttendanceSchema = Joi.object({
  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required(),

  year: Joi.number()
    .integer()
    .min(2020)
    .required(),
});

// =========================
// UPDATE ATTENDANCE
// =========================

const updateAttendanceSchema = Joi.object({
  // Date: YYYY-MM-DD
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),

  punchIn: Joi.string()
    .allow(null, "")
    .optional(),

  punchOut: Joi.string()
    .allow(null, "")
    .optional(),

  workingHours: Joi.number()
    .min(0)
    .optional(),

  dayInWork: Joi.string()
    .valid("Full Day", "Half Day", "Leave", "Permission")
    .allow(null)
    .optional(),

  otType: Joi.string()
    .valid("Day", "Hours", "Time Between")
    .allow(null)
    .optional(),

  otDays: Joi.number()
    .min(0)
    .optional(),

  otHours: Joi.number()
    .min(0)
    .optional(),

  otStartTime: Joi.string()
    .allow(null, "")
    .optional(),

  otEndTime: Joi.string()
    .allow(null, "")
    .optional(),

  // STAFF ATTENDANCE ADVANCES
  advances: Joi.array()
    .items(
      Joi.object({
        // Existing Advance ID
        _id: Joi.string()
          .hex()
          .length(24)
          .optional(),

        // Existing Finance Transaction ID
        financeTransactionId: Joi.string()
          .hex()
          .length(24)
          .optional(),

        amount: Joi.number()
          .min(0)
          .required(),

        paymentMode: Joi.string()
          .trim()
          .required(),

        referenceNumber: Joi.string()
          .trim()
          .allow("")
          .optional(),

        remarks: Joi.string()
          .trim()
          .allow("")
          .optional(),
      })
    )
    .optional(),
});

// =========================
// EXPORTS
// =========================

module.exports = {
  createStaffSchema,
  updateStaffSchema,
  generateMonthlyAttendanceSchema,
  updateAttendanceSchema,
};
