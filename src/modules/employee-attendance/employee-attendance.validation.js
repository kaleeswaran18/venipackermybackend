const Joi = require("joi");

// =========================
// COMMON VALIDATIONS
// =========================

const objectId = Joi.string()
  .hex()
  .length(24);

const workCategory = Joi.string().valid(
  "Cutter",
  "Nailer",
  "Sandring",
  "Plainer",
  "Helper (M)",
  "Helper (L)",
  "Mcity",
  "Onsite Packing",
  "Others"
);

const status = Joi.string().valid(
  "Working",
  "Half Day",
  "Leave",
  "Permission",
  "Absent"
);

// =========================
// DAILY ATTENDANCE
// =========================

const dailyAttendanceSchema = Joi.object({
  date: Joi.date()
    .required(),

  status: status
    .required(),

  workCategory: Joi.when("status", {
    is: "Working",
    then: workCategory.required(),
    otherwise: workCategory
      .allow(null)
      .optional(),
  }),

  // Employee's permanent location
  permanentLocationId: objectId
    .optional(),

  // Actual working location
  workLocationId: objectId
    .optional(),

  // Temporary relocation
  temporaryRelocation: Joi.boolean()
    .default(false),

  toLocationId: Joi.when(
    "temporaryRelocation",
    {
      is: true,
      then: objectId.required(),
      otherwise: objectId
        .allow(null)
        .optional(),
    }
  ),

  // Punch details
  punchIn: Joi.date()
    .allow(null)
    .optional(),

  punchOut: Joi.date()
    .allow(null)
    .optional(),

  workingHours: Joi.number()
    .min(0)
    .default(0),

  // Overtime
  otApplicable: Joi.boolean()
    .default(false),

  otHours: Joi.number()
    .min(0)
    .default(0),

  // Daily advance
  advance: Joi.object({
    amount: Joi.number()
      .min(0)
      .default(0),

    remark: Joi.string()
      .trim()
      .allow("", null)
      .default(null),
  })
    .default({
      amount: 0,
      remark: null,
    }),

  remark: Joi.string()
    .trim()
    .allow("", null)
    .default(null),
});

// =========================
// EMPLOYEE
// =========================

const attendanceEmployeeSchema = Joi.object({
  employeeId: objectId
    .required(),

  name: Joi.string()
    .trim()
    .optional(),

  day: dailyAttendanceSchema
    .required(),
});

// =========================
// LOCATION
// =========================

const attendanceLocationSchema = Joi.object({
  locationId: objectId
    .required(),

  employees: Joi.array()
    .items(attendanceEmployeeSchema)
    .min(1)
    .required(),
});

// =========================
// CREATE EMPLOYEE ATTENDANCE
// =========================

const createEmployeeAttendanceSchema = Joi.object({
  date: Joi.date()
    .required(),

  locations: Joi.array()
    .items(attendanceLocationSchema)
    .min(1)
    .required(),
});

// =========================
// UPDATE EMPLOYEE ATTENDANCE
// =========================

const updateEmployeeAttendanceSchema = Joi.object({
  locationId: objectId
    .required(),

  employeeId: objectId
    .required(),

  date: Joi.date()
    .required(),

  day: Joi.object({
    status: status
      .optional(),

    workCategory: workCategory
      .allow(null)
      .optional(),

    workLocationId: objectId
      .optional(),

    temporaryRelocation: Joi.boolean()
      .optional(),

    toLocationId: objectId
      .allow(null)
      .optional(),

    punchIn: Joi.date()
      .allow(null)
      .optional(),

    punchOut: Joi.date()
      .allow(null)
      .optional(),

    workingHours: Joi.number()
      .min(0)
      .optional(),

    otApplicable: Joi.boolean()
      .optional(),

    otHours: Joi.number()
      .min(0)
      .optional(),

    advance: Joi.object({
      amount: Joi.number()
        .min(0)
        .optional(),

      remark: Joi.string()
        .trim()
        .allow("", null)
        .optional(),
    }).optional(),

    remark: Joi.string()
      .trim()
      .allow("", null)
      .optional(),
  })
    .min(1)
    .required(),
});

module.exports = {
  createEmployeeAttendanceSchema,
  updateEmployeeAttendanceSchema,
};