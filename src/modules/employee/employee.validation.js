const Joi = require("joi");

// =========================
// CREATE EMPLOYEE
// =========================

const createEmployeeSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  phone: Joi.string()
    .trim()
    .min(10)
    .max(15)
    .required(),

  permanentLocationId: Joi.string()
    .hex()
    .length(24)
    .required(),

  joiningDate: Joi.date()
    .required(),

  dailyWage: Joi.number()
    .min(0)
    .required(),

  isActive: Joi.boolean()
    .optional(),
});


// =========================
// UPDATE EMPLOYEE
// =========================

const updateEmployeeSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  phone: Joi.string()
    .trim()
    .min(10)
    .max(15)
    .optional(),

  permanentLocationId: Joi.string()
    .hex()
    .length(24)
    .optional(),

  joiningDate: Joi.date()
    .optional(),

  dailyWage: Joi.number()
    .min(0)
    .optional(),

  isActive: Joi.boolean()
    .optional(),
});


module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
};