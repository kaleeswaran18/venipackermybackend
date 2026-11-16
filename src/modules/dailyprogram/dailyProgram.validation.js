const Joi = require("joi");

// =========================
// CREATE DAILY PROGRAM
// =========================

const createDailyProgramSchema = Joi.object({
  date: Joi.date().required(),

  time: Joi.string()
    .trim()
    .required(),

  customerName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  contactPerson: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  location: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  purpose: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .required(),

  status: Joi.string()
    .valid(
      "Not Started",
      "In Progress",
      "Pending",
      "Completed"
    )
    .optional(),

  remarks: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .optional(),
});

// =========================
// UPDATE DAILY PROGRAM
// =========================

const updateDailyProgramSchema = Joi.object({
  date: Joi.date().optional(),

  time: Joi.string()
    .trim()
    .optional(),

  customerName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  contactPerson: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  location: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .optional(),

  purpose: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .optional(),

  status: Joi.string()
    .valid(
      "Not Started",
      "In Progress",
      "Pending",
      "Completed"
    )
    .optional(),

  remarks: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .optional(),
});

module.exports = {
  createDailyProgramSchema,
  updateDailyProgramSchema,
};