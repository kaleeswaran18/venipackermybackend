const Joi = require("joi");

const objectId = Joi.string()
  .hex()
  .length(24);

// =========================
// CREATE WEEKLY SALARY
// =========================

const createWeeklySalarySchema = Joi.object({
  weekStartDate: Joi.date().required(),

  weekEndDate: Joi.date()
    .greater(Joi.ref("weekStartDate"))
    .required(),

  employees: Joi.array()
    .items(
      Joi.object({
        employeeId: objectId.required(),
      })
    )
    .min(1)
    .required(),

  paid: Joi.boolean().optional(),
});

// =========================
// UPDATE WEEKLY SALARY
// =========================

const updateWeeklySalarySchema = Joi.object({
  weekStartDate: Joi.date().optional(),

  weekEndDate: Joi.date()
    .greater(Joi.ref("weekStartDate"))
    .optional(),

  employees: Joi.array()
    .items(
      Joi.object({
        employeeId: objectId.required(),

        name: Joi.string()
          .trim()
          .optional(),

        workingDays: Joi.number()
          .min(0)
          .optional(),

        halfDays: Joi.number()
          .min(0)
          .optional(),

        leaveDays: Joi.number()
          .min(0)
          .optional(),

        totalWorkingHours: Joi.number()
          .min(0)
          .optional(),

        totalOTHours: Joi.number()
          .min(0)
          .optional(),

        dailyWage: Joi.number()
          .min(0)
          .optional(),

        basicSalary: Joi.number()
          .min(0)
          .optional(),

        otAmount: Joi.number()
          .min(0)
          .optional(),

        grossSalary: Joi.number()
          .min(0)
          .optional(),

        totalAdvance: Joi.number()
          .min(0)
          .optional(),

        finalPayable: Joi.number()
          .min(0)
          .optional(),
      })
    )
    .optional(),

  paid: Joi.boolean().optional(),
});

module.exports = {
  createWeeklySalarySchema,
  updateWeeklySalarySchema,
};